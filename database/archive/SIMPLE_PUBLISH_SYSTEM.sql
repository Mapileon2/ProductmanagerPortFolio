-- Simple Portfolio Publish System
-- Run this in Supabase SQL Editor

-- Step 1: Add portfolio status column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS portfolio_status VARCHAR(20) DEFAULT 'draft';

-- Step 2: Create snapshots table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add foreign key constraint
ALTER TABLE portfolio_snapshots 
ADD CONSTRAINT fk_portfolio_snapshots_org_id 
FOREIGN KEY (org_id) REFERENCES user_profiles(org_id) ON DELETE CASCADE;

-- Step 4: Add unique constraint for published status
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_per_org 
ON portfolio_snapshots(org_id) WHERE status = 'published';

-- Step 5: Enable RLS
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Step 6: Add RLS policies
CREATE POLICY "Users manage own snapshots" ON portfolio_snapshots
FOR ALL USING (
    auth.uid()::text = (
        SELECT user_id FROM user_profiles WHERE org_id = portfolio_snapshots.org_id
    )
);

CREATE POLICY "Public view published snapshots" ON portfolio_snapshots
FOR SELECT USING (
    status = 'published' AND
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE org_id = portfolio_snapshots.org_id 
        AND is_portfolio_public = true
    )
);-- St
ep 7: Create publish function
CREATE OR REPLACE FUNCTION publish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id UUID;
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

-- Step 8: Create unpublish function
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

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION publish_portfolio(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION unpublish_portfolio(VARCHAR) TO authenticated;