-- Fixed SQL - Apply the portfolio publish system manually
-- Run this in Supabase SQL Editor

-- Add portfolio status to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS portfolio_status VARCHAR(20) DEFAULT 'draft' CHECK (portfolio_status IN ('draft', 'published'));

-- Add published versions table to store snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    snapshot_id VARCHAR(26) PRIMARY KEY DEFAULT generate_ulid(),
    org_id VARCHAR(50) NOT NULL REFERENCES user_profiles(org_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    version_number INTEGER DEFAULT 1
);

-- Add partial unique constraint separately (FIXED SYNTAX)
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_snapshots_org_published 
ON portfolio_snapshots(org_id) WHERE status = 'published';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_org_status ON portfolio_snapshots(org_id, status);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_published_at ON portfolio_snapshots(published_at) WHERE status = 'published';

-- Add publish tracking to all content tables
ALTER TABLE story_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE skill_categories ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE journey_timelines ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE carousel_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE cv_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE contact_sections ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Create function to publish entire portfolio
CREATE OR REPLACE FUNCTION publish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_data JSONB;
    v_snapshot_id VARCHAR(26);
    v_version_number INTEGER;
BEGIN
    -- Get current version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO v_version_number
    FROM portfolio_snapshots 
    WHERE org_id = p_org_id;
    
    -- Collect all portfolio data
    SELECT jsonb_build_object(
        'profile', (
            SELECT jsonb_build_object(
                'name', name,
                'username', username,
                'bio', bio,
                'location', location,
                'website', website,
                'avatar_url', avatar_url
            )
            FROM user_profiles 
            WHERE org_id = p_org_id
        ),
        'story', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'story_id', s.story_id,
                    'title', s.title,
                    'subtitle', s.subtitle,
                    'paragraphs', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'content', sp.content,
                                'order_index', sp.order_index
                            ) ORDER BY sp.order_index
                        )
                        FROM story_paragraphs sp
                        WHERE sp.story_id = s.story_id
                    )
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
                    'description', sc.description,
                    'skills', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name', sk.name,
                                'level', sk.level,
                                'order_index', sk.order_index
                            ) ORDER BY sk.order_index
                        )
                        FROM skills sk
                        WHERE sk.category_id = sc.category_id
                    )
                ) ORDER BY sc.order_index
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
                    'color', t.color,
                    'order_index', t.order_index
                ) ORDER BY t.order_index
            )
            FROM tools t
            WHERE t.org_id = p_org_id
        ),
        'projects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'case_study_id', cs.case_study_id,
                    'title', cs.title,
                    'description', cs.description,
                    'hero_image_url', cs.hero_image_url,
                    'tags', cs.tags,
                    'is_published', cs.is_published
                )
            )
            FROM case_studies cs
            WHERE cs.org_id = p_org_id AND cs.is_published = true
        ),
        'journey', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'timeline_id', jt.timeline_id,
                    'title', jt.title,
                    'description', jt.description,
                    'milestones', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'title', jm.title,
                                'company', jm.company,
                                'description', jm.description,
                                'start_date', jm.start_date,
                                'end_date', jm.end_date,
                                'order_index', jm.order_index
                            ) ORDER BY jm.order_index
                        )
                        FROM journey_milestones jm
                        WHERE jm.timeline_id = jt.timeline_id
                    )
                )
            )
            FROM journey_timelines jt
            WHERE jt.org_id = p_org_id
        ),
        'carousel', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'carousel_id', c.carousel_id,
                    'title', c.title,
                    'images', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'image_url', ci.image_url,
                                'caption', ci.caption,
                                'order_index', ci.order_index
                            ) ORDER BY ci.order_index
                        )
                        FROM carousel_images ci
                        WHERE ci.carousel_id = c.carousel_id
                    )
                )
            )
            FROM carousel_sections c
            WHERE c.org_id = p_org_id
        ),
        'cv', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cv_section_id', cv.cv_section_id,
                    'title', cv.title,
                    'description', cv.description,
                    'documents', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'document_name', cd.document_name,
                                'document_url', cd.document_url,
                                'document_type', cd.document_type,
                                'order_index', cd.order_index
                            ) ORDER BY cd.order_index
                        )
                        FROM cv_documents cd
                        WHERE cd.cv_section_id = cv.cv_section_id
                    )
                )
            )
            FROM cv_sections cv
            WHERE cv.org_id = p_org_id
        ),
        'contact', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'contact_id', c.contact_id,
                    'title', c.title,
                    'subtitle', c.subtitle,
                    'description', c.description,
                    'email', c.email,
                    'location', c.location,
                    'resume_url', c.resume_url,
                    'resume_button_text', c.resume_button_text,
                    'social_links', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name', csl.name,
                                'url', csl.url,
                                'icon', csl.icon,
                                'order_index', csl.order_index
                            ) ORDER BY csl.order_index
                        )
                        FROM contact_social_links csl
                        WHERE csl.contact_id = c.contact_id
                    )
                )
            )
            FROM contact_sections c
            WHERE c.org_id = p_org_id
        ),
        'published_at', NOW(),
        'version', v_version_number
    ) INTO v_snapshot_data;
    
    -- Archive current published version if exists
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
    UPDATE carousel_sections SET is_published = true WHERE org_id = p_org_id;
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

-- Create function to unpublish portfolio (make draft)
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
    UPDATE carousel_sections SET is_published = false WHERE org_id = p_org_id;
    UPDATE cv_sections SET is_published = false WHERE org_id = p_org_id;
    UPDATE contact_sections SET is_published = false WHERE org_id = p_org_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Portfolio unpublished successfully'
    );
END;
$$;

-- Create function to get published portfolio data
CREATE OR REPLACE FUNCTION get_published_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_data JSONB;
BEGIN
    SELECT snapshot_data
    INTO v_snapshot_data
    FROM portfolio_snapshots
    WHERE org_id = p_org_id AND status = 'published'
    ORDER BY published_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_snapshot_data, '{}'::jsonb);
END;
$$;

-- Update RLS policies for published content
-- Public users can only see published content
DROP POLICY IF EXISTS "Public can view published portfolios" ON user_profiles;
CREATE POLICY "Public can view published portfolios" ON user_profiles
    FOR SELECT USING (
        is_portfolio_public = true AND 
        portfolio_status = 'published'
    );

-- Add RLS for portfolio snapshots
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own snapshots" ON portfolio_snapshots
    FOR ALL USING (
        auth.uid()::text = (
            SELECT user_id FROM user_profiles WHERE org_id = portfolio_snapshots.org_id
        )
    );

CREATE POLICY "Public can view published snapshots" ON portfolio_snapshots
    FOR SELECT USING (
        status = 'published' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE org_id = portfolio_snapshots.org_id 
            AND is_portfolio_public = true
        )
    );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION publish_portfolio(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION unpublish_portfolio(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_published_portfolio(VARCHAR) TO authenticated, anon;