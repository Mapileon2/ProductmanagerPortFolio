-- Enable public read access to published portfolio data
-- Run this in Supabase SQL Editor

-- 1. User Profiles - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published portfolios" ON user_profiles;
CREATE POLICY "Public read access for published portfolios" ON user_profiles
    FOR SELECT USING (portfolio_status = 'published');

-- 2. Case Studies - Allow public read for published case studies
DROP POLICY IF EXISTS "Public read access for published case studies" ON case_studies;
CREATE POLICY "Public read access for published case studies" ON case_studies
    FOR SELECT USING (is_published = true);

-- 3. Case Study Sections - Allow public read for published case studies
DROP POLICY IF EXISTS "Public read access for published case study sections" ON case_study_sections;
CREATE POLICY "Public read access for published case study sections" ON case_study_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM case_studies 
            WHERE case_studies.case_study_id = case_study_sections.case_study_id 
            AND case_studies.is_published = true
        )
    );

-- 4. Story Sections - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published story sections" ON story_sections;
CREATE POLICY "Public read access for published story sections" ON story_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.org_id = story_sections.org_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 5. Story Paragraphs - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published story paragraphs" ON story_paragraphs;
CREATE POLICY "Public read access for published story paragraphs" ON story_paragraphs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story_sections 
            JOIN user_profiles ON user_profiles.org_id = story_sections.org_id
            WHERE story_sections.story_id = story_paragraphs.story_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 6. Journeys - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published journeys" ON journeys;
CREATE POLICY "Public read access for published journeys" ON journeys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.org_id = journeys.org_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 7. Journey Items - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published journey items" ON journey_items;
CREATE POLICY "Public read access for published journey items" ON journey_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journeys 
            JOIN user_profiles ON user_profiles.org_id = journeys.org_id
            WHERE journeys.journey_id = journey_items.journey_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 8. Magic Toolboxes - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published magic toolboxes" ON magic_toolboxes;
CREATE POLICY "Public read access for published magic toolboxes" ON magic_toolboxes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.org_id = magic_toolboxes.org_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 9. Skill Categories - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published skill categories" ON skill_categories;
CREATE POLICY "Public read access for published skill categories" ON skill_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM magic_toolboxes 
            JOIN user_profiles ON user_profiles.org_id = magic_toolboxes.org_id
            WHERE magic_toolboxes.toolbox_id = skill_categories.toolbox_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 10. Tools - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published tools" ON tools;
CREATE POLICY "Public read access for published tools" ON tools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM magic_toolboxes 
            JOIN user_profiles ON user_profiles.org_id = magic_toolboxes.org_id
            WHERE magic_toolboxes.toolbox_id = tools.toolbox_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 11. Contact Sections - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published contact sections" ON contact_sections;
CREATE POLICY "Public read access for published contact sections" ON contact_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.org_id = contact_sections.org_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 12. Social Links - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published social links" ON social_links;
CREATE POLICY "Public read access for published social links" ON social_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contact_sections 
            JOIN user_profiles ON user_profiles.org_id = contact_sections.org_id
            WHERE contact_sections.contact_id = social_links.contact_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 13. Carousel Slides - Allow public read for published portfolios
DROP POLICY IF EXISTS "Public read access for published carousel slides" ON carousel_slides;
CREATE POLICY "Public read access for published carousel slides" ON carousel_slides
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM carousels 
            JOIN user_profiles ON user_profiles.org_id = carousels.org_id
            WHERE carousels.carousel_id = carousel_slides.carousel_id 
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 14. Assets - Allow public read for assets used in published content
DROP POLICY IF EXISTS "Public read access for published assets" ON assets;
CREATE POLICY "Public read access for published assets" ON assets
    FOR SELECT USING (true); -- Assets are referenced by published content, so allow public read

-- Note: Keep existing authenticated policies for CREATE, UPDATE, DELETE operations
-- These policies only add public READ access, authentication is still required for modifications

COMMIT;