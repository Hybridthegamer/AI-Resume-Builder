const db = require('../config/database');
const exportService = require('../services/exportService');
const path = require('path');
const fs = require('fs');

const exportPDF = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const user_id = req.user.user_id;

    const resume = await getResumeWithSections(resumeId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (resume.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { filePath, fileName } = await exportService.exportToPDF(resume);
    const downloadUrl = `/api/exports/download-file/${path.basename(filePath)}`;

    const exportRecord = await db.query(
      `INSERT INTO exports (resume_id, format, file_path, download_url)
       VALUES ($1, 'pdf', $2, $3) RETURNING *`,
      [resumeId, filePath, downloadUrl]
    );

    res.json({
      message: 'PDF exported successfully.',
      export: exportRecord.rows[0],
      download_url: downloadUrl,
      export_id: exportRecord.rows[0].export_id,
    });
  } catch (err) {
    next(err);
  }
};

const exportDOCX = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const user_id = req.user.user_id;

    const resume = await getResumeWithSections(resumeId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (resume.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { filePath, fileName } = await exportService.exportToDOCX(resume);
    const downloadUrl = `/api/exports/download-file/${path.basename(filePath)}`;

    const exportRecord = await db.query(
      `INSERT INTO exports (resume_id, format, file_path, download_url)
       VALUES ($1, 'docx', $2, $3) RETURNING *`,
      [resumeId, filePath, downloadUrl]
    );

    res.json({
      message: 'DOCX exported successfully.',
      export: exportRecord.rows[0],
      download_url: downloadUrl,
      export_id: exportRecord.rows[0].export_id,
    });
  } catch (err) {
    next(err);
  }
};

const getExports = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const user_id = req.user.user_id;

    // Verify ownership
    const resume = await db.query(
      'SELECT user_id FROM resumes WHERE resume_id = $1',
      [resumeId]
    );
    if (resume.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (resume.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await db.query(
      'SELECT * FROM exports WHERE resume_id = $1 ORDER BY created_at DESC',
      [resumeId]
    );

    res.json({ exports: result.rows });
  } catch (err) {
    next(err);
  }
};

const downloadExport = async (req, res, next) => {
  try {
    const { exportId } = req.params;
    const user_id = req.user.user_id;

    const exportResult = await db.query(
      `SELECT e.*, r.user_id FROM exports e
       JOIN resumes r ON e.resume_id = r.resume_id
       WHERE e.export_id = $1`,
      [exportId]
    );

    if (exportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export not found.' });
    }
    if (exportResult.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const exportRecord = exportResult.rows[0];
    if (!exportRecord.file_path || !fs.existsSync(exportRecord.file_path)) {
      return res.status(404).json({ error: 'Export file not found.' });
    }

    const fileName = path.basename(exportRecord.file_path);
    const mimeType =
      exportRecord.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(exportRecord.file_path);
  } catch (err) {
    next(err);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Security: ensure file is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploads = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploads)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeType =
      ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(resolvedPath);
  } catch (err) {
    next(err);
  }
};

const getResumeWithSections = async (resumeId) => {
  const resumeResult = await db.query(
    `SELECT r.*, t.name as template_name, t.layout_json
     FROM resumes r
     LEFT JOIN templates t ON r.template_id = t.template_id
     WHERE r.resume_id = $1`,
    [resumeId]
  );

  if (resumeResult.rows.length === 0) return null;

  const resume = resumeResult.rows[0];
  const sectionsResult = await db.query(
    'SELECT * FROM sections WHERE resume_id = $1 ORDER BY order_index ASC',
    [resumeId]
  );
  resume.sections = sectionsResult.rows;
  return resume;
};

module.exports = { exportPDF, exportDOCX, getExports, downloadExport, downloadFile };
