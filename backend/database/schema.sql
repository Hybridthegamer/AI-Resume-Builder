-- AI Resume Builder Database Schema
-- Run this file to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USER table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TEMPLATE table
CREATE TABLE IF NOT EXISTS templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  layout_json JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE
);

-- RESUME table
CREATE TABLE IF NOT EXISTS resumes (
  resume_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES templates(template_id),
  ats_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SECTION table (stores resume content)
CREATE TABLE IF NOT EXISTS sections (
  section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(resume_id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,
  content JSONB NOT NULL,
  order_index INT DEFAULT 0
);

-- JOB_MATCH table
CREATE TABLE IF NOT EXISTS job_matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(resume_id) ON DELETE CASCADE,
  job_title VARCHAR(255),
  job_description TEXT,
  match_score FLOAT DEFAULT 0,
  matched_keywords JSONB DEFAULT '[]',
  missing_keywords JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXPORT table
CREATE TABLE IF NOT EXISTS exports (
  export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(resume_id) ON DELETE CASCADE,
  format VARCHAR(10) NOT NULL,
  file_path VARCHAR(500),
  download_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_resume_id ON sections(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_resume_id ON job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_exports_resume_id ON exports(resume_id);
