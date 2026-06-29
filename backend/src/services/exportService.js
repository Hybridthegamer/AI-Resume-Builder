// Export Service: PDF and DOCX generation
const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

// Extract structured data from resume sections
const extractSectionData = (resume) => {
  const data = {
    personal_info: {},
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    achievements: [],
  };

  for (const section of resume.sections || []) {
    const content = section.content;
    switch (section.section_type) {
      case 'personal_info':
        data.personal_info = content;
        break;
      case 'summary':
        data.summary = content.text || content;
        break;
      case 'experience':
        data.experiences = Array.isArray(content) ? content : [content];
        break;
      case 'education':
        data.education = Array.isArray(content) ? content : [content];
        break;
      case 'skills':
        if (content.items) data.skills = content.items;
        else if (Array.isArray(content)) data.skills = content;
        else if (content.technical || content.soft) {
          data.skills = [...(content.technical || []), ...(content.soft || [])];
        }
        break;
      case 'certifications':
        data.certifications = Array.isArray(content) ? content : (content.items || []);
        break;
      case 'achievements':
        data.achievements = content.items || [];
        break;
    }
  }

  return data;
};

// Generate HTML for resume based on template
const generateResumeHTML = (resume) => {
  const data = extractSectionData(resume);
  const templateStyle = resume.layout_json?.style || 'modern';
  const name = data.personal_info.full_name || data.personal_info.name || resume.title || 'Resume';
  const email = data.personal_info.email || '';
  const phone = data.personal_info.phone || '';
  const location = data.personal_info.location || '';
  const linkedin = data.personal_info.linkedin || '';

  if (templateStyle === 'classic') {
    return generateClassicHTML(data, name, email, phone, location, linkedin);
  } else if (templateStyle === 'minimal') {
    return generateMinimalHTML(data, name, email, phone, location, linkedin);
  } else {
    return generateModernHTML(data, name, email, phone, location, linkedin);
  }
};

const generateModernHTML = (data, name, email, phone, location, linkedin) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: white; }
  .container { width: 794px; min-height: 1123px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #2563EB, #1E40AF); color: white; padding: 30px 40px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .header .contact { display: flex; flex-wrap: wrap; gap: 15px; font-size: 11px; opacity: 0.9; }
  .header .contact span::before { margin-right: 4px; }
  .body { display: flex; padding: 0; }
  .sidebar { width: 35%; background: #F8FAFC; padding: 25px 20px; border-right: 1px solid #E2E8F0; }
  .main { width: 65%; padding: 25px 30px; }
  .section-title { font-size: 13px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #2563EB; padding-bottom: 4px; margin-bottom: 12px; margin-top: 20px; }
  .section-title:first-child { margin-top: 0; }
  .summary-text { line-height: 1.6; color: #374151; margin-bottom: 8px; }
  .experience-item { margin-bottom: 16px; }
  .experience-title { font-weight: 600; font-size: 13px; color: #1a1a2e; }
  .experience-company { color: #2563EB; font-size: 11px; margin-bottom: 4px; }
  .experience-date { color: #6B7280; font-size: 10px; margin-bottom: 6px; }
  .experience-bullets li { margin-left: 15px; line-height: 1.5; color: #374151; margin-bottom: 2px; }
  .skill-item { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 4px; padding: 4px 8px; font-size: 10px; margin: 3px 0; display: inline-block; color: #1E40AF; }
  .edu-item { margin-bottom: 12px; }
  .edu-degree { font-weight: 600; font-size: 12px; }
  .edu-school { color: #2563EB; font-size: 11px; }
  .edu-year { color: #6B7280; font-size: 10px; }
  .cert-item { font-size: 11px; margin-bottom: 6px; color: #374151; }
  .achievement-item { font-size: 11px; margin-bottom: 6px; color: #374151; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(name)}</h1>
    <div class="contact">
      ${email ? `<span>✉ ${escapeHtml(email)}</span>` : ''}
      ${phone ? `<span>✆ ${escapeHtml(phone)}</span>` : ''}
      ${location ? `<span>⌖ ${escapeHtml(location)}</span>` : ''}
      ${linkedin ? `<span>in ${escapeHtml(linkedin)}</span>` : ''}
    </div>
  </div>
  <div class="body">
    <div class="sidebar">
      ${data.skills.length > 0 ? `
      <div class="section-title">Skills</div>
      <div>
        ${data.skills.map(s => `<span class="skill-item">${escapeHtml(typeof s === 'string' ? s : s.name || s.skill || '')}</span>`).join(' ')}
      </div>` : ''}

      ${data.education.length > 0 ? `
      <div class="section-title">Education</div>
      ${data.education.map(edu => `
        <div class="edu-item">
          <div class="edu-degree">${escapeHtml(edu.degree || '')}</div>
          <div class="edu-school">${escapeHtml(edu.institution || edu.school || '')}</div>
          ${edu.graduation_year || edu.year ? `<div class="edu-year">${escapeHtml(String(edu.graduation_year || edu.year || ''))}</div>` : ''}
          ${edu.coursework ? `<div style="font-size:10px;color:#6B7280;margin-top:2px">${escapeHtml(edu.coursework)}</div>` : ''}
        </div>
      `).join('')}` : ''}

      ${data.certifications.length > 0 ? `
      <div class="section-title">Certifications</div>
      ${data.certifications.map(c => `<div class="cert-item">• ${escapeHtml(typeof c === 'string' ? c : c.name || c.certification || '')}</div>`).join('')}
      ` : ''}
    </div>
    <div class="main">
      ${data.summary ? `
      <div class="section-title">Professional Summary</div>
      <p class="summary-text">${escapeHtml(typeof data.summary === 'string' ? data.summary : data.summary.text || '')}</p>
      ` : ''}

      ${data.experiences.length > 0 ? `
      <div class="section-title">Work Experience</div>
      ${data.experiences.map(exp => `
        <div class="experience-item">
          <div class="experience-title">${escapeHtml(exp.job_title || exp.title || '')}</div>
          <div class="experience-company">${escapeHtml(exp.employer || exp.company || '')}</div>
          <div class="experience-date">${escapeHtml(String(exp.start_date || exp.from || ''))} - ${escapeHtml(String(exp.end_date || exp.to || 'Present'))}</div>
          ${(exp.enhanced_bullets || []).length > 0 ? `
            <ul class="experience-bullets">
              ${exp.enhanced_bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
          ` : exp.responsibilities ? `<p style="color:#374151;line-height:1.5">${escapeHtml(exp.responsibilities)}</p>` : ''}
        </div>
      `).join('')}` : ''}

      ${data.achievements.length > 0 ? `
      <div class="section-title">Key Achievements</div>
      ${data.achievements.map(a => `<div class="achievement-item">★ ${escapeHtml(typeof a === 'string' ? a : a.text || '')}</div>`).join('')}
      ` : ''}
    </div>
  </div>
</div>
</body>
</html>`;

const generateClassicHTML = (data, name, email, phone, location, linkedin) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: #1a1a1a; background: white; }
  .container { width: 794px; min-height: 1123px; margin: 0 auto; padding: 50px 60px; }
  .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
  .header h1 { font-size: 30px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  .header .contact { font-size: 11px; color: #4a4a4a; margin-top: 8px; }
  .header .contact span { margin: 0 10px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 12px; color: #1a1a1a; }
  .summary-text { line-height: 1.7; text-align: justify; }
  .experience-item { margin-bottom: 14px; }
  .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
  .exp-title { font-weight: 700; font-size: 12px; }
  .exp-date { font-style: italic; font-size: 11px; color: #4a4a4a; }
  .exp-company { font-style: italic; color: #4a4a4a; margin-bottom: 5px; }
  .exp-bullets li { margin-left: 20px; line-height: 1.6; margin-bottom: 2px; }
  .edu-item { margin-bottom: 10px; }
  .edu-header { display: flex; justify-content: space-between; }
  .edu-degree { font-weight: 700; }
  .edu-school { font-style: italic; color: #4a4a4a; }
  .skills-grid { columns: 2; gap: 10px; }
  .skill-item { margin-bottom: 4px; line-height: 1.5; }
  .skill-item::before { content: "• "; }
  .cert-item { margin-bottom: 4px; }
  .cert-item::before { content: "• "; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(name)}</h1>
    <div class="contact">
      ${[email, phone, location, linkedin].filter(Boolean).map(v => `<span>${escapeHtml(v)}</span>`).join(' | ')}
    </div>
  </div>

  ${data.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p class="summary-text">${escapeHtml(typeof data.summary === 'string' ? data.summary : data.summary.text || '')}</p>
  </div>` : ''}

  ${data.experiences.length > 0 ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${data.experiences.map(exp => `
      <div class="experience-item">
        <div class="exp-header">
          <span class="exp-title">${escapeHtml(exp.job_title || exp.title || '')}</span>
          <span class="exp-date">${escapeHtml(String(exp.start_date || exp.from || ''))} – ${escapeHtml(String(exp.end_date || exp.to || 'Present'))}</span>
        </div>
        <div class="exp-company">${escapeHtml(exp.employer || exp.company || '')}</div>
        ${(exp.enhanced_bullets || []).length > 0 ? `
          <ul class="exp-bullets">
            ${exp.enhanced_bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        ` : exp.responsibilities ? `<p style="margin-top:4px;line-height:1.6">${escapeHtml(exp.responsibilities)}</p>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  ${data.education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${data.education.map(edu => `
      <div class="edu-item">
        <div class="edu-header">
          <span class="edu-degree">${escapeHtml(edu.degree || '')}</span>
          <span style="font-style:italic;font-size:11px;color:#4a4a4a">${escapeHtml(String(edu.graduation_year || edu.year || ''))}</span>
        </div>
        <div class="edu-school">${escapeHtml(edu.institution || edu.school || '')}</div>
        ${edu.coursework ? `<div style="font-size:11px;margin-top:2px">${escapeHtml(edu.coursework)}</div>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  ${data.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills & Competencies</div>
    <div class="skills-grid">
      ${data.skills.map(s => `<div class="skill-item">${escapeHtml(typeof s === 'string' ? s : s.name || s.skill || '')}</div>`).join('')}
    </div>
  </div>` : ''}

  ${data.certifications.length > 0 ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${data.certifications.map(c => `<div class="cert-item">${escapeHtml(typeof c === 'string' ? c : c.name || c.certification || '')}</div>`).join('')}
  </div>` : ''}
</div>
</body>
</html>`;

const generateMinimalHTML = (data, name, email, phone, location, linkedin) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111827; background: white; }
  .container { width: 794px; min-height: 1123px; margin: 0 auto; padding: 45px 55px; }
  .header { margin-bottom: 30px; }
  .header h1 { font-size: 26px; font-weight: 300; letter-spacing: 1px; color: #111827; }
  .header h1 span { font-weight: 700; color: #0F766E; }
  .header .subtitle { font-size: 11px; color: #6B7280; margin-top: 6px; }
  .header .contact { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #4B5563; }
  .divider { height: 1px; background: linear-gradient(to right, #0F766E, transparent); margin: 6px 0 20px; }
  .section { margin-bottom: 22px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #0F766E; margin-bottom: 10px; }
  .summary-text { line-height: 1.7; color: #374151; font-size: 12px; }
  .experience-item { margin-bottom: 16px; display: grid; grid-template-columns: 1fr auto; gap: 0 20px; }
  .exp-left { }
  .exp-right { text-align: right; white-space: nowrap; }
  .exp-title { font-weight: 600; font-size: 13px; color: #111827; }
  .exp-company { font-size: 11px; color: #0F766E; margin-top: 2px; }
  .exp-date { font-size: 10px; color: #9CA3AF; }
  .exp-bullets { margin-top: 6px; padding-left: 15px; }
  .exp-bullets li { line-height: 1.6; color: #374151; margin-bottom: 2px; font-size: 11px; }
  .edu-item { margin-bottom: 10px; display: flex; justify-content: space-between; }
  .edu-degree { font-weight: 600; font-size: 12px; }
  .edu-school { font-size: 11px; color: #6B7280; }
  .skills-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { font-size: 10px; padding: 3px 10px; border: 1px solid #D1FAE5; background: #F0FDF4; color: #065F46; border-radius: 20px; }
  .cert-item { font-size: 11px; color: #374151; margin-bottom: 5px; }
  .cert-item::before { content: "→ "; color: #0F766E; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(name.split(' ')[0])} <span>${escapeHtml(name.split(' ').slice(1).join(' '))}</span></h1>
    <div class="contact">
      ${email ? `<span>${escapeHtml(email)}</span>` : ''}
      ${phone ? `<span>${escapeHtml(phone)}</span>` : ''}
      ${location ? `<span>${escapeHtml(location)}</span>` : ''}
      ${linkedin ? `<span>${escapeHtml(linkedin)}</span>` : ''}
    </div>
  </div>
  <div class="divider"></div>

  ${data.summary ? `
  <div class="section">
    <div class="section-title">Summary</div>
    <p class="summary-text">${escapeHtml(typeof data.summary === 'string' ? data.summary : data.summary.text || '')}</p>
  </div>` : ''}

  ${data.experiences.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${data.experiences.map(exp => `
      <div class="experience-item">
        <div class="exp-left">
          <div class="exp-title">${escapeHtml(exp.job_title || exp.title || '')}</div>
          <div class="exp-company">${escapeHtml(exp.employer || exp.company || '')}</div>
          ${(exp.enhanced_bullets || []).length > 0 ? `
            <ul class="exp-bullets">
              ${exp.enhanced_bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
          ` : exp.responsibilities ? `<p style="margin-top:6px;line-height:1.6;font-size:11px;color:#374151">${escapeHtml(exp.responsibilities)}</p>` : ''}
        </div>
        <div class="exp-right">
          <div class="exp-date">${escapeHtml(String(exp.start_date || exp.from || ''))} – ${escapeHtml(String(exp.end_date || exp.to || 'Present'))}</div>
        </div>
      </div>
    `).join('')}
  </div>` : ''}

  ${data.education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${data.education.map(edu => `
      <div class="edu-item">
        <div>
          <div class="edu-degree">${escapeHtml(edu.degree || '')}</div>
          <div class="edu-school">${escapeHtml(edu.institution || edu.school || '')}</div>
        </div>
        <div style="font-size:10px;color:#9CA3AF;text-align:right">${escapeHtml(String(edu.graduation_year || edu.year || ''))}</div>
      </div>
    `).join('')}
  </div>` : ''}

  ${data.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-row">
      ${data.skills.map(s => `<span class="skill-tag">${escapeHtml(typeof s === 'string' ? s : s.name || s.skill || '')}</span>`).join('')}
    </div>
  </div>` : ''}

  ${data.certifications.length > 0 ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${data.certifications.map(c => `<div class="cert-item">${escapeHtml(typeof c === 'string' ? c : c.name || c.certification || '')}</div>`).join('')}
  </div>` : ''}
</div>
</body>
</html>`;

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Export to PDF using html-pdf-node
const exportToPDF = async (resume) => {
  ensureUploadsDir();

  const html = generateResumeHTML(resume);
  const fileName = `resume_${resume.resume_id}_${Date.now()}.pdf`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  try {
    const htmlPdf = require('html-pdf-node');
    const file = { content: html };
    const options = {
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true,
      // Required for Linux/Docker environments (no display server)
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    fs.writeFileSync(filePath, pdfBuffer);
  } catch (err) {
    console.warn('html-pdf-node failed:', err.message);
    throw new Error('PDF generation failed. Ensure Chromium/Puppeteer is available. Run: npm install in the backend directory.');
  }

  return { filePath, fileName };
};

// Export to DOCX using docx library
const exportToDOCX = async (resume) => {
  ensureUploadsDir();

  const data = extractSectionData(resume);
  const name = data.personal_info.full_name || data.personal_info.name || resume.title || 'Resume';
  const email = data.personal_info.email || '';
  const phone = data.personal_info.phone || '';
  const location = data.personal_info.location || '';

  const children = [];

  // Header: Name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: 40, color: '2563EB' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact info
  const contactParts = [email, phone, location].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  |  '), size: 20, color: '4B5563' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  // Professional Summary
  if (data.summary) {
    const summaryText = typeof data.summary === 'string' ? data.summary : data.summary.text || '';
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 24, color: '2563EB' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' } },
        spacing: { after: 150, before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: summaryText, size: 22 })],
        spacing: { after: 200 },
      })
    );
  }

  // Work Experience
  if (data.experiences.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 24, color: '2563EB' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' } },
        spacing: { after: 150, before: 200 },
      })
    );

    for (const exp of data.experiences) {
      const title = exp.job_title || exp.title || '';
      const company = exp.employer || exp.company || '';
      const dateRange = `${exp.start_date || exp.from || ''} - ${exp.end_date || exp.to || 'Present'}`;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true, size: 22 }),
            new TextRun({ text: `  |  ${company}  |  ${dateRange}`, size: 20, color: '6B7280' }),
          ],
          spacing: { after: 80 },
        })
      );

      const bullets = exp.enhanced_bullets || [];
      if (bullets.length > 0) {
        for (const bullet of bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${bullet}`, size: 20 })],
              spacing: { after: 60 },
              indent: { left: 360 },
            })
          );
        }
      } else if (exp.responsibilities) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: exp.responsibilities, size: 20 })],
            spacing: { after: 80 },
            indent: { left: 360 },
          })
        );
      }

      children.push(new Paragraph({ spacing: { after: 100 } }));
    }
  }

  // Education
  if (data.education.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, color: '2563EB' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' } },
        spacing: { after: 150, before: 200 },
      })
    );

    for (const edu of data.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree || '', bold: true, size: 22 }),
            new TextRun({ text: `  –  ${edu.institution || edu.school || ''}  ${edu.graduation_year || edu.year || ''}`, size: 20, color: '6B7280' }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Skills
  if (data.skills.length > 0) {
    const skillNames = data.skills.map(s => typeof s === 'string' ? s : s.name || s.skill || '').filter(Boolean);
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 24, color: '2563EB' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' } },
        spacing: { after: 150, before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: skillNames.join('  •  '), size: 20 })],
        spacing: { after: 200 },
      })
    );
  }

  // Certifications
  if (data.certifications.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24, color: '2563EB' })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' } },
        spacing: { after: 150, before: 200 },
      })
    );
    for (const cert of data.certifications) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${typeof cert === 'string' ? cert : cert.name || cert.certification || ''}`, size: 20 })],
          spacing: { after: 80 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    creator: 'AI Resume Builder',
    title: name,
  });

  const fileName = `resume_${resume.resume_id}_${Date.now()}.docx`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return { filePath, fileName };
};

module.exports = { exportToPDF, exportToDOCX, generateResumeHTML, extractSectionData };
