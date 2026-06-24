const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  exportPDF,
  exportDOCX,
  getExports,
  downloadExport,
  downloadFile,
} = require('../controllers/exportController');

router.use(authenticate);

router.post('/:resumeId/pdf', exportPDF);
router.post('/:resumeId/docx', exportDOCX);
router.get('/:resumeId', getExports);
router.get('/download/:exportId', downloadExport);
router.get('/download-file/:filename', downloadFile);

module.exports = router;
