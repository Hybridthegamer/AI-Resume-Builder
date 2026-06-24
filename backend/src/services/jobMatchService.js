// Job Description Matching Service
// Algorithm from Section 3.8

const { tokenise, STOP_WORDS } = require('./atsService');

// Extract keywords from job description
const extractJobKeywords = (jobDescription) => {
  const tokens = tokenise(jobDescription);
  // Return unique keywords with frequency > 1 or length > 4 (important terms)
  const freq = {};
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }
  return Object.keys(freq).filter((k) => k.length > 3 || freq[k] > 1);
};

// Extract keywords from resume text
const extractResumeKeywords = (resume) => {
  const parts = [];
  if (!resume.sections) return new Set();

  for (const section of resume.sections) {
    const content = section.content;
    if (!content) continue;

    const stringify = (obj) => {
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) return obj.map(stringify).join(' ');
      if (typeof obj === 'object' && obj !== null) return Object.values(obj).map(stringify).join(' ');
      return String(obj || '');
    };
    parts.push(stringify(content));
  }

  const text = parts.join(' ');
  const tokens = tokenise(text);
  return new Set(tokens);
};

// Main job matching algorithm from Section 3.8
const computeMatch = (resume, jobDescription) => {
  // Extract K_J from job description
  const K_J = new Set(extractJobKeywords(jobDescription));

  // Extract K_R from resume
  const K_R = extractResumeKeywords(resume);

  // K_match = K_R ∩ K_J
  const K_match = [...K_J].filter((k) => K_R.has(k));

  // K_miss = K_J \ K_R
  const K_miss = [...K_J].filter((k) => !K_R.has(k));

  // M = |K_match| / |K_J| × 100
  const match_score = K_J.size > 0 ? (K_match.length / K_J.size) * 100 : 0;
  const finalScore = Math.round(match_score * 10) / 10;

  // Generate recommendations
  const recommendations = [];

  if (finalScore < 50) {
    recommendations.push('Your resume matches less than 50% of the job requirements. Consider tailoring it specifically for this role.');
  }
  if (K_miss.length > 0) {
    const topMissing = K_miss.slice(0, 5);
    recommendations.push(`Consider adding these key terms from the job description: ${topMissing.join(', ')}.`);
  }
  if (finalScore >= 70) {
    recommendations.push('Great match! Your resume aligns well with this job description.');
  } else if (finalScore >= 50) {
    recommendations.push('Moderate match. Incorporate more keywords from the job description to improve your chances.');
  }

  return {
    match_score: finalScore,
    matched_keywords: K_match.slice(0, 30),
    missing_keywords: K_miss.slice(0, 30),
    recommendations,
  };
};

module.exports = { computeMatch, extractJobKeywords };
