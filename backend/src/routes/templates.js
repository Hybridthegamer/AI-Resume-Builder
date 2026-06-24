const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getTemplates, getTemplate } = require('../controllers/templateController');

router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplate);

module.exports = router;
