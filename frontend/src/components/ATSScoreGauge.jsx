import React from 'react';

const getATSConfig = (score) => {
  if (score >= 81) return { color: '#16a34a', bg: '#dcfce7', label: 'Excellent', description: 'Your resume is highly optimised for ATS systems.' };
  if (score >= 61) return { color: '#2563eb', bg: '#dbeafe', label: 'Good', description: 'Your resume is well-optimised but could be improved.' };
  if (score >= 41) return { color: '#ea580c', bg: '#ffedd5', label: 'Average', description: 'Your resume needs improvements to pass ATS filters.' };
  return { color: '#dc2626', bg: '#fee2e2', label: 'Poor', description: 'Your resume needs significant improvements.' };
};

const ATSScoreGauge = ({ score = 0, size = 'large', showDetails = false, details = {} }) => {
  const config = getATSConfig(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (size === 'small') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke={config.color}
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 94} 94`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: config.color }}>
            {Math.round(score)}
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Gauge circle */}
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
          {/* Score arc */}
          <circle
            cx="60" cy="60" r="45"
            fill="none"
            stroke={config.color}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: config.color }}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-gray-500 font-medium">/ 100</span>
        </div>
      </div>

      {/* Label */}
      <div
        className="mt-2 px-4 py-1 rounded-full text-sm font-semibold"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.label}
      </div>
      <p className="text-xs text-gray-500 text-center mt-2 max-w-[200px]">{config.description}</p>

      {/* Score breakdown */}
      {showDetails && details && (
        <div className="mt-4 w-full space-y-2">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Score Breakdown</div>
          {[
            { label: 'Keyword Coverage', value: details.keyword_coverage, weight: '60%' },
            { label: 'Section Score', value: details.section_score, weight: '30%' },
            { label: 'Format Score', value: details.format_score, weight: '10%' },
          ].map(({ label, value, weight }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>{label} <span className="text-gray-400">({weight})</span></span>
                <span className="font-medium">{value?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="h-1 rounded-full"
                  style={{ width: `${Math.min(100, value || 0)}%`, backgroundColor: config.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ATSScoreGauge;
