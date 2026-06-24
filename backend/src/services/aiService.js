// AI Content Generation Service using Claude API
// Model: claude-sonnet-4-6

const Anthropic = require('@anthropic-ai/sdk');

let anthropicClient = null;

const getClient = () => {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
};

// Extract profile data from resume sections
const extractProfile = (resume) => {
  const sections = resume.sections || [];
  const profile = {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    objectives: '',
  };

  for (const section of sections) {
    const content = section.content;

    switch (section.section_type) {
      case 'personal_info':
        profile.full_name = content.full_name || content.name || '';
        profile.email = content.email || '';
        profile.phone = content.phone || '';
        profile.location = content.location || '';
        profile.linkedin = content.linkedin || '';
        break;

      case 'experience':
        if (Array.isArray(content)) {
          profile.experiences = content;
        } else if (content.entries && Array.isArray(content.entries)) {
          profile.experiences = content.entries;
        } else if (content.job_title) {
          profile.experiences = [content];
        }
        break;

      case 'education':
        if (Array.isArray(content)) {
          profile.education = content;
        } else if (content.entries && Array.isArray(content.entries)) {
          profile.education = content.entries;
        } else if (content.degree) {
          profile.education = [content];
        }
        break;

      case 'skills':
        if (Array.isArray(content)) {
          profile.skills = content;
        } else if (content.technical || content.soft) {
          profile.skills = [
            ...(content.technical || []).map((s) => (typeof s === 'string' ? { name: s, type: 'technical' } : s)),
            ...(content.soft || []).map((s) => (typeof s === 'string' ? { name: s, type: 'soft' } : s)),
          ];
        }
        break;

      case 'certifications':
        if (Array.isArray(content)) {
          profile.certifications = content;
        } else if (content.items) {
          profile.certifications = content.items;
        }
        break;

      case 'objectives':
        profile.objectives = typeof content === 'string' ? content : (content.text || '');
        break;
    }
  }

  return profile;
};

// Validate profile has minimum required data
const validateProfile = (profile) => {
  const errors = [];
  if (!profile.full_name || profile.full_name.trim().length < 2) {
    errors.push('Profile must include a full name.');
  }
  if (profile.experiences.length === 0) {
    errors.push('Profile must include at least one work experience.');
  }
  if (profile.skills.length === 0) {
    errors.push('Profile must include at least one skill.');
  }
  return errors;
};

// Construct structured prompt for Claude
const buildPrompt = (profile) => {
  const experienceText = profile.experiences
    .map((exp) => {
      const title = exp.job_title || exp.title || 'Unknown Title';
      const company = exp.employer || exp.company || 'Unknown Company';
      const start = exp.start_date || exp.from || '';
      const end = exp.end_date || exp.to || 'Present';
      const responsibilities = exp.responsibilities || exp.description || '';
      return `- ${title} at ${company} (${start} - ${end}): ${responsibilities}`;
    })
    .join('\n');

  const educationText = profile.education
    .map((edu) => {
      const degree = edu.degree || 'Unknown Degree';
      const institution = edu.institution || edu.school || 'Unknown Institution';
      const year = edu.graduation_year || edu.year || '';
      return `- ${degree} from ${institution} ${year ? `(${year})` : ''}`;
    })
    .join('\n');

  const skillsText = profile.skills
    .map((s) => (typeof s === 'string' ? s : s.name || s.skill || ''))
    .filter(Boolean)
    .join(', ');

  const certText = profile.certifications
    .map((c) => (typeof c === 'string' ? c : c.name || c.certification || ''))
    .filter(Boolean)
    .join(', ');

  return `You are an expert resume writer and career coach. Generate professional resume content for the following candidate profile. Your response must be in valid JSON format.

Candidate Profile:
- Name: ${profile.full_name}
- Location: ${profile.location || 'Not specified'}
- Work Experience:
${experienceText || '- Not specified'}
- Education:
${educationText || '- Not specified'}
- Skills: ${skillsText || 'Not specified'}
${certText ? `- Certifications: ${certText}` : ''}
${profile.objectives ? `- Career Objectives: ${profile.objectives}` : ''}

Generate the following resume content in JSON format:

{
  "professional_summary": "A compelling 3-4 sentence professional summary highlighting key strengths, experience level, and career value proposition",
  "enhanced_experiences": [
    {
      "original_title": "exact job title from input",
      "original_company": "exact company from input",
      "bullet_points": ["Achievement-focused bullet point 1", "Achievement-focused bullet point 2", "Achievement-focused bullet point 3"]
    }
  ],
  "skills_description": "A brief paragraph describing the candidate's technical and soft skills in context",
  "key_achievements": ["Notable achievement 1", "Notable achievement 2", "Notable achievement 3"]
}

Requirements:
1. Professional summary must be ATS-optimized with relevant keywords
2. Experience bullet points must start with strong action verbs (Developed, Led, Implemented, Optimized, etc.)
3. Quantify achievements where possible (use placeholder metrics if needed like "X% improvement")
4. Keep language professional and concise
5. Return ONLY valid JSON, no additional text`;
};

// Parse Claude's response
const parseResponse = (responseText, profile) => {
  try {
    // Clean up response - remove markdown code blocks if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    const sections = [];

    // Professional Summary section
    if (parsed.professional_summary) {
      sections.push({
        section_type: 'summary',
        content: { text: parsed.professional_summary },
        order_index: 1,
      });
    }

    // Enhanced experience sections
    if (parsed.enhanced_experiences && Array.isArray(parsed.enhanced_experiences)) {
      const enhancedExperiences = profile.experiences.map((exp, index) => {
        const enhanced = parsed.enhanced_experiences[index];
        const title = exp.job_title || exp.title || 'Unknown Title';
        const company = exp.employer || exp.company || 'Unknown Company';

        return {
          ...exp,
          enhanced_bullets: enhanced ? enhanced.bullet_points : [],
        };
      });

      sections.push({
        section_type: 'experience',
        content: enhancedExperiences,
        order_index: 2,
      });
    }

    // Skills description
    if (parsed.skills_description) {
      const skillsContent = {
        description: parsed.skills_description,
        items: profile.skills,
      };
      sections.push({
        section_type: 'skills',
        content: skillsContent,
        order_index: 3,
      });
    }

    // Key achievements (add to summary section or create achievements section)
    if (parsed.key_achievements && parsed.key_achievements.length > 0) {
      sections.push({
        section_type: 'achievements',
        content: { items: parsed.key_achievements },
        order_index: 4,
      });
    }

    return { sections, raw: parsed };
  } catch (err) {
    console.error('Failed to parse AI response:', err.message);
    // Return fallback content
    return {
      sections: [
        {
          section_type: 'summary',
          content: {
            text: `Experienced professional with a strong background in ${profile.skills.slice(0, 3).map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}. Proven track record of delivering results and driving organisational success.`,
          },
          order_index: 1,
        },
      ],
      raw: {},
    };
  }
};

// Main content generation function
const generateContent = async (resume) => {
  const profile = extractProfile(resume);

  // Validate profile
  const errors = validateProfile(profile);
  if (errors.length > 0) {
    throw Object.assign(new Error(errors.join(' ')), { status: 400, name: 'ValidationError' });
  }

  const client = getClient();
  const prompt = buildPrompt(profile);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const result = parseResponse(responseText, profile);

  return result;
};

module.exports = { generateContent, extractProfile, validateProfile };
