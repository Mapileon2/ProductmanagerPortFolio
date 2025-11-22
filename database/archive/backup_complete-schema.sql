-- Complete Portfolio Management System Schema
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenant support)
CREATE TABLE organizations (
  org_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Central asset management
CREATE TABLE assets (
  asset_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cloudinary_public_id TEXT UNIQUE NOT NULL,
  cloudinary_url TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'document', 'video')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Studies (main portfolio projects)
CREATE TABLE case_studies (
  case_study_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  template TEXT DEFAULT 'default' CHECK (template IN ('default', 'ghibli', 'modern')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  hero_image_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  content_html TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Case Study Sections (modular content blocks)
CREATE TABLE case_study_sections (
  section_id TEXT PRIMARY KEY,
  case_study_id TEXT REFERENCES case_studies(case_study_id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'overview', 'problem', 'process', 'showcase', 'reflection', 'gallery', 'document', 'video', 'figma', 'miro', 'links')),
  title TEXT,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  order_key TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Section Assets (images, documents in sections)
CREATE TABLE section_assets (
  section_asset_id TEXT PRIMARY KEY,
  section_id TEXT REFERENCES case_study_sections(section_id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets(asset_id) ON DELETE CASCADE,
  order_key TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embed Widgets (Figma, YouTube, Miro)
CREATE TABLE embed_widgets (
  embed_id TEXT PRIMARY KEY,
  section_id TEXT REFERENCES case_study_sections(section_id) ON DELETE CASCADE,
  embed_type TEXT NOT NULL CHECK (embed_type IN ('figma', 'youtube', 'miro')),
  original_url TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- My Story Section
CREATE TABLE story_sections (
  story_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Story',
  subtitle TEXT,
  image_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  image_alt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_paragraphs (
  paragraph_id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES story_sections(story_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carousel Management
CREATE TABLE carousels (
  carousel_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Homepage Carousel',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE carousel_slides (
  slide_id TEXT PRIMARY KEY,
  carousel_id TEXT REFERENCES carousels(carousel_id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets(asset_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic Toolbox (Skills & Tools)
CREATE TABLE skill_categories (
  category_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
  skill_id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES skill_categories(category_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER CHECK (level >= 0 AND level <= 100),
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tools (
  tool_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey Timeline
CREATE TABLE journey_timelines (
  timeline_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Journey',
  subtitle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journey_milestones (
  milestone_id TEXT PRIMARY KEY,
  timeline_id TEXT REFERENCES journey_timelines(timeline_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  period TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Section
CREATE TABLE contact_sections (
  contact_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Contact Me',
  subtitle TEXT,
  description TEXT,
  email TEXT,
  location TEXT,
  resume_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  resume_button_text TEXT DEFAULT 'Download Resume',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_links (
  link_id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contact_sections(contact_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV Management
CREATE TABLE cv_sections (
  cv_section_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Download CV',
  subtitle TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cv_versions (
  cv_version_id TEXT PRIMARY KEY,
  cv_section_id TEXT REFERENCES cv_sections(cv_section_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('indian', 'europass', 'global')),
  file_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  google_drive_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Settings (encrypted storage)
CREATE TABLE ai_configurations (
  config_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gemini',
  encrypted_api_key TEXT,
  selected_model TEXT,
  is_configured BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload Sessions (temporary tracking)
CREATE TABLE upload_sessions (
  upload_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets(asset_id) ON DELETE CASCADE,
  cloudinary_signature TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  log_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_case_studies_org_status ON case_studies(org_id, status);
CREATE INDEX idx_case_studies_slug ON case_studies(org_id, slug);
CREATE INDEX idx_case_study_sections_case_order ON case_study_sections(case_study_id, order_key);
CREATE INDEX idx_assets_org_type ON assets(org_id, asset_type, status);
CREATE INDEX idx_carousel_slides_carousel_order ON carousel_slides(carousel_id, order_key);
CREATE INDEX idx_story_paragraphs_story_order ON story_paragraphs(story_id, order_key);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(org_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_case_studies_search ON case_studies USING gin(to_tsvector('english', title || ' ' || COALESCE(content_html, '')));
CREATE INDEX idx_assets_filename_search ON assets USING gin(to_tsvector('english', original_filename));

-- Insert initial organization and user data
INSERT INTO organizations (org_id, name, slug) 
VALUES ('default-org', 'Default Organization', 'default')
ON CONFLICT (org_id) DO NOTHING;

-- Note: User profile will be created automatically when you first sign up