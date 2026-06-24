import React from 'react';

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const extractSectionData = (sections = []) => {
  const data = {
    personal_info: {},
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    achievements: [],
  };

  for (const section of sections) {
    const content = section.content;
    switch (section.section_type) {
      case 'personal_info':
        data.personal_info = content || {};
        break;
      case 'summary':
        data.summary = (content && (content.text || content)) || '';
        break;
      case 'experience':
        data.experiences = Array.isArray(content) ? content : content ? [content] : [];
        break;
      case 'education':
        data.education = Array.isArray(content) ? content : content ? [content] : [];
        break;
      case 'skills':
        if (content?.items) data.skills = content.items;
        else if (Array.isArray(content)) data.skills = content;
        else if (content?.technical || content?.soft) {
          data.skills = [...(content.technical || []), ...(content.soft || [])];
        }
        break;
      case 'certifications':
        data.certifications = Array.isArray(content) ? content : (content?.items || []);
        break;
      case 'achievements':
        data.achievements = content?.items || [];
        break;
    }
  }
  return data;
};

const ModernTemplate = ({ data, name, email, phone, location, linkedin }) => (
  <div style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#1a1a2e', background: 'white', width: '100%' }}>
    {/* Header */}
    <div style={{ background: 'linear-gradient(135deg, #2563EB, #1E40AF)', color: 'white', padding: '24px 32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>{name}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', opacity: 0.9 }}>
        {email && <span>✉ {email}</span>}
        {phone && <span>✆ {phone}</span>}
        {location && <span>⌖ {location}</span>}
        {linkedin && <span>in {linkedin}</span>}
      </div>
    </div>
    {/* Body */}
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: '35%', background: '#F8FAFC', padding: '20px 16px', borderRight: '1px solid #E2E8F0' }}>
        {data.skills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #2563EB', paddingBottom: '4px', marginBottom: '10px' }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#1E40AF' }}>
                  {typeof s === 'string' ? s : s.name || s.skill || ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #2563EB', paddingBottom: '4px', marginBottom: '10px' }}>Education</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: '600', fontSize: '11px' }}>{edu.degree}</div>
                <div style={{ color: '#2563EB', fontSize: '10px' }}>{edu.institution || edu.school}</div>
                {(edu.graduation_year || edu.year) && <div style={{ color: '#6B7280', fontSize: '10px' }}>{edu.graduation_year || edu.year}</div>}
              </div>
            ))}
          </div>
        )}
        {data.certifications.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #2563EB', paddingBottom: '4px', marginBottom: '10px' }}>Certifications</div>
            {data.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: '10px', marginBottom: '4px' }}>• {typeof c === 'string' ? c : c.name || c.certification || ''}</div>
            ))}
          </div>
        )}
      </div>
      {/* Main */}
      <div style={{ width: '65%', padding: '20px 24px' }}>
        {data.summary && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #2563EB', paddingBottom: '4px', marginBottom: '10px' }}>Professional Summary</div>
            <p style={{ lineHeight: '1.6', color: '#374151' }}>{typeof data.summary === 'string' ? data.summary : data.summary.text || ''}</p>
          </div>
        )}
        {data.experiences.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #2563EB', paddingBottom: '4px', marginBottom: '10px' }}>Work Experience</div>
            {data.experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: '600', fontSize: '12px' }}>{exp.job_title || exp.title}</div>
                <div style={{ color: '#2563EB', fontSize: '11px' }}>{exp.employer || exp.company}</div>
                <div style={{ color: '#6B7280', fontSize: '10px', marginBottom: '4px' }}>{exp.start_date || exp.from} - {exp.end_date || exp.to || 'Present'}</div>
                {(exp.enhanced_bullets || []).length > 0 ? (
                  <ul style={{ paddingLeft: '14px' }}>
                    {exp.enhanced_bullets.map((b, j) => <li key={j} style={{ lineHeight: '1.5', color: '#374151', marginBottom: '2px' }}>{b}</li>)}
                  </ul>
                ) : exp.responsibilities ? (
                  <p style={{ color: '#374151', lineHeight: '1.5' }}>{exp.responsibilities}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ClassicTemplate = ({ data, name, email, phone, location, linkedin }) => (
  <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: '12px', color: '#1a1a1a', background: 'white', padding: '40px 48px' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: '16px', marginBottom: '20px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>{name}</h1>
      <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '6px' }}>
        {[email, phone, location, linkedin].filter(Boolean).join('  |  ')}
      </div>
    </div>
    {data.summary && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #1a1a1a', paddingBottom: '4px', marginBottom: '10px' }}>Professional Summary</div>
        <p style={{ lineHeight: '1.7', textAlign: 'justify' }}>{typeof data.summary === 'string' ? data.summary : data.summary.text || ''}</p>
      </div>
    )}
    {data.experiences.length > 0 && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #1a1a1a', paddingBottom: '4px', marginBottom: '10px' }}>Professional Experience</div>
        {data.experiences.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700' }}>{exp.job_title || exp.title}</span>
              <span style={{ fontStyle: 'italic', fontSize: '11px', color: '#4a4a4a' }}>{exp.start_date || exp.from} – {exp.end_date || exp.to || 'Present'}</span>
            </div>
            <div style={{ fontStyle: 'italic', color: '#4a4a4a', marginBottom: '4px' }}>{exp.employer || exp.company}</div>
            {(exp.enhanced_bullets || []).length > 0 ? (
              <ul style={{ paddingLeft: '18px' }}>
                {exp.enhanced_bullets.map((b, j) => <li key={j} style={{ lineHeight: '1.6', marginBottom: '2px' }}>{b}</li>)}
              </ul>
            ) : exp.responsibilities ? <p style={{ lineHeight: '1.6' }}>{exp.responsibilities}</p> : null}
          </div>
        ))}
      </div>
    )}
    {data.education.length > 0 && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #1a1a1a', paddingBottom: '4px', marginBottom: '10px' }}>Education</div>
        {data.education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '700' }}>{edu.degree}</div>
              <div style={{ fontStyle: 'italic', color: '#4a4a4a' }}>{edu.institution || edu.school}</div>
            </div>
            <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#4a4a4a' }}>{edu.graduation_year || edu.year}</div>
          </div>
        ))}
      </div>
    )}
    {data.skills.length > 0 && (
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #1a1a1a', paddingBottom: '4px', marginBottom: '10px' }}>Skills & Competencies</div>
        <div style={{ columns: 2 }}>
          {data.skills.map((s, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>• {typeof s === 'string' ? s : s.name || s.skill || ''}</div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const MinimalTemplate = ({ data, name, email, phone, location, linkedin }) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '12px', color: '#111827', background: 'white', padding: '36px 44px' }}>
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '22px', fontWeight: '300', letterSpacing: '1px' }}>
        {name.split(' ').slice(0, -1).join(' ')} <strong style={{ fontWeight: '700', color: '#0F766E' }}>{name.split(' ').slice(-1)[0]}</strong>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: '#4B5563' }}>
        {[email, phone, location, linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
      </div>
    </div>
    <div style={{ height: '2px', background: 'linear-gradient(to right, #0F766E, transparent)', marginBottom: '20px' }} />

    {data.summary && (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#0F766E', marginBottom: '8px' }}>Summary</div>
        <p style={{ lineHeight: '1.7', color: '#374151' }}>{typeof data.summary === 'string' ? data.summary : data.summary.text || ''}</p>
      </div>
    )}
    {data.experiences.length > 0 && (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#0F766E', marginBottom: '8px' }}>Experience</div>
        {data.experiences.map((exp, i) => (
          <div key={i} style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 16px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '13px' }}>{exp.job_title || exp.title}</div>
              <div style={{ fontSize: '11px', color: '#0F766E', marginTop: '2px' }}>{exp.employer || exp.company}</div>
              {(exp.enhanced_bullets || []).length > 0 ? (
                <ul style={{ marginTop: '6px', paddingLeft: '14px' }}>
                  {exp.enhanced_bullets.map((b, j) => <li key={j} style={{ lineHeight: '1.6', color: '#374151', marginBottom: '2px', fontSize: '11px' }}>{b}</li>)}
                </ul>
              ) : exp.responsibilities ? <p style={{ marginTop: '4px', fontSize: '11px', color: '#374151', lineHeight: '1.6' }}>{exp.responsibilities}</p> : null}
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
              {exp.start_date || exp.from} – {exp.end_date || exp.to || 'Present'}
            </div>
          </div>
        ))}
      </div>
    )}
    {data.education.length > 0 && (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#0F766E', marginBottom: '8px' }}>Education</div>
        {data.education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '12px' }}>{edu.degree}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{edu.institution || edu.school}</div>
            </div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{edu.graduation_year || edu.year}</div>
          </div>
        ))}
      </div>
    )}
    {data.skills.length > 0 && (
      <div>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#0F766E', marginBottom: '8px' }}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {data.skills.map((s, i) => (
            <span key={i} style={{ fontSize: '10px', padding: '3px 10px', border: '1px solid #D1FAE5', background: '#F0FDF4', color: '#065F46', borderRadius: '20px' }}>
              {typeof s === 'string' ? s : s.name || s.skill || ''}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ResumePreview = ({ resume, scale = 1 }) => {
  if (!resume) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">
        <p className="text-gray-400 text-sm">No resume data to preview</p>
      </div>
    );
  }

  const data = extractSectionData(resume.sections || []);
  const templateStyle = resume.layout_json?.style || 'modern';
  const name = data.personal_info.full_name || data.personal_info.name || resume.title || 'Your Name';
  const email = data.personal_info.email || '';
  const phone = data.personal_info.phone || '';
  const location = data.personal_info.location || '';
  const linkedin = data.personal_info.linkedin || '';

  const TemplateComponent =
    templateStyle === 'classic' ? ClassicTemplate :
    templateStyle === 'minimal' ? MinimalTemplate :
    ModernTemplate;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: scale !== 1 ? `${100 / scale}%` : '100%',
      }}
      className="bg-white shadow-lg rounded-lg overflow-hidden"
    >
      <TemplateComponent data={data} name={name} email={email} phone={phone} location={location} linkedin={linkedin} />
    </div>
  );
};

export default ResumePreview;
