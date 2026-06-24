const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
