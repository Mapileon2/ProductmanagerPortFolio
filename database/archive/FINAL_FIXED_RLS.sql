-- Step 4: Enable RLS and add policies (FINAL FIX)
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own snapshots
CREATE POLICY "Users manage own snapshots" ON portfolio_snapshots
FOR ALL USING (
    org_id IN (
        SELECT org_id FROM user_profiles WHERE user_id = auth.uid()::text
    )
);

-- Policy for public to view published snapshots
CREATE POLICY "Public view published snapshots" ON portfolio_snapshots
FOR SELECT USING (
    status = 'published' AND
    org_id IN (
        SELECT org_id FROM user_profiles 
        WHERE is_portfolio_public = true
    )
);