-- ============================================
-- CLEANUP DUPLICATE CV SECTIONS - RUN THIS NOW
-- ============================================
-- This fixes the persistence issue by removing 132 duplicate CV sections

-- Step 1: Check how many CV sections exist
SELECT 
  'Total CV sections:' as info,
  COUNT(*) as count,
  'Expected: 1' as expected
FROM cv_sections
WHERE org_id = 'default-org';

-- Step 2: Show all CV sections with their creation dates
SELECT 
  cv_section_id,
  title,
  created_at,
  CASE 
    WHEN created_at = (SELECT MAX(created_at) FROM cv_sections WHERE org_id = 'default-org')
    THEN '✅ KEEP (Most Recent)'
    ELSE '❌ DELETE'
  END as action
FROM cv_sections
WHERE org_id = 'default-org'
ORDER BY created_at DESC;

-- Step 3: Delete all CV sections EXCEPT the most recent one
-- This will CASCADE delete all related cv_versions
WITH latest_section AS (
  SELECT cv_section_id
  FROM cv_sections
  WHERE org_id = 'default-org'
  ORDER BY created_at DESC
  LIMIT 1
)
DELETE FROM cv_sections
WHERE org_id = 'default-org'
  AND cv_section_id NOT IN (SELECT cv_section_id FROM latest_section);

-- Step 4: Verify cleanup
SELECT 
  '✅ Cleanup complete!' as result,
  COUNT(*) as remaining_sections,
  'Expected: 1' as expected
FROM cv_sections
WHERE org_id = 'default-org';

-- Step 5: Show the remaining section
SELECT 
  cv_section_id,
  title,
  subtitle,
  created_at,
  (SELECT COUNT(*) FROM cv_versions WHERE cv_section_id = cv_sections.cv_section_id) as version_count
FROM cv_sections
WHERE org_id = 'default-org';

