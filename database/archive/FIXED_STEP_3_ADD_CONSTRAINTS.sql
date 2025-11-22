-- Step 3: Add constraints and indexes (FIXED)
-- Skip foreign key constraint since org_id is not primary key in user_profiles
-- Just add the unique constraint for published status

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_per_org 
ON portfolio_snapshots(org_id) WHERE status = 'published';