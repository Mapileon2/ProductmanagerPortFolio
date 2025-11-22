-- Fix Publish RPC functions to match actual schema
-- Run this in Supabase SQL Editor

-- 1. Ensure is_published columns exist (for granular control)
ALTER TABLE story_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE skill_categories ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE journey_timelines ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE carousels ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false; -- Correct table name
ALTER TABLE cv_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE contact_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 2. Redefine publish_portfolio with correct table names and columns
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
    -- Get current version number (handle table existence check via error suppression or just assume it exists from previous scripts)
    -- We assume portfolio_snapshots exists as defined in PORTFOLIO_PUBLISH_SYSTEM_FIXED.sql

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM portfolio_snapshots
    WHERE org_id = p_org_id;

    -- Collect all portfolio data (Adjusted for schema: order_key, correct tables)
    SELECT jsonb_build_object(
        'profile', (
            SELECT jsonb_build_object(
                'name', name,
                'username', username,
                'role', role
            )
            FROM user_profiles
            WHERE org_id = p_org_id
        ),
        'story', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'story_id', s.story_id,
                    'title', s.title,
                    'subtitle', s.subtitle
                )
            )
            FROM story_sections s
            WHERE s.org_id = p_org_id
        ),
        'skills', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'category_id', sc.category_id,
                    'title', sc.title,
                    'color', sc.color
                ) ORDER BY sc.order_key
            )
            FROM skill_categories sc
            WHERE sc.org_id = p_org_id
        ),
        'tools', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'tool_id', t.tool_id,
                    'name', t.name,
                    'icon', t.icon,
                    'color', t.color
                ) ORDER BY t.order_key
            )
            FROM tools t
            WHERE t.org_id = p_org_id
        ),
        'projects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'case_study_id', cs.case_study_id,
                    'title', cs.title,
                    'is_published', cs.is_published
                )
            )
            FROM case_studies cs
            WHERE cs.org_id = p_org_id AND cs.is_published = true
        ),
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

    -- Mark all content as published (using correct table names)
    UPDATE story_sections SET is_published = true WHERE org_id = p_org_id;
    UPDATE skill_categories SET is_published = true WHERE org_id = p_org_id;
    UPDATE tools SET is_published = true WHERE org_id = p_org_id;
    UPDATE journey_timelines SET is_published = true WHERE org_id = p_org_id;
    UPDATE carousels SET is_published = true WHERE org_id = p_org_id; -- Corrected
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

-- 3. Redefine unpublish_portfolio
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
    UPDATE carousels SET is_published = false WHERE org_id = p_org_id; -- Corrected
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
