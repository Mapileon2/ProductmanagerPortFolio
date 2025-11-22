-- ============================================
-- CLEANUP CV DUPLICATES - RUN THIS NOW
-- ============================================
-- This fixes the "123 rows" error by removing duplicate CV versions

-- Step 1: Check how many duplicates exist
SELECT 
  'Total CV versions:' as info,
  COUNT(*) as count
FROM cv_versions
UNION ALL
SELECT 
  'Total CV sections:' as info,
  COUNT(*) as count
FROM cv_sections
UNION ALL
SELECT 
  'Expected versions (sections × 3):' as info,
  COUNT(*) * 3 as count
FROM cv_sections;

-- Step 2: Show versions per section
SELECT 
  cv_section_id,
  COUNT(*) as version_count,
  CASE 
    WHEN COUNT(*) > 3 THEN '⚠️ Has duplicates'
    WHEN COUNT(*) = 3 THEN '✅ Correct'
    ELSE '⚠️ Missing versions'
  END as status
FROM cv_versions
GROUP BY cv_section_id
ORDER BY version_count DESC;

-- Step 3: Clean up duplicates (keeps only 3 most recent per section)
WITH ranked_versions AS (
  SELECT 
    cv_version_id,
    cv_section_id,
    name,
    type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY cv_section_id 
      ORDER BY created_at DESC
    ) as rn
  FROM cv_versions
)
DELETE FROM cv_versions
WHERE cv_version_id IN (
  SELECT cv_version_id 
  FROM ranked_versions 
  WHERE rn > 3
);

-- Step 4: Verify cleanup worked
SELECT 
  'After cleanup - Total CV versions:' as info,
  COUNT(*) as count
FROM cv_versions;

SELECT 
  'Versions per section:' as info,
  cv_section_id,
  COUNT(*) as count
FROM cv_versions
GROUP BY cv_section_id;

-- Step 5: Success message
SELECT '✅ Cleanup complete! Refresh your browser and try again.' as result;
