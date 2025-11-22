-- Step 4: Enable RLS and add policies
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

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
);