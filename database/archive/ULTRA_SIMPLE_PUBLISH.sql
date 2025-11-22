-- Ultra simple publish system - no UUID issues
-- Run this as one complete script

-- Add portfolio status column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS portfolio_status VARCHAR(20) DEFAULT 'draft';

-- Create snapshots table with TEXT ID to avoid UUID issues
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    snapshot_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    snapshot_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_per_org 
ON portfolio_snapshots(org_id) WHERE status = 'published';

-- Simple publish function
CREATE OR REPLACE FUNCTION publish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id TEXT;
BEGIN
    -- Archive existing published snapshot
    UPDATE portfolio_snapshots 
    SET status = 'archived'
    WHERE org_id = p_org_id AND status = 'published';
    
    -- Create new published snapshot
    INSERT INTO portfolio_snapshots (org_id, status, snapshot_data, published_at)
    VALUES (
        p_org_id, 
        'published', 
        jsonb_build_object('published_at', NOW()),
        NOW()
    )
    RETURNING snapshot_id INTO v_snapshot_id;
    
    -- Update profile status
    UPDATE user_profiles 
    SET portfolio_status = 'published'
    WHERE org_id = p_org_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'snapshot_id', v_snapshot_id,
        'message', 'Portfolio published successfully'
    );
END;
$$;

-- Simple unpublish function
CREATE OR REPLACE FUNCTION unpublish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update profile status
    UPDATE user_profiles 
    SET portfolio_status = 'draft'
    WHERE org_id = p_org_id;
    
    -- Archive published snapshot
    UPDATE portfolio_snapshots 
    SET status = 'archived'
    WHERE org_id = p_org_id AND status = 'published';
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Portfolio unpublished successfully'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION publish_portfolio(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION unpublish_portfolio(VARCHAR) TO authenticated;