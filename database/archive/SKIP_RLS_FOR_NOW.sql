-- Step 4: Just enable RLS without policies for now
-- We can add policies later once the basic system works

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Temporarily allow all access for testing
CREATE POLICY "Allow all for testing" ON portfolio_snapshots
FOR ALL USING (true);