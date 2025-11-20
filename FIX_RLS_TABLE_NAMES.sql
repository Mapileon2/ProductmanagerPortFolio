-- Fix RLS policies to use correct table names AND enforce SaaS access control
-- Run this in Supabase SQL Editor

-- 1. Fix Journey RLS (Correct table is 'journey_timelines')
DROP POLICY IF EXISTS "Public read access for published journey timelines" ON journey_timelines;

CREATE POLICY "Public read access for published journey timelines" ON journey_timelines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = journey_timelines.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 2. Fix Journey Milestones RLS
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

-- 3. Fix Skill Categories RLS
DROP POLICY IF EXISTS "Public read access for published skill categories" ON skill_categories;

CREATE POLICY "Public read access for published skill categories" ON skill_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = skill_categories.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 4. Fix Skills RLS
DROP POLICY IF EXISTS "Public read access for published skills" ON skills;

CREATE POLICY "Public read access for published skills" ON skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM skill_categories
            JOIN user_profiles ON user_profiles.org_id = skill_categories.org_id
            WHERE skill_categories.category_id = skills.category_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 5. Fix Tools RLS
DROP POLICY IF EXISTS "Public read access for published tools" ON tools;

CREATE POLICY "Public read access for published tools" ON tools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = tools.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 6. Fix CV Sections RLS
DROP POLICY IF EXISTS "Public read access for published cv sections" ON cv_sections;

CREATE POLICY "Public read access for published cv sections" ON cv_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.org_id = cv_sections.org_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 7. Fix CV Versions RLS
DROP POLICY IF EXISTS "Public read access for published cv versions" ON cv_versions;

CREATE POLICY "Public read access for published cv versions" ON cv_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cv_sections
            JOIN user_profiles ON user_profiles.org_id = cv_sections.org_id
            WHERE cv_sections.cv_section_id = cv_versions.cv_section_id
            AND user_profiles.portfolio_status = 'published'
        )
    );

-- 8. Fix Case Studies RLS (CRITICAL: Enforce Org Status)
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

-- 9. Fix Case Study Sections RLS
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

COMMIT;
