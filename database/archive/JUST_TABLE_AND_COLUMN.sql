-- Just create the basic structure first
-- Run this to test if the table creation works

-- Add portfolio status column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS portfolio_status VARCHAR(20) DEFAULT 'draft';

-- Create snapshots table with TEXT ID
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