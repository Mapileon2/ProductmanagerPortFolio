-- Step 3: Add constraints and indexes
ALTER TABLE portfolio_snapshots 
ADD CONSTRAINT fk_portfolio_snapshots_org_id 
FOREIGN KEY (org_id) REFERENCES user_profiles(org_id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_per_org 
ON portfolio_snapshots(org_id) WHERE status = 'published';