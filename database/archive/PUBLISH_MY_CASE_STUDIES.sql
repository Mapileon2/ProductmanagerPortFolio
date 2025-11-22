-- ============================================
-- PUBLISH CASE STUDIES - RUN THIS NOW
-- ============================================
-- This will make your case studies visible on the homepage

-- Step 1: Check current status
SELECT 
  case_study_id,
  title,
  status,
  created_at
FROM case_studies
WHERE org_id = 'default-org'
ORDER BY created_at DESC;

-- Step 2: Publish all draft case studies
UPDATE case_studies
SET status = 'published',
    updated_at = NOW()
WHERE org_id = 'default-org'
AND status = 'draft';

-- Step 3: Verify the update
SELECT 
  '✅ Case studies published!' as result,
  COUNT(*) as published_count
FROM case_studies
WHERE org_id = 'default-org'
AND status = 'published';

-- Step 4: Show all case studies with their status
SELECT 
  title,
  status,
  CASE 
    WHEN status = 'published' THEN '✅ Visible on homepage'
    WHEN status = 'draft' THEN '⚠️  Not visible (draft)'
    ELSE '📦 Archived'
  END as visibility
FROM case_studies
WHERE org_id = 'default-org'
ORDER BY created_at DESC;
