import React from 'react';
import { Link } from 'react-router-dom';

const getATSColor = (score) => {
  if (score >= 81) return { text: 'text-green-700', bg: 'bg-green-100', bar: 'bg-green-500', label: 'Excellent' };
  if (score >= 61) return { text: 'text-blue-700', bg: 'bg-blue-100', bar: 'bg-blue-500', label: 'Good' };
  if (score >= 41) return { text: 'text-orange-700', bg: 'bg-orange-100', bar: 'bg-orange-500', label: 'Average' };
  return { text: 'text-red-700', bg: 'bg-red-100', bar: 'bg-red-500', label: 'Poor' };
};

const ResumeCard = ({ resume, onDelete }) => {
  const ats = getATSColor(resume.ats_score || 0);
  const score = resume.ats_score || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 fade-in">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">{resume.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Updated {formatDate(resume.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ats.bg} ${ats.text}`}>
              {ats.label}
            </span>
          </div>
        </div>

        {/* Template badge */}
        {resume.template_name && (
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="text-xs text-gray-500">{resume.template_name} Template</span>
          </div>
        )}

        {/* ATS Score bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">ATS Score</span>
            <span className={`text-sm font-bold ${ats.text}`}>{score.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${ats.bar}`}
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/resume/${resume.resume_id}`}
            className="flex-1 text-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            View &amp; Edit
          </Link>
          <Link
            to={`/resume/${resume.resume_id}/edit`}
            className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Builder
          </Link>
          <button
            onClick={() => onDelete(resume.resume_id, resume.title)}
            className="px-3 py-1.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;
