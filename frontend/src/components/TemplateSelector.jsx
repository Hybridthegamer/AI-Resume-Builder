import React from 'react';

const templatePreviews = {
  Modern: {
    description: 'Contemporary two-column layout with bold blue header. Perfect for tech and creative professionals.',
    colors: ['#2563EB', '#1E40AF', '#DBEAFE'],
    icon: (
      <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg flex items-end p-2">
        <div className="flex gap-2 w-full">
          <div className="bg-white/20 rounded h-3 flex-1" />
          <div className="bg-white/20 rounded h-3 w-1/3" />
        </div>
      </div>
    ),
  },
  Classic: {
    description: 'Timeless single-column design with elegant serif typography. Ideal for academic and executive roles.',
    colors: ['#1a1a1a', '#4a4a4a', '#f5f5f5'],
    icon: (
      <div className="w-full h-24 bg-white border-2 border-gray-200 rounded-t-lg p-2">
        <div className="border-b-2 border-gray-800 pb-1 mb-2">
          <div className="bg-gray-800 rounded h-2 w-1/2 mx-auto mb-1" />
          <div className="bg-gray-400 rounded h-1.5 w-1/3 mx-auto" />
        </div>
        <div className="space-y-1">
          <div className="bg-gray-200 rounded h-1.5 w-full" />
          <div className="bg-gray-200 rounded h-1.5 w-5/6" />
          <div className="bg-gray-200 rounded h-1.5 w-4/6" />
        </div>
      </div>
    ),
  },
  Minimal: {
    description: 'Clean minimalist design with generous whitespace and subtle teal accents for modern professionals.',
    colors: ['#0F766E', '#0D9488', '#F0FDF4'],
    icon: (
      <div className="w-full h-24 bg-white rounded-t-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="bg-gray-800 rounded h-2.5 w-20 mb-1" />
            <div className="bg-teal-200 rounded h-1 w-12" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="bg-gray-100 rounded h-1.5 w-full" />
          <div className="bg-gray-100 rounded h-1.5 w-4/5" />
          <div className="flex gap-1 mt-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-teal-100 rounded-full h-3 w-12" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
};

const TemplateSelector = ({ templates, selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {templates.map((template) => {
        const preview = templatePreviews[template.name] || {};
        const isSelected = selectedId === template.template_id;

        return (
          <button
            key={template.template_id}
            onClick={() => onSelect(template)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left ${
              isSelected
                ? 'border-primary-600 shadow-lg shadow-primary-100'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Template preview mockup */}
            <div className="bg-gray-50">
              {preview.icon || (
                <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">{template.name}</span>
                </div>
              )}
            </div>

            {/* Template info */}
            <div className="p-3 bg-white">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                {isSelected && (
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{preview.description || template.layout_json?.description}</p>

              {/* Color swatches */}
              {preview.colors && (
                <div className="flex gap-1 mt-2">
                  {preview.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected overlay */}
            {isSelected && (
              <div className="absolute inset-0 border-2 border-primary-600 rounded-xl pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TemplateSelector;
