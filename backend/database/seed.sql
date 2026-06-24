-- Seed data for AI Resume Builder
-- Insert default templates

INSERT INTO templates (name, layout_json, is_premium) VALUES
(
  'Modern',
  '{
    "style": "modern",
    "primaryColor": "#2563EB",
    "secondaryColor": "#1E40AF",
    "fontFamily": "Inter, sans-serif",
    "layout": "two-column",
    "headerStyle": "full-width-banner",
    "description": "A contemporary two-column design with a bold blue header. Perfect for tech and creative professionals.",
    "features": ["two-column", "colored-header", "skill-bars"]
  }',
  false
),
(
  'Classic',
  '{
    "style": "classic",
    "primaryColor": "#1a1a1a",
    "secondaryColor": "#4a4a4a",
    "fontFamily": "Georgia, serif",
    "layout": "single-column",
    "headerStyle": "centered",
    "description": "A timeless single-column design with traditional typography. Ideal for academic and executive roles.",
    "features": ["single-column", "serif-font", "traditional-layout"]
  }',
  false
),
(
  'Minimal',
  '{
    "style": "minimal",
    "primaryColor": "#0F766E",
    "secondaryColor": "#0D9488",
    "fontFamily": "system-ui, sans-serif",
    "layout": "single-column",
    "headerStyle": "left-aligned",
    "description": "A clean, minimalist design with generous white space and subtle accent colors.",
    "features": ["clean-layout", "accent-borders", "compact-spacing"]
  }',
  false
)
ON CONFLICT DO NOTHING;
