-- ============================================
-- FIX: case_study_sections RLS Policy Issue
-- ============================================
-- This fixes the "new row violates row-level security policy" error
-- when trying to save case study sections

-- First, check current policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'case_study_sections';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can manage their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can insert their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can update their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can delete their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can read their own case study sections" ON case_study_sections;

-- Create comprehensive RLS policies for case_study_sections

-- 1. SELECT policy (read access)
CREATE POLICY "Users can read their own case study sections" ON case_study_sections
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 2. INSERT policy (create access)
CREATE POLICY "Users can insert their own case study sections" ON case_study_sections
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. UPDATE policy (edit access)
CREATE POLICY "Users can update their own case study sections" ON case_study_sections
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 4. DELETE policy (delete access)
CREATE POLICY "Users can delete their own case study sections" ON case_study_sections
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Also add public read policy for published case studies
CREATE POLICY "Public can read sections of published case studies" ON case_study_sections
  FOR SELECT USING (
    case_study_id IN (
      SELECT case_study_id FROM case_studies cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Ensure the table has RLS enabled
ALTER TABLE case_study_sections ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'case_study_sections'
ORDER BY policyname;

-- Test query to check if org_id column exists and is properly set
SELECT 
    css.section_id,
    css.case_study_id,
    css.org_id as section_org_id,
    cs.org_id as case_study_org_id,
    CASE 
        WHEN css.org_id = cs.org_id THEN '✅ Match'
        WHEN css.org_id IS NULL THEN '❌ NULL'
        ELSE '❌ Mismatch'
    END as org_id_status
FROM case_study_sections css
JOIN case_studies cs ON css.case_study_id = cs.case_study_id
LIMIT 5;

-- If org_id is NULL in case_study_sections, update it
UPDATE case_study_sections 
SET org_id = (
    SELECT cs.org_id 
    FROM case_studies cs 
    WHERE cs.case_study_id = case_study_sections.case_study_id
)
WHERE org_id IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ case_study_sections RLS policies fixed!';
    RAISE NOTICE '📝 You should now be able to save case study sections';
    RAISE NOTICE '🔄 Try creating/editing a case study section again';
END $$;