-- Step 4: Enable RLS and add policies (FIXED)
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own snapshots" ON portfolio_snapshots
FOR ALL USING (
    org_id = (
        SELECT org_id FROM user_profiles WHERE user_id = auth.uid()::text
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