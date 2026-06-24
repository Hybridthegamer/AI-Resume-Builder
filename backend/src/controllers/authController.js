const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '24h';

const register = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }
    if (full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if email already exists
    const existing = await db.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, full_name, email, created_at',
      [full_name.trim(), email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query(
      'SELECT user_id, full_name, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    // Count user resumes
    const resumeCount = await db.query(
      'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
      [req.user.user_id]
    );

    res.json({
      user: {
        ...req.user,
        resume_count: parseInt(resumeCount.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name, current_password, new_password } = req.body;

    if (!full_name && !new_password) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (full_name) {
      if (full_name.trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      updateFields.push(`full_name = $${paramIndex}`);
      updateValues.push(full_name.trim());
      paramIndex++;
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to change password.' });
      }
      if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
      }

      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [req.user.user_id]
      );
      const passwordMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
      updateFields.push(`password_hash = $${paramIndex}`);
      updateValues.push(newHash);
      paramIndex++;
    }

    updateValues.push(req.user.user_id);
    const result = await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, full_name, email, created_at`,
      updateValues
    );

    res.json({
      message: 'Profile updated successfully.',
      user: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile };
