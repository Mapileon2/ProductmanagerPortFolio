-- Step 5: Create publish function
CREATE OR REPLACE FUNCTION publish_portfolio(p_org_id VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    UPDATE portfolio_snapshots 
    SET status = 'archived'
    WHERE org_id = p_org_id AND status = 'published';
    
    INSERT INTO portfolio_snapshots (org_id, status, snapshot_data, published_at)
    VALUES (
        p_org_id, 
        'published', 
        jsonb_build_object('published_at', NOW()),
        NOW()
    )
    RETURNING snapshot_id INTO v_snapshot_id;
    
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