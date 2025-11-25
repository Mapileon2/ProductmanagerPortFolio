-- Drop conflicting public access policies from migration 007 and 008
DROP POLICY IF EXISTS "Public can read public profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view published portfolios" ON user_profiles;
DROP POLICY IF EXISTS "Public can read public story sections" ON story_sections;
DROP POLICY IF EXISTS "Public can read public story paragraphs" ON story_paragraphs;
DROP POLICY IF EXISTS "Public can read public carousels" ON carousels;
DROP POLICY IF EXISTS "Public can read public carousel slides" ON carousel_slides;
DROP POLICY IF EXISTS "Public can read public skill categories" ON skill_categories;
DROP POLICY IF EXISTS "Public can read public skills" ON skills;
DROP POLICY IF EXISTS "Public can read public tools" ON tools;
DROP POLICY IF EXISTS "Public can read public journey timelines" ON journey_timelines;
DROP POLICY IF EXISTS "Public can read public journey milestones" ON journey_milestones;
DROP POLICY IF EXISTS "Public can read public contact sections" ON contact_sections;
DROP POLICY IF EXISTS "Public can read public social links" ON social_links;
DROP POLICY IF EXISTS "Public can read public cv sections" ON cv_sections;
DROP POLICY IF EXISTS "Public can read public cv versions" ON cv_versions;
DROP POLICY IF EXISTS "Public can read public assets" ON assets;
DROP POLICY IF EXISTS "Public can read published case studies" ON case_studies;
DROP POLICY IF EXISTS "Public can read sections of published case studies" ON case_study_sections;
DROP POLICY IF EXISTS "Public can read public section assets" ON section_assets;
DROP POLICY IF EXISTS "Public can read public embed widgets" ON embed_widgets;
DROP POLICY IF EXISTS "Public can view published snapshots" ON portfolio_snapshots;

-- Create a single, authoritative set of RLS policies for public access
-- The portfolio_status on user_profiles is the single source of truth.

-- Policy for user_profiles
CREATE POLICY "Public can read published user profiles" ON user_profiles
  FOR SELECT USING (portfolio_status = 'published');

-- Policies for portfolio content
CREATE POLICY "Public can read content of published portfolios" ON story_sections
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read paragraphs of published stories" ON story_paragraphs
  FOR SELECT USING (story_id IN (SELECT story_id FROM story_sections ss JOIN user_profiles up ON ss.org_id = up.org_id WHERE up.portfolio_status = 'published'));

CREATE POLICY "Public can read published case studies" ON case_studies
  FOR SELECT USING (status = 'published' AND org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read sections of published case studies" ON case_study_sections
  FOR SELECT USING (case_study_id IN (SELECT cs.case_study_id FROM case_studies cs JOIN user_profiles up ON cs.org_id = up.org_id WHERE cs.status = 'published' AND up.portfolio_status = 'published'));

CREATE POLICY "Public can read assets of published portfolios" ON assets
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read section assets of published case studies" ON section_assets
  FOR SELECT USING (section_id IN (SELECT css.section_id FROM case_study_sections css JOIN case_studies cs ON css.case_study_id = cs.case_study_id JOIN user_profiles up ON cs.org_id = up.org_id WHERE cs.status = 'published' AND up.portfolio_status = 'published'));

CREATE POLICY "Public can read embed widgets of published case studies" ON embed_widgets
  FOR SELECT USING (section_id IN (SELECT css.section_id FROM case_study_sections css JOIN case_studies cs ON css.case_study_id = cs.case_study_id JOIN user_profiles up ON cs.org_id = up.org_id WHERE cs.status = 'published' AND up.portfolio_status = 'published'));

CREATE POLICY "Public can read carousels of published portfolios" ON carousels
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read carousel slides of published portfolios" ON carousel_slides
  FOR SELECT USING (carousel_id IN (SELECT c.carousel_id FROM carousels c JOIN user_profiles up ON c.org_id = up.org_id WHERE up.portfolio_status = 'published'));

CREATE POLICY "Public can read skill categories of published portfolios" ON skill_categories
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read skills of published portfolios" ON skills
  FOR SELECT USING (category_id IN (SELECT sc.category_id FROM skill_categories sc JOIN user_profiles up ON sc.org_id = up.org_id WHERE up.portfolio_status = 'published'));

CREATE POLICY "Public can read tools of published portfolios" ON tools
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read journey timelines of published portfolios" ON journey_timelines
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read journey milestones of published portfolios" ON journey_milestones
  FOR SELECT USING (timeline_id IN (SELECT jt.timeline_id FROM journey_timelines jt JOIN user_profiles up ON jt.org_id = up.org_id WHERE up.portfolio_status = 'published'));

CREATE POLICY "Public can read contact sections of published portfolios" ON contact_sections
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read social links of published portfolios" ON social_links
  FOR SELECT USING (contact_id IN (SELECT cs.contact_id FROM contact_sections cs JOIN user_profiles up ON cs.org_id = up.org_id WHERE up.portfolio_status = 'published'));

CREATE POLICY "Public can read cv sections of published portfolios" ON cv_sections
  FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE portfolio_status = 'published'));

CREATE POLICY "Public can read cv versions of published portfolios" ON cv_versions
  FOR SELECT USING (cv_section_id IN (SELECT cvs.cv_section_id FROM cv_sections cvs JOIN user_profiles up ON cvs.org_id = up.org_id WHERE up.portfolio_status = 'published'));
