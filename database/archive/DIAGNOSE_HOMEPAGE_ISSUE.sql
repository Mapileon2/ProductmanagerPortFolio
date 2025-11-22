-- Diagnostic SQL to find why case studies aren't showing on homepage
-- Run this in Supabase SQL Editor

-- Step 1: Check if is_published column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'case_studies' 
AND column_name = 'is_published';
-- Expected: Should return 1 row with column_name = 'is_published'
-- If empty: Column doesn't exist, run FIX_PUBLISHED_FIELD.sql

-- Step 2: Count total case studies
SELECT COUNT(*) as total_case_studies 
FROM case_studies;
-- Expected: Should be > 0
-- If 0: No case studies exist, create one in Admin page

-- Step 3: Check published status of all case studies
SELECT 
  case_study_id,
  title,
  is_published,
  created_at,
  updated_at
FROM case_studies
ORDER BY created_at DESC;
-- Expected: is_published should be true for studies you want to show
-- If all false: Run UPDATE case_studies SET is_published = true;

-- Step 4: Count published case studies
SELECT COUNT(*) as published_count 
FROM case_studies 
WHERE is_published = true;
-- Expected: Should be > 0
-- If 0: No published studies, run UPDATE query above

-- Step 5: Check which published studies have hero sections
SELECT 
  cs.case_study_id,
  cs.title,
  cs.is_published,
  COUNT(css.section_id) as hero_section_count
FROM case_studies cs
LEFT JOIN case_study_sections css 
  ON cs.case_study_id = css.case_study_id 
  AND css.section_type = 'hero'
WHERE cs.is_published = true
GROUP BY cs.case_study_id, cs.title, cs.is_published;
-- Expected: hero_section_count should be > 0 for each study
-- If 0: Case study has no hero section, won't show on homepage

-- Step 6: Test the exact query used by getProjects()
SELECT 
  cs.case_study_id,
  cs.title,
  cs.hero_image_asset_id,
  cs.is_published,
  a.cloudinary_url as hero_image,
  css.content as hero_content
FROM case_studies cs
LEFT JOIN assets a ON cs.hero_image_asset_id = a.asset_id
INNER JOIN case_study_sections css 
  ON cs.case_study_id = css.case_study_id 
  AND css.section_type = 'hero'
WHERE cs.is_published = true;
-- Expected: Should return your published case studies
-- If empty: Check previous steps to see what's missing

-- Step 7: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'case_studies';
-- Expected: Should have policies allowing SELECT on published studies

-- QUICK FIX: If case studies exist but aren't published
-- Uncomment and run this:
-- UPDATE case_studies SET is_published = true WHERE is_published IS NULL OR is_published = false;

-- VERIFY: After running fixes, this should return your case studies:
SELECT 
  cs.title,
  cs.is_published,
  COUNT(css.section_id) as total_sections,
  COUNT(CASE WHEN css.section_type = 'hero' THEN 1 END) as hero_sections
FROM case_studies cs
LEFT JOIN case_study_sections css ON cs.case_study_id = css.case_study_id
GROUP BY cs.case_study_id, cs.title, cs.is_published
ORDER BY cs.created_at DESC;
