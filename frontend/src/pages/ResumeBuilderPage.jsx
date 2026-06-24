import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resumeAPI, templateAPI } from '../api/client';
import TemplateSelector from '../components/TemplateSelector';

const STEPS = [
  { id: 1, label: 'Personal Info', icon: '👤' },
  { id: 2, label: 'Experience', icon: '💼' },
  { id: 3, label: 'Education', icon: '🎓' },
  { id: 4, label: 'Skills', icon: '⚡' },
  { id: 5, label: 'Extras', icon: '📋' },
  { id: 6, label: 'Template', icon: '🎨' },
];

const emptyExperience = () => ({
  job_title: '',
  employer: '',
  start_date: '',
  end_date: '',
  is_current: false,
  responsibilities: '',
});

const emptyEducation = () => ({
  degree: '',
  institution: '',
  graduation_year: '',
  coursework: '',
});

const emptyCertification = () => ({
  name: '',
  issuer: '',
  year: '',
});

const ResumeBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('My Resume');

  // Form state for each section
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    website: '',
  });

  const [experiences, setExperiences] = useState([emptyExperience()]);
  const [education, setEducation] = useState([emptyEducation()]);
  const [skills, setSkills] = useState({
    technical: [''],
    soft: [''],
  });
  const [certifications, setCertifications] = useState([emptyCertification()]);
  const [objectives, setObjectives] = useState('');

  // Load existing resume if editing
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load templates
        const { data: tmplData } = await templateAPI.getAll();
        setTemplates(tmplData.templates || []);

        if (isEditing) {
          const { data: resumeData } = await resumeAPI.getOne(id);
          const resume = resumeData.resume;

          setResumeTitle(resume.title || 'My Resume');

          // Set selected template
          if (resume.template_id) {
            const tmpl = (tmplData.templates || []).find((t) => t.template_id === resume.template_id);
            if (tmpl) setSelectedTemplate(tmpl);
          }

          // Load sections
          for (const section of resume.sections || []) {
            const content = section.content;
            switch (section.section_type) {
              case 'personal_info':
                setPersonalInfo({
                  full_name: content.full_name || '',
                  email: content.email || '',
                  phone: content.phone || '',
                  linkedin: content.linkedin || '',
                  location: content.location || '',
                  website: content.website || '',
                });
                break;
              case 'experience': {
                const exps = Array.isArray(content) ? content : [content];
                setExperiences(exps.length > 0 ? exps : [emptyExperience()]);
                break;
              }
              case 'education': {
                const edus = Array.isArray(content) ? content : [content];
                setEducation(edus.length > 0 ? edus : [emptyEducation()]);
                break;
              }
              case 'skills': {
                if (content?.technical || content?.soft) {
                  setSkills({
                    technical: content.technical?.length > 0 ? content.technical : [''],
                    soft: content.soft?.length > 0 ? content.soft : [''],
                  });
                } else if (Array.isArray(content)) {
                  const techs = content.filter((s) => s.type === 'technical' || !s.type).map((s) => s.name || s);
                  const softs = content.filter((s) => s.type === 'soft').map((s) => s.name || s);
                  setSkills({ technical: techs.length ? techs : [''], soft: softs.length ? softs : [''] });
                }
                break;
              }
              case 'certifications': {
                const certs = Array.isArray(content) ? content : (content?.items || []);
                setCertifications(certs.length > 0 ? certs : [emptyCertification()]);
                break;
              }
              case 'objectives':
                setObjectives(content?.text || content || '');
                break;
            }
          }
        } else {
          // Default select first template
          if (tmplData.templates?.length > 0) {
            setSelectedTemplate(tmplData.templates[0]);
          }
        }
      } catch (err) {
        setError('Failed to load data. ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditing]);

  const buildSections = () => {
    const sections = [];

    sections.push({
      section_type: 'personal_info',
      content: personalInfo,
      order_index: 0,
    });

    const validExperiences = experiences.filter((e) => e.job_title || e.employer);
    if (validExperiences.length > 0) {
      sections.push({
        section_type: 'experience',
        content: validExperiences,
        order_index: 1,
      });
    }

    const validEducation = education.filter((e) => e.degree || e.institution);
    if (validEducation.length > 0) {
      sections.push({
        section_type: 'education',
        content: validEducation,
        order_index: 2,
      });
    }

    const validTech = skills.technical.filter((s) => s.trim());
    const validSoft = skills.soft.filter((s) => s.trim());
    if (validTech.length > 0 || validSoft.length > 0) {
      sections.push({
        section_type: 'skills',
        content: {
          technical: validTech,
          soft: validSoft,
          items: [
            ...validTech.map((s) => ({ name: s, type: 'technical' })),
            ...validSoft.map((s) => ({ name: s, type: 'soft' })),
          ],
        },
        order_index: 3,
      });
    }

    const validCerts = certifications.filter((c) => c.name);
    if (validCerts.length > 0) {
      sections.push({
        section_type: 'certifications',
        content: validCerts,
        order_index: 4,
      });
    }

    if (objectives.trim()) {
      sections.push({
        section_type: 'objectives',
        content: { text: objectives.trim() },
        order_index: 5,
      });
    }

    return sections;
  };

  const handleSave = async () => {
    if (!resumeTitle.trim()) {
      setError('Please enter a resume title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: resumeTitle.trim(),
        template_id: selectedTemplate?.template_id || null,
        sections: buildSections(),
      };

      let resumeId = id;
      if (isEditing) {
        await resumeAPI.update(id, payload);
      } else {
        const { data } = await resumeAPI.create(payload);
        resumeId = data.resume.resume_id;
      }

      navigate(`/resume/${resumeId}`);
    } catch (err) {
      setError('Failed to save resume: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      return personalInfo.full_name.trim().length > 0;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full spinner mb-4" />
          <p className="text-gray-500">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <input
            type="text"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none transition-colors duration-200 w-full max-w-md"
            placeholder="Resume title..."
          />
          <span className="text-xs text-gray-400 flex-shrink-0">(click to rename)</span>
        </div>
        <p className="text-gray-500 text-sm">
          {isEditing ? 'Editing your resume' : 'Building a new resume'} • Step {currentStep} of {STEPS.length}
        </p>
      </div>

      {/* Step progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className="relative z-10 flex flex-col items-center gap-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 border-2 ${
                  step.id === currentStep
                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                    : step.id < currentStep
                    ? 'bg-primary-100 border-primary-400 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  step.id === currentStep ? 'text-primary-700 font-semibold' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 fade-in">
          {error}
          <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Step content */}
      <div className="card p-6 fade-in">
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h2>
            <p className="text-sm text-gray-500 mb-6">Provide your contact details for the resume header.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={personalInfo.full_name}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
                  placeholder="John Smith"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  placeholder="john@example.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="+44 7700 900000"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={personalInfo.location}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                  placeholder="London, UK"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">LinkedIn Profile</label>
                <input
                  type="url"
                  value={personalInfo.linkedin}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/johnsmith"
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Personal Website / Portfolio</label>
                <input
                  type="url"
                  value={personalInfo.website}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                  placeholder="https://johnsmith.dev"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Work Experience */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Work Experience</h2>
            <p className="text-sm text-gray-500 mb-6">Add your work history, starting with the most recent.</p>
            {experiences.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700 text-sm">Experience {index + 1}</h3>
                  {experiences.length > 1 && (
                    <button
                      onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Job Title</label>
                    <input
                      type="text"
                      value={exp.job_title}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[index] = { ...exp, job_title: e.target.value };
                        setExperiences(updated);
                      }}
                      placeholder="Software Engineer"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Employer / Company</label>
                    <input
                      type="text"
                      value={exp.employer}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[index] = { ...exp, employer: e.target.value };
                        setExperiences(updated);
                      }}
                      placeholder="Acme Corporation"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="month"
                      value={exp.start_date}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[index] = { ...exp, start_date: e.target.value };
                        setExperiences(updated);
                      }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="month"
                      value={exp.end_date}
                      disabled={exp.is_current}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[index] = { ...exp, end_date: e.target.value };
                        setExperiences(updated);
                      }}
                      className="input-field disabled:bg-gray-100"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.is_current}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index] = { ...exp, is_current: e.target.checked, end_date: e.target.checked ? '' : exp.end_date };
                          setExperiences(updated);
                        }}
                        className="w-3.5 h-3.5 text-primary-600"
                      />
                      <span className="text-xs text-gray-500">I currently work here</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Key Responsibilities & Achievements</label>
                    <textarea
                      value={exp.responsibilities}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[index] = { ...exp, responsibilities: e.target.value };
                        setExperiences(updated);
                      }}
                      placeholder="Describe your key responsibilities and achievements. The AI generator will enhance these into professional bullet points."
                      rows={4}
                      className="input-field resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Tip: Include specific achievements and numbers where possible.
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setExperiences([...experiences, emptyExperience()])}
              className="btn-secondary text-sm w-full"
            >
              + Add Another Experience
            </button>
          </div>
        )}

        {/* Step 3: Education */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Education</h2>
            <p className="text-sm text-gray-500 mb-6">Add your academic qualifications.</p>
            {education.map((edu, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700 text-sm">Education {index + 1}</h3>
                  {education.length > 1 && (
                    <button
                      onClick={() => setEducation(education.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Degree / Qualification</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index] = { ...edu, degree: e.target.value };
                        setEducation(updated);
                      }}
                      placeholder="BSc Computer Science"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index] = { ...edu, institution: e.target.value };
                        setEducation(updated);
                      }}
                      placeholder="University of London"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Graduation Year</label>
                    <input
                      type="number"
                      value={edu.graduation_year}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index] = { ...edu, graduation_year: e.target.value };
                        setEducation(updated);
                      }}
                      placeholder="2023"
                      min="1950"
                      max="2030"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Grade / Classification</label>
                    <input
                      type="text"
                      value={edu.grade || ''}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index] = { ...edu, grade: e.target.value };
                        setEducation(updated);
                      }}
                      placeholder="First Class Honours"
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Relevant Coursework / Modules</label>
                    <input
                      type="text"
                      value={edu.coursework}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[index] = { ...edu, coursework: e.target.value };
                        setEducation(updated);
                      }}
                      placeholder="Machine Learning, Data Structures, Web Development, Algorithms"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setEducation([...education, emptyEducation()])}
              className="btn-secondary text-sm w-full"
            >
              + Add Another Education
            </button>
          </div>
        )}

        {/* Step 4: Skills */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Skills</h2>
            <p className="text-sm text-gray-500 mb-6">List your technical and soft skills.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label mb-2">Technical Skills</label>
                <div className="space-y-2">
                  {skills.technical.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => {
                          const updated = [...skills.technical];
                          updated[index] = e.target.value;
                          setSkills({ ...skills, technical: updated });
                        }}
                        placeholder={`Technical skill ${index + 1}`}
                        className="input-field flex-1"
                      />
                      {skills.technical.length > 1 && (
                        <button
                          onClick={() => setSkills({ ...skills, technical: skills.technical.filter((_, i) => i !== index) })}
                          className="text-red-400 hover:text-red-600 px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setSkills({ ...skills, technical: [...skills.technical, ''] })}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Technical Skill
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (!skills.technical.includes(s)) {
                          const filtered = skills.technical.filter(Boolean);
                          setSkills({ ...skills, technical: [...filtered, s] });
                        }
                      }}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-2">Soft Skills</label>
                <div className="space-y-2">
                  {skills.soft.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => {
                          const updated = [...skills.soft];
                          updated[index] = e.target.value;
                          setSkills({ ...skills, soft: updated });
                        }}
                        placeholder={`Soft skill ${index + 1}`}
                        className="input-field flex-1"
                      />
                      {skills.soft.length > 1 && (
                        <button
                          onClick={() => setSkills({ ...skills, soft: skills.soft.filter((_, i) => i !== index) })}
                          className="text-red-400 hover:text-red-600 px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setSkills({ ...skills, soft: [...skills.soft, ''] })}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Soft Skill
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {['Leadership', 'Communication', 'Problem-solving', 'Teamwork', 'Adaptability'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (!skills.soft.includes(s)) {
                          const filtered = skills.soft.filter(Boolean);
                          setSkills({ ...skills, soft: [...filtered, s] });
                        }
                      }}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Certifications & Objectives */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Certifications & Career Objectives</h2>
            <p className="text-sm text-gray-500 mb-6">Add any certifications and your career objectives.</p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Certifications</h3>
              {certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Certification {index + 1}</span>
                    {certifications.length > 1 && (
                      <button
                        onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index] = { ...cert, name: e.target.value };
                          setCertifications(updated);
                        }}
                        placeholder="AWS Solutions Architect"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Issuing Organisation</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index] = { ...cert, issuer: e.target.value };
                          setCertifications(updated);
                        }}
                        placeholder="Amazon Web Services"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Year Obtained</label>
                      <input
                        type="number"
                        value={cert.year}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index] = { ...cert, year: e.target.value };
                          setCertifications(updated);
                        }}
                        placeholder="2023"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setCertifications([...certifications, emptyCertification()])}
                className="btn-secondary text-sm"
              >
                + Add Certification
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Career Objectives</h3>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Briefly describe your career goals and what you're looking for in your next role. This helps the AI generate a better professional summary."
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is optional but helps personalise the AI-generated content.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Template Selection */}
        {currentStep === 6 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose Your Template</h2>
            <p className="text-sm text-gray-500 mb-6">
              Select a design template for your resume. You can change this anytime.
            </p>
            {templates.length > 0 ? (
              <TemplateSelector
                templates={templates}
                selectedId={selectedTemplate?.template_id}
                onSelect={setSelectedTemplate}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">Loading templates...</div>
            )}
            {selectedTemplate && (
              <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
                Selected: <strong>{selectedTemplate.name}</strong> template
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={goPrev} disabled={currentStep === 1} className="btn-secondary disabled:opacity-40">
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          {currentStep === STEPS.length ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                  Saving...
                </span>
              ) : (
                isEditing ? 'Save Changes' : 'Create Resume'
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="btn-primary disabled:opacity-40"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResumeBuilderPage;
