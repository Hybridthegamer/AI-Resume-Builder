// ATS Scoring Service
// Based on Algorithm from Section 3.8

// Common professional keyword dictionary (~100 keywords)
const ATS_KEYWORD_DICTIONARY = [
  // Leadership & Management
  'leadership', 'management', 'managed', 'led', 'directed', 'supervised', 'oversaw',
  'coordinated', 'organized', 'delegated', 'mentored', 'coached', 'trained',
  'strategic', 'planning', 'execution', 'decision-making',

  // Technical Skills
  'javascript', 'python', 'java', 'sql', 'html', 'css', 'react', 'nodejs', 'node.js',
  'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'mysql', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'linux', 'api', 'rest',
  'graphql', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd',

  // Action Verbs
  'developed', 'implemented', 'designed', 'built', 'created', 'architected',
  'improved', 'optimized', 'increased', 'reduced', 'achieved', 'delivered',
  'launched', 'deployed', 'maintained', 'collaborated', 'communicated', 'presented',
  'analyzed', 'researched', 'identified', 'resolved', 'troubleshot', 'debugged',

  // Soft Skills
  'communication', 'teamwork', 'problem-solving', 'analytical', 'critical thinking',
  'adaptability', 'creativity', 'innovation', 'initiative', 'responsibility',
  'attention to detail', 'time management', 'multitasking', 'interpersonal',

  // Business & Project
  'project management', 'product management', 'stakeholder', 'requirements',
  'budget', 'deadline', 'milestone', 'deliverable', 'kpi', 'metrics',
  'performance', 'efficiency', 'productivity', 'quality', 'process',
  'workflow', 'documentation', 'reporting', 'presentation', 'strategy',

  // Education & Certification
  'bachelor', 'master', 'degree', 'certified', 'certification', 'training',
  'professional', 'experience', 'expertise', 'proficient', 'skilled',
];

// Stop words to remove during tokenisation
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'for', 'of', 'and', 'or',
  'but', 'to', 'from', 'with', 'by', 'as', 'it', 'its', 'be', 'was', 'were',
  'are', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor', 'so', 'yet',
  'both', 'either', 'neither', 'than', 'too', 'very', 'just', 'more', 'most',
  'such', 'that', 'this', 'these', 'those', 'i', 'my', 'we', 'our', 'you',
  'your', 'he', 'his', 'she', 'her', 'they', 'their', 'what', 'which', 'who',
  'how', 'when', 'where', 'why', 'all', 'each', 'every', 'any', 'some', 'few',
  'also', 'about', 'up', 'out', 'if', 'then', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'me', 'him', 'them', 'us',
]);

// Tokenise text: lowercase, remove punctuation, remove stop words
const tokenise = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\/\.]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
};

// Extract all text from resume sections
const extractResumeText = (resume) => {
  const parts = [];
  if (!resume.sections) return '';

  for (const section of resume.sections) {
    const content = section.content;
    if (!content) continue;

    if (typeof content === 'string') {
      parts.push(content);
    } else if (typeof content === 'object') {
      const stringify = (obj) => {
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) return obj.map(stringify).join(' ');
        if (typeof obj === 'object' && obj !== null) return Object.values(obj).map(stringify).join(' ');
        return String(obj || '');
      };
      parts.push(stringify(content));
    }
  }

  return parts.join(' ');
};

// Identify which mandatory sections are present
const getMandatorySections = (resume) => {
  const mandatory = ['summary', 'experience', 'education', 'skills'];
  const present = new Set((resume.sections || []).map((s) => s.section_type));

  const found = mandatory.filter((s) => present.has(s));
  const missing = mandatory.filter((s) => !present.has(s));

  return { found, missing };
};

// Main ATS scoring algorithm from Section 3.8
const computeScore = (resume) => {
  const resumeText = extractResumeText(resume);
  const resumeTokens = new Set(tokenise(resumeText));

  // keyword_coverage = |W ∩ K| / |K| × 100
  const K = ATS_KEYWORD_DICTIONARY;
  const matched = K.filter((keyword) => {
    // Support multi-word keywords
    const kwTokens = tokenise(keyword);
    return kwTokens.every((t) => resumeTokens.has(t)) || resumeText.toLowerCase().includes(keyword.toLowerCase());
  });

  const keyword_coverage = K.length > 0 ? (matched.length / K.length) * 100 : 0;

  // section_score: deduct 10 points per missing mandatory section
  const { found: foundSections, missing: missingSections } = getMandatorySections(resume);
  const section_score = Math.max(0, 100 - missingSections.length * 10);

  // format_score: starts at 100 for clean text (no special characters/tables)
  let format_score = 100;
  if (resumeText.length < 100) format_score -= 30;
  if (resumeText.length < 300) format_score -= 20;

  // S = (keyword_coverage × 0.6) + (section_score × 0.3) + (format_score × 0.1)
  const score = keyword_coverage * 0.6 + section_score * 0.3 + format_score * 0.1;
  const finalScore = Math.min(100, Math.max(0, Math.round(score * 10) / 10));

  // Generate improvement flags
  const improvement_flags = [];

  if (keyword_coverage < 30) {
    improvement_flags.push('Add more industry-standard keywords to improve keyword coverage.');
  }
  if (missingSections.includes('summary')) {
    improvement_flags.push('Add a Professional Summary section to improve your ATS score.');
  }
  if (missingSections.includes('experience')) {
    improvement_flags.push('Add Work Experience sections with detailed responsibilities.');
  }
  if (missingSections.includes('education')) {
    improvement_flags.push('Include your Education history.');
  }
  if (missingSections.includes('skills')) {
    improvement_flags.push('List your technical and soft skills explicitly.');
  }
  if (resumeText.length < 300) {
    improvement_flags.push('Your resume content is too brief. Add more detail to your sections.');
  }
  if (finalScore < 60) {
    improvement_flags.push('Consider using the AI content generator to enhance your resume content.');
  }

  return {
    score: finalScore,
    keyword_coverage: Math.round(keyword_coverage * 10) / 10,
    section_score,
    format_score,
    matched_keywords: matched.slice(0, 20),
    missing_sections: missingSections,
    improvement_flags,
  };
};

module.exports = { computeScore, tokenise, STOP_WORDS, ATS_KEYWORD_DICTIONARY };
