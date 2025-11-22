-- 🚨 CRITICAL FIX: RLS Policy Mismatch
-- Run this in Supabase SQL Editor immediately

-- The core issue: RLS checks 'status = published' but API queries 'is_published = true'
-- This causes all public portfolio queries to fail

-- Fix 1: Update case_studies RLS policy to use is_published field
DROP POLICY IF EXISTS "Public can read published case studies" ON case_studies;
CREATE POLICY "Public can read published case studies" ON case_studies
  FOR SELECT USING (
    is_published = true AND org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Fix 2: Update case_study_sections RLS policy to match
DROP POLICY IF EXISTS "Public can read sections of published case studies" ON case_study_sections;
CREATE POLICY "Public can read sections of published case studies" ON case_study_sections
  FOR SELECT USING (
    case_study_id IN (
      SELECT case_study_id FROM case_studies cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Fix 3: Ensure all other tables use consistent public access patterns
DROP POLICY IF EXISTS "Public can read journey timelines" ON journey_timelines;
CREATE POLICY "Public can read journey timelines" ON journey_timelines
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read journey milestones" ON journey_milestones;
CREATE POLICY "Public can read journey milestones" ON journey_milestones
  FOR SELECT USING (
    timeline_id IN (
      SELECT timeline_id FROM journey_timelines jt
      JOIN user_profiles up ON jt.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read story sections" ON story_sections;
CREATE POLICY "Public can read story sections" ON story_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read story paragraphs" ON story_paragraphs;
CREATE POLICY "Public can read story paragraphs" ON story_paragraphs
  FOR SELECT USING (
    story_id IN (
      SELECT story_id FROM story_sections ss
      JOIN user_profiles up ON ss.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

-- Fix 4: Skills and tools public access
DROP POLICY IF EXISTS "Public can read skill categories" ON skill_categories;
CREATE POLICY "Public can read skill categories" ON skill_categories
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read skills" ON skills;
CREATE POLICY "Public can read skills" ON skills
  FOR SELECT USING (
    category_id IN (
      SELECT category_id FROM skill_categories sc
      JOIN user_profiles up ON sc.org_id = up.org_id
      WHERE up.is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read tools" ON tools;
CREATE POLICY "Public can read tools" ON tools
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Fix 5: Contact and CV sections
DROP POLICY IF EXISTS "Public can read contact sections" ON contact_sections;
CREATE POLICY "Public can read contact sections" ON contact_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

DROP POLICY IF EXISTS "Public can read cv sections" ON cv_sections;
CREATE POLICY "Public can read cv sections" ON cv_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Fix 6: Assets (images) public access
DROP POLICY IF EXISTS "Public can read assets" ON assets;
CREATE POLICY "Public can read assets" ON assets
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE is_portfolio_public = true
    )
  );

-- Verify the fixes
SELECT 'RLS Policies Fixed' as status;

-- Test query to verify case studies are now accessible
SELECT 
  cs.title,
  cs.is_published,
  up.username,
  up.is_portfolio_public
FROM case_studies cs
JOIN user_profiles up ON cs.org_id = up.org_id
WHERE cs.is_published = true AND up.is_portfolio_public = true;