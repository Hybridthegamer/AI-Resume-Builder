const db = require('../config/database');
const cache = require('../config/cache');

const getTemplates = async (req, res, next) => {
  try {
    const cacheKey = 'templates:all';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ templates: cached });
    }

    const result = await db.query(
      'SELECT * FROM templates ORDER BY is_premium ASC, name ASC'
    );

    await cache.set(cacheKey, result.rows, 3600); // cache 1 hour
    res.json({ templates: result.rows });
  } catch (err) {
    next(err);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM templates WHERE template_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    res.json({ template: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplates, getTemplate };
