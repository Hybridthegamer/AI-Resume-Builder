import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeAPI, exportAPI } from '../api/client';
import ATSScoreGauge from '../components/ATSScoreGauge';
import ResumePreview from '../components/ResumePreview';

const ResumeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scoringATS, setScoringATS] = useState(false);
  const [matching, setMatching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobMatch, setJobMatch] = useState(null);
  const [exports, setExports] = useState([]);
  const [activeTab, setActiveTab] = useState('preview');

  const fetchResume = useCallback(async () => {
    try {
      const { data } = await resumeAPI.getOne(id);
      setResume(data.resume);
    } catch {
      setError('Failed to load resume.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
    exportAPI.getExports(id).then(({ data }) => setExports(data.exports || [])).catch(() => {});
  }, [fetchResume, id]);

  const handleGenerateAI = async () => {
    setGenerating(true);
    setError('');
    try {
      await resumeAPI.generateAI(id);
      await fetchResume();
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation failed. Please ensure your profile has a name, experience, and skills.');
    } finally {
      setGenerating(false);
    }
  };

  const handleATSScore = async () => {
    setScoringATS(true);
    setError('');
    try {
      const { data } = await resumeAPI.getATSScore(id);
      setResume((prev) => ({ ...prev, ats_score: data.score }));
      await fetchResume();
    } catch (err) {
      setError(err.response?.data?.error || 'ATS scoring failed.');
    } finally {
      setScoringATS(false);
    }
  };

  const handleJobMatch = async () => {
    if (!jobDesc.trim()) return;
    setMatching(true);
    setError('');
    try {
      const { data } = await resumeAPI.jobMatch(id, { job_description: jobDesc });
      setJobMatch(data.match);
    } catch (err) {
      setError(err.response?.data?.error || 'Job matching failed.');
    } finally {
      setMatching(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    setError('');
    try {
      const exportFn = format === 'pdf' ? exportAPI.exportPDF : exportAPI.exportDOCX;
      const { data } = await exportFn(id);
      setExports((prev) => [data.export, ...prev]);
      // Trigger download
      if (data.export?.download_url) {
        const link = document.createElement('a');
        link.href = data.export.download_url;
        link.download = `resume.${format}`;
        link.click();
      }
    } catch (err) {
      setError(err.response?.data?.error || `Export as ${format.toUpperCase()} failed.`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  if (!resume) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">Resume not found.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Back to Dashboard</button>
    </div>
  );

  const atsScore = resume.ats_score || 0;
  const sections = resume.sections || [];
  const summary = sections.find((s) => s.section_type === 'summary');
  const hasAIContent = Boolean(summary?.content?.text);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{resume.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`/resume/${id}/edit`)} className="btn-secondary text-sm">Edit</button>
          <button onClick={() => handleExport('pdf')} disabled={exporting} className="btn-primary text-sm">
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={() => handleExport('docx')} disabled={exporting} className="btn-secondary text-sm">
            {exporting ? '...' : 'Export DOCX'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['preview', 'ats', 'job-match', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'ats' ? 'ATS Score' : tab === 'job-match' ? 'Job Match' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          {!hasAIContent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="font-medium text-yellow-800 mb-1">No AI Content Yet</div>
                <div className="text-sm text-yellow-700">Generate AI content to enhance your resume with professional language and optimised bullet points.</div>
              </div>
              <button onClick={handleGenerateAI} disabled={generating} className="btn-primary text-sm flex-shrink-0">
                {generating ? 'Generating...' : 'Generate AI Content'}
              </button>
            </div>
          )}
          <ResumePreview resume={resume} />
        </div>
      )}

      {/* ATS Score Tab */}
      {activeTab === 'ats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ATS Compatibility Score</h2>
            <ATSScoreGauge score={atsScore} />
            <button onClick={handleATSScore} disabled={scoringATS} className="btn-primary w-full mt-6">
              {scoringATS ? 'Analysing...' : 'Run ATS Analysis'}
            </button>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Breakdown</h2>
            {resume.ats_details ? (
              <div className="space-y-3">
                {Object.entries(resume.ats_details.sections || {}).map(([sec, score]) => (
                  <div key={sec}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">{sec.replace('_', ' ')}</span>
                      <span className="font-medium">{score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-4">Run the ATS analysis to see section-by-section breakdown and improvement suggestions.</div>
            )}
            {resume.ats_flags && resume.ats_flags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Improvement Suggestions</h3>
                <ul className="space-y-1.5">
                  {resume.ats_flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                      <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Match Tab */}
      {activeTab === 'job-match' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h2>
            <p className="text-sm text-gray-500 mb-4">Paste the job posting to see how well your resume matches.</p>
            <textarea
              className="input-field resize-none mb-4"
              rows={10}
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the full job description here..."
            />
            <button onClick={handleJobMatch} disabled={matching || !jobDesc.trim()} className="btn-primary w-full">
              {matching ? 'Matching...' : 'Analyse Match'}
            </button>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Results</h2>
            {jobMatch ? (
              <div>
                <div className="text-center mb-6">
                  <div className={`text-5xl font-bold mb-2 ${jobMatch.match_score >= 61 ? 'text-green-600' : jobMatch.match_score >= 41 ? 'text-orange-500' : 'text-red-500'}`}>
                    {Math.round(jobMatch.match_score)}%
                  </div>
                  <div className="text-sm text-gray-500">Match Score</div>
                </div>
                <div className="space-y-4">
                  {jobMatch.matched_keywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-700 mb-2">Matched Keywords ({jobMatch.matched_keywords.length})</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.matched_keywords.slice(0, 20).map((kw) => (
                          <span key={kw} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobMatch.missing_keywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-2">Missing Keywords ({jobMatch.missing_keywords.length})</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.missing_keywords.slice(0, 20).map((kw) => (
                          <span key={kw} className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full border border-red-200">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">
                Paste a job description and click &quot;Analyse Match&quot; to see keyword overlap and score.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export History Tab */}
      {activeTab === 'history' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export History</h2>
          {exports.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No exports yet. Use the Export buttons above to download your resume.
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div key={exp.export_id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${exp.format === 'pdf' ? 'bg-red-500' : 'bg-blue-500'}`}>
                      {exp.format?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Resume.{exp.format}</div>
                      <div className="text-xs text-gray-400">{new Date(exp.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {exp.download_url && (
                    <a href={exp.download_url} download className="btn-secondary text-xs py-1.5">
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeDetailPage;
