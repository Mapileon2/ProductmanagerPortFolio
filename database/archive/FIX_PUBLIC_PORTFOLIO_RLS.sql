-- ============================================
-- FIXED: Public Portfolio Access RLS Policies
-- ============================================
-- Run this AFTER migration 007 if you got column errors
-- This fixes any column name mismatches

-- First, add columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_portfolio_public BOOLEAN DEFAULT true;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Drop and recreate all public read policies with correct column names

-- User profiles
DROP POLICY IF EXISTS "Public can read public profiles" ON user_profiles;
CREATE POLICY "Public can read public profiles" ON user_profiles
  FOR SELECT USING (is_portfolio_public = true);

-- Story sections
DROP POLICY IF EXISTS "Public can read public story sections" ON story_sections;
CREATE POLICY "Public can read public story sections" ON story_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Story paragraphs (uses story_id, not section_id)
DROP POLICY IF EXISTS "Public can read public story paragraphs" ON story_paragraphs;
CREATE POLICY "Public can read public story paragraphs" ON story_paragraphs
  FOR SELECT USING (
    story_id IN (
      SELECT story_id FROM story_sections ss
      JOIN user_profiles up ON ss.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Carousels
DROP POLICY IF EXISTS "Public can read public carousels" ON carousels;
CREATE POLICY "Public can read public carousels" ON carousels
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Carousel slides
DROP POLICY IF EXISTS "Public can read public carousel slides" ON carousel_slides;
CREATE POLICY "Public can read public carousel slides" ON carousel_slides
  FOR SELECT USING (
    carousel_id IN (
      SELECT carousel_id FROM carousels c
      JOIN user_profiles up ON c.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Skill categories
DROP POLICY IF EXISTS "Public can read public skill categories" ON skill_categories;
CREATE POLICY "Public can read public skill categories" ON skill_categories
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Skills
DROP POLICY IF EXISTS "Public can read public skills" ON skills;
CREATE POLICY "Public can read public skills" ON skills
  FOR SELECT USING (
    category_id IN (
      SELECT category_id FROM skill_categories sc
      JOIN user_profiles up ON sc.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Tools
DROP POLICY IF EXISTS "Public can read public tools" ON tools;
CREATE POLICY "Public can read public tools" ON tools
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Journey timelines
DROP POLICY IF EXISTS "Public can read public journey timelines" ON journey_timelines;
CREATE POLICY "Public can read public journey timelines" ON journey_timelines
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Journey milestones
DROP POLICY IF EXISTS "Public can read public journey milestones" ON journey_milestones;
CREATE POLICY "Public can read public journey milestones" ON journey_milestones
  FOR SELECT USING (
    timeline_id IN (
      SELECT timeline_id FROM journey_timelines jt
      JOIN user_profiles up ON jt.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Contact sections
DROP POLICY IF EXISTS "Public can read public contact sections" ON contact_sections;
CREATE POLICY "Public can read public contact sections" ON contact_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Social links
DROP POLICY IF EXISTS "Public can read public social links" ON social_links;
CREATE POLICY "Public can read public social links" ON social_links
  FOR SELECT USING (
    contact_id IN (
      SELECT contact_id FROM contact_sections cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- CV sections
DROP POLICY IF EXISTS "Public can read public cv sections" ON cv_sections;
CREATE POLICY "Public can read public cv sections" ON cv_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- CV versions
DROP POLICY IF EXISTS "Public can read public cv versions" ON cv_versions;
CREATE POLICY "Public can read public cv versions" ON cv_versions
  FOR SELECT USING (
    cv_section_id IN (
      SELECT cv_section_id FROM cv_sections cvs
      JOIN user_profiles up ON cvs.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Assets
DROP POLICY IF EXISTS "Public can read public assets" ON assets;
CREATE POLICY "Public can read public assets" ON assets
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Case studies (update existing policy)
DROP POLICY IF EXISTS "Public can read published case studies" ON case_studies;
CREATE POLICY "Public can read published case studies" ON case_studies
  FOR SELECT USING (
    is_published = true AND org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Case study sections (update existing policy)
DROP POLICY IF EXISTS "Public can read sections of published case studies" ON case_study_sections;
CREATE POLICY "Public can read sections of published case studies" ON case_study_sections
  FOR SELECT USING (
    case_study_id IN (
      SELECT case_study_id FROM case_studies cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Section assets
DROP POLICY IF EXISTS "Public can read public section assets" ON section_assets;
CREATE POLICY "Public can read public section assets" ON section_assets
  FOR SELECT USING (
    section_id IN (
      SELECT css.section_id FROM case_study_sections css
      JOIN case_studies cs ON css.case_study_id = cs.case_study_id
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Embed widgets
DROP POLICY IF EXISTS "Public can read public embed widgets" ON embed_widgets;
CREATE POLICY "Public can read public embed widgets" ON embed_widgets
  FOR SELECT USING (
    section_id IN (
      SELECT css.section_id FROM case_study_sections css
      JOIN case_studies cs ON css.case_study_id = cs.case_study_id
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Function to generate unique username from email
CREATE OR REPLACE FUNCTION generate_username_from_email(email_input TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Extract username part from email (before @)
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(email_input, '@', 1), '[^a-z0-9]', '', 'g'));
  
  -- Ensure it's not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  -- Check if username exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Update existing users to have usernames (only if they don't have one)
UPDATE user_profiles 
SET username = generate_username_from_email(email)
WHERE username IS NULL;

-- Make username NOT NULL after populating
ALTER TABLE user_profiles 
ALTER COLUMN username SET NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Public portfolio RLS policies applied successfully!';
  RAISE NOTICE '📝 Next step: Set your username using SETUP_YOUR_USERNAME.sql';
END $$;
