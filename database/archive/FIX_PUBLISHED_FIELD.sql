-- Fix: Add is_published field to case_studies table
-- Run this in Supabase SQL Editor if case studies aren't showing on homepage

-- Add is_published field if it doesn't exist
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add published_at timestamp
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_case_studies_published 
ON case_studies(is_published, created_at DESC);

-- IMPORTANT: Set all existing case studies to published
-- (Remove this line if you want them unpublished by default)
UPDATE case_studies 
SET is_published = true, 
    published_at = COALESCE(published_at, updated_at, created_at)
WHERE is_published IS NULL OR is_published = false;

-- Verify the update
SELECT case_study_id, title, is_published, published_at 
FROM case_studies 
ORDER BY created_at DESC;
