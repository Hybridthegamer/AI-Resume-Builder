const db = require('../config/database');
const cache = require('../config/cache');
const aiService = require('../services/aiService');
const atsService = require('../services/atsService');
const jobMatchService = require('../services/jobMatchService');

const createResume = async (req, res, next) => {
  try {
    const { title, template_id, sections } = req.body;
    const user_id = req.user.user_id;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Resume title is required.' });
    }

    // Verify template exists if provided
    if (template_id) {
      const tmpl = await db.query('SELECT template_id FROM templates WHERE template_id = $1', [template_id]);
      if (tmpl.rows.length === 0) {
        return res.status(400).json({ error: 'Template not found.' });
      }
    }

    const resumeResult = await db.query(
      'INSERT INTO resumes (user_id, title, template_id) VALUES ($1, $2, $3) RETURNING *',
      [user_id, title.trim(), template_id || null]
    );
    const resume = resumeResult.rows[0];

    // Insert sections if provided
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const { section_type, content } = sections[i];
        if (section_type && content) {
          await db.query(
            'INSERT INTO sections (resume_id, section_type, content, order_index) VALUES ($1, $2, $3, $4)',
            [resume.resume_id, section_type, JSON.stringify(content), i]
          );
        }
      }
    }

    // Clear user resume cache
    await cache.del(`resumes:user:${user_id}`);

    const fullResume = await getResumeWithSections(resume.resume_id);
    res.status(201).json({ message: 'Resume created successfully.', resume: fullResume });
  } catch (err) {
    next(err);
  }
};

const getResumes = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const cacheKey = `resumes:user:${user_id}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ resumes: cached });
    }

    const result = await db.query(
      `SELECT r.*, t.name as template_name
       FROM resumes r
       LEFT JOIN templates t ON r.template_id = t.template_id
       WHERE r.user_id = $1
       ORDER BY r.updated_at DESC`,
      [user_id]
    );

    await cache.set(cacheKey, result.rows, 300); // cache 5 min
    res.json({ resumes: result.rows });
  } catch (err) {
    next(err);
  }
};

const getResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const resume = await getResumeWithSections(id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (resume.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

const updateResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const { title, template_id, sections } = req.body;

    // Verify ownership
    const existing = await db.query(
      'SELECT resume_id, user_id FROM resumes WHERE resume_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Update resume metadata
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(title.trim());
      paramIndex++;
    }
    if (template_id !== undefined) {
      updateFields.push(`template_id = $${paramIndex}`);
      updateValues.push(template_id);
      paramIndex++;
    }
    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date());
    paramIndex++;

    updateValues.push(id);
    if (updateFields.length > 1) {
      await db.query(
        `UPDATE resumes SET ${updateFields.join(', ')} WHERE resume_id = $${paramIndex}`,
        updateValues
      );
    }

    // Update sections if provided
    if (sections && Array.isArray(sections)) {
      // Delete existing sections
      await db.query('DELETE FROM sections WHERE resume_id = $1', [id]);

      // Insert new sections
      for (let i = 0; i < sections.length; i++) {
        const { section_type, content } = sections[i];
        if (section_type && content) {
          await db.query(
            'INSERT INTO sections (resume_id, section_type, content, order_index) VALUES ($1, $2, $3, $4)',
            [id, section_type, JSON.stringify(content), i]
          );
        }
      }
    }

    // Clear caches
    await cache.del(`resumes:user:${user_id}`);

    const updated = await getResumeWithSections(id);
    res.json({ message: 'Resume updated successfully.', resume: updated });
  } catch (err) {
    next(err);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const existing = await db.query(
      'SELECT resume_id, user_id FROM resumes WHERE resume_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await db.query('DELETE FROM resumes WHERE resume_id = $1', [id]);
    await cache.del(`resumes:user:${user_id}`);

    res.json({ message: 'Resume deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const generateAIContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const existing = await db.query(
      'SELECT resume_id, user_id FROM resumes WHERE resume_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const resume = await getResumeWithSections(id);
    const generated = await aiService.generateContent(resume);

    // Upsert generated sections
    for (const section of generated.sections) {
      const existing_section = await db.query(
        'SELECT section_id FROM sections WHERE resume_id = $1 AND section_type = $2',
        [id, section.section_type]
      );

      if (existing_section.rows.length > 0) {
        await db.query(
          'UPDATE sections SET content = $1 WHERE section_id = $2',
          [JSON.stringify(section.content), existing_section.rows[0].section_id]
        );
      } else {
        await db.query(
          'INSERT INTO sections (resume_id, section_type, content, order_index) VALUES ($1, $2, $3, $4)',
          [id, section.section_type, JSON.stringify(section.content), section.order_index || 0]
        );
      }
    }

    // Update timestamp
    await db.query('UPDATE resumes SET updated_at = NOW() WHERE resume_id = $1', [id]);
    await cache.del(`resumes:user:${user_id}`);

    const updatedResume = await getResumeWithSections(id);
    res.json({
      message: 'AI content generated successfully.',
      resume: updatedResume,
    });
  } catch (err) {
    next(err);
  }
};

const computeATSScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const existing = await db.query(
      'SELECT resume_id, user_id FROM resumes WHERE resume_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const resume = await getResumeWithSections(id);
    const atsResult = atsService.computeScore(resume);

    // Update score in database
    await db.query('UPDATE resumes SET ats_score = $1, updated_at = NOW() WHERE resume_id = $2', [
      atsResult.score,
      id,
    ]);
    await cache.del(`resumes:user:${user_id}`);

    res.json({
      score: atsResult.score,
      keyword_coverage: atsResult.keyword_coverage,
      section_score: atsResult.section_score,
      format_score: atsResult.format_score,
      matched_keywords: atsResult.matched_keywords,
      improvement_flags: atsResult.improvement_flags,
      missing_sections: atsResult.missing_sections,
    });
  } catch (err) {
    next(err);
  }
};

const jobMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const { job_title, job_description } = req.body;

    if (!job_description || job_description.trim().length < 50) {
      return res.status(400).json({ error: 'Job description must be at least 50 characters.' });
    }

    const existing = await db.query(
      'SELECT resume_id, user_id FROM resumes WHERE resume_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const resume = await getResumeWithSections(id);
    const matchResult = jobMatchService.computeMatch(resume, job_description);

    // Save match result
    const savedMatch = await db.query(
      `INSERT INTO job_matches (resume_id, job_title, job_description, match_score, matched_keywords, missing_keywords)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        job_title || 'Unknown Position',
        job_description,
        matchResult.match_score,
        JSON.stringify(matchResult.matched_keywords),
        JSON.stringify(matchResult.missing_keywords),
      ]
    );

    res.json({
      match: savedMatch.rows[0],
      match_score: matchResult.match_score,
      matched_keywords: matchResult.matched_keywords,
      missing_keywords: matchResult.missing_keywords,
      recommendations: matchResult.recommendations,
    });
  } catch (err) {
    next(err);
  }
};

// Helper: get resume with sections
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

module.exports = {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  generateAIContent,
  computeATSScore,
  jobMatch,
};
