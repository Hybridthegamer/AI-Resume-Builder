const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  generateAIContent,
  computeATSScore,
  jobMatch,
} = require('../controllers/resumeController');

router.use(authenticate);

router.post('/', createResume);
router.get('/', getResumes);
router.get('/:id', getResume);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

router.post('/:id/generate', generateAIContent);
router.post('/:id/ats-score', computeATSScore);
router.post('/:id/job-match', jobMatch);

module.exports = router;
