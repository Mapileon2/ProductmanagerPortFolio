-- MASTER SETUP SCRIPT
-- Portfolio Management System (SaaS Edition)
-- Run this entire script in the Supabase SQL Editor to set up or update your database.

-- ==========================================
-- 1. EXTENSIONS & BASE CONFIGURATION
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CORE TABLES (SCHEMA)
-- ==========================================

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
  org_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  portfolio_status VARCHAR(20) DEFAULT 'draft' CHECK (portfolio_status IN ('draft', 'published')),
  is_portfolio_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets (Media)
CREATE TABLE IF NOT EXISTS assets (
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

-- Case Studies
CREATE TABLE IF NOT EXISTS case_studies (
  case_study_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  template TEXT DEFAULT 'default' CHECK (template IN ('default', 'ghibli', 'modern')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  hero_image_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  content_html TEXT,
  description TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Case Study Sections
CREATE TABLE IF NOT EXISTS case_study_sections (
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

-- Story Sections
CREATE TABLE IF NOT EXISTS story_sections (
  story_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Story',
  subtitle TEXT,
  image_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  image_alt TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_paragraphs (
  paragraph_id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES story_sections(story_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carousels
CREATE TABLE IF NOT EXISTS carousels (
  carousel_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Homepage Carousel',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carousel_slides (
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

-- Skill Categories
CREATE TABLE IF NOT EXISTS skill_categories (
  category_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  icon_url TEXT,
  color TEXT,
  order_key TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  skill_id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES skill_categories(category_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER CHECK (level >= 0 AND level <= 100),
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools
CREATE TABLE IF NOT EXISTS tools (
  tool_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  icon_url TEXT,
  color TEXT,
  order_key TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey Timelines
CREATE TABLE IF NOT EXISTS journey_timelines (
  timeline_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Journey',
  subtitle TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_milestones (
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

-- Contact Sections
CREATE TABLE IF NOT EXISTS contact_sections (
  contact_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Contact Me',
  subtitle TEXT,
  description TEXT,
  email TEXT,
  location TEXT,
  resume_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  resume_button_text TEXT DEFAULT 'Download Resume',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_links (
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

-- CV Sections
CREATE TABLE IF NOT EXISTS cv_sections (
  cv_section_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Download CV',
  subtitle TEXT,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_versions (
  cv_version_id TEXT PRIMARY KEY,
  cv_section_id TEXT REFERENCES cv_sections(cv_section_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('indian', 'europass', 'global')),
  file_asset_id TEXT REFERENCES assets(asset_id) ON DELETE SET NULL,
  google_drive_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  upload_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  order_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Snapshots (SaaS Feature)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    snapshot_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    version_number INTEGER DEFAULT 1
);

-- AI Configurations
CREATE TABLE IF NOT EXISTS ai_configurations (
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

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_case_studies_org_status ON case_studies(org_id, status);
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies(org_id, slug);
CREATE INDEX IF NOT EXISTS idx_case_study_sections_case_order ON case_study_sections(case_study_id, order_key);
CREATE INDEX IF NOT EXISTS idx_assets_org_type ON assets(org_id, asset_type, status);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_carousel_order ON carousel_slides(carousel_id, order_key);
CREATE INDEX IF NOT EXISTS idx_story_paragraphs_story_order ON story_paragraphs(story_id, order_key);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_org_status ON portfolio_snapshots(org_id, status);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_published_at ON portfolio_snapshots(published_at) WHERE status = 'published';

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) - SAAS ACCESS CONTROL
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_study_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;

-- Define Policies (Drop first to ensure idempotency)

-- User Profiles
DROP POLICY IF EXISTS "Public read access for published portfolios" ON user_profiles;
CREATE POLICY "Public read access for published portfolios" ON user_profiles
    FOR SELECT USING (portfolio_status = 'published');

DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Case Studies
DROP POLICY IF EXISTS "Public read access for published case studies" ON case_studies;
CREATE POLICY "Public read access for published case studies" ON case_studies
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = case_studies.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own case studies" ON case_studies;
CREATE POLICY "Users can manage own case studies" ON case_studies
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = case_studies.org_id)
    );

-- Case Study Sections
DROP POLICY IF EXISTS "Public read access for published case study sections" ON case_study_sections;
CREATE POLICY "Public read access for published case study sections" ON case_study_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM case_studies
            JOIN user_profiles ON user_profiles.org_id = case_studies.org_id
            WHERE case_studies.case_study_id = case_study_sections.case_study_id
            AND case_studies.is_published = true
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- Story Sections
DROP POLICY IF EXISTS "Public read access for published story sections" ON story_sections;
CREATE POLICY "Public read access for published story sections" ON story_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = story_sections.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own story" ON story_sections;
CREATE POLICY "Users can manage own story" ON story_sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = story_sections.org_id)
    );

-- Skill Categories
DROP POLICY IF EXISTS "Public read access for published skill categories" ON skill_categories;
CREATE POLICY "Public read access for published skill categories" ON skill_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = skill_categories.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own skill categories" ON skill_categories;
CREATE POLICY "Users can manage own skill categories" ON skill_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = skill_categories.org_id)
    );

-- Tools
DROP POLICY IF EXISTS "Public read access for published tools" ON tools;
CREATE POLICY "Public read access for published tools" ON tools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = tools.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own tools" ON tools;
CREATE POLICY "Users can manage own tools" ON tools
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = tools.org_id)
    );

-- Journey Timelines
DROP POLICY IF EXISTS "Public read access for published journey timelines" ON journey_timelines;
CREATE POLICY "Public read access for published journey timelines" ON journey_timelines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = journey_timelines.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own journey" ON journey_timelines;
CREATE POLICY "Users can manage own journey" ON journey_timelines
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = journey_timelines.org_id)
    );

-- Journey Milestones
DROP POLICY IF EXISTS "Public read access for published journey milestones" ON journey_milestones;
CREATE POLICY "Public read access for published journey milestones" ON journey_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journey_timelines
            JOIN user_profiles ON user_profiles.org_id = journey_timelines.org_id
            WHERE journey_timelines.timeline_id = journey_milestones.timeline_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- Contact Sections
DROP POLICY IF EXISTS "Public read access for published contact sections" ON contact_sections;
CREATE POLICY "Public read access for published contact sections" ON contact_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = contact_sections.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own contact" ON contact_sections;
CREATE POLICY "Users can manage own contact" ON contact_sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = contact_sections.org_id)
    );

-- CV Sections
DROP POLICY IF EXISTS "Public read access for published cv sections" ON cv_sections;
CREATE POLICY "Public read access for published cv sections" ON cv_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = cv_sections.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

DROP POLICY IF EXISTS "Users can manage own cv" ON cv_sections;
CREATE POLICY "Users can manage own cv" ON cv_sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = cv_sections.org_id)
    );

-- Assets (General)
DROP POLICY IF EXISTS "Public read access for assets" ON assets;
CREATE POLICY "Public read access for assets" ON assets
    FOR SELECT USING (true); -- Media is generally public if you have the link (Cloudinary behavior)

DROP POLICY IF EXISTS "Users can upload own assets" ON assets;
CREATE POLICY "Users can upload own assets" ON assets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND org_id = assets.org_id)
    );

-- ==========================================
-- 5. RPC FUNCTIONS (BACKEND LOGIC)
-- ==========================================

-- Publish Portfolio Function
CREATE OR REPLACE FUNCTION publish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_data JSONB;
    v_snapshot_id VARCHAR(36);
    v_version_number INTEGER;
BEGIN
    -- Get current version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM portfolio_snapshots
    WHERE org_id = p_org_id;

    -- Collect all portfolio data
    SELECT jsonb_build_object(
        'profile', (SELECT jsonb_build_object('name', name, 'username', username, 'role', role) FROM user_profiles WHERE org_id = p_org_id),
        'published_at', NOW(),
        'version', v_version_number
    ) INTO v_snapshot_data;

    -- Archive current published version
    UPDATE portfolio_snapshots
    SET status = 'archived'
    WHERE org_id = p_org_id AND status = 'published';

    -- Create new published snapshot
    INSERT INTO portfolio_snapshots (org_id, status, snapshot_data, published_at, version_number)
    VALUES (p_org_id, 'published', v_snapshot_data, NOW(), v_version_number)
    RETURNING snapshot_id INTO v_snapshot_id;

    -- Update profile status
    UPDATE user_profiles
    SET portfolio_status = 'published'
    WHERE org_id = p_org_id;

    -- Mark all content as published
    UPDATE story_sections SET is_published = true WHERE org_id = p_org_id;
    UPDATE skill_categories SET is_published = true WHERE org_id = p_org_id;
    UPDATE tools SET is_published = true WHERE org_id = p_org_id;
    UPDATE journey_timelines SET is_published = true WHERE org_id = p_org_id;
    UPDATE carousels SET is_published = true WHERE org_id = p_org_id;
    UPDATE cv_sections SET is_published = true WHERE org_id = p_org_id;
    UPDATE contact_sections SET is_published = true WHERE org_id = p_org_id;

    RETURN jsonb_build_object(
        'success', true,
        'snapshot_id', v_snapshot_id,
        'version', v_version_number,
        'published_at', NOW(),
        'message', 'Portfolio published successfully'
    );
END;
$$;

-- Unpublish Portfolio Function
CREATE OR REPLACE FUNCTION unpublish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update profile status to draft
    UPDATE user_profiles
    SET portfolio_status = 'draft'
    WHERE org_id = p_org_id;

    -- Archive current published snapshot
    UPDATE portfolio_snapshots
    SET status = 'archived'
    WHERE org_id = p_org_id AND status = 'published';

    -- Mark all content as unpublished
    UPDATE story_sections SET is_published = false WHERE org_id = p_org_id;
    UPDATE skill_categories SET is_published = false WHERE org_id = p_org_id;
    UPDATE tools SET is_published = false WHERE org_id = p_org_id;
    UPDATE journey_timelines SET is_published = false WHERE org_id = p_org_id;
    UPDATE carousels SET is_published = false WHERE org_id = p_org_id;
    UPDATE cv_sections SET is_published = false WHERE org_id = p_org_id;
    UPDATE contact_sections SET is_published = false WHERE org_id = p_org_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Portfolio unpublished successfully'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION publish_portfolio(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION unpublish_portfolio(VARCHAR) TO authenticated;

-- Initial Data
INSERT INTO organizations (org_id, name, slug)
VALUES ('default-org', 'Default Organization', 'default')
ON CONFLICT (org_id) DO NOTHING;
