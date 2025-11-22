-- ============================================================================
-- PUBLISH YOUR CASE STUDY
-- Run this in Supabase SQL Editor to make "ffs" visible on homepage
-- ============================================================================

-- Check current status
SELECT 
  case_study_id,
  title,
  status,
  created_at
FROM case_studies
WHERE title = 'ffs';

-- Publish the case study
UPDATE case_studies
SET 
  status = 'published',
  updated_at = NOW()
WHERE title = 'ffs';

-- Verify it's published
SELECT 
  case_study_id,
  title,
  status,
  updated_at
FROM case_studies
WHERE title = 'ffs';

-- ============================================================================
-- After running this:
-- 1. Refresh your homepage
-- 2. "ffs" should appear in "Magical Projects" section
-- 3. Demo projects will be replaced by your real project
-- ============================================================================
