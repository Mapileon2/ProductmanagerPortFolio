-- ============================================
-- ADD org_id COLUMN TO case_study_sections
-- ============================================
-- This fixes the "column org_id does not exist" error

-- Step 1: Add the org_id column
ALTER TABLE case_study_sections 
ADD COLUMN IF NOT EXISTS org_id TEXT;

-- Step 2: Populate org_id from related case_studies
UPDATE case_study_sections 
SET org_id = (
    SELECT cs.org_id 
    FROM case_studies cs 
    WHERE cs.case_study_id = case_study_sections.case_study_id
)
WHERE org_id IS NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_case_study_sections_org_id 
ON case_study_sections(org_id);

-- Step 4: Verify the update worked
SELECT 
    css.section_id,
    css.case_study_id,
    css.org_id as section_org_id,
    cs.org_id as case_study_org_id,
    css.section_type,
    CASE 
        WHEN css.org_id = cs.org_id THEN '✅ Match'
        WHEN css.org_id IS NULL THEN '❌ NULL'
        ELSE '❌ Mismatch'
    END as status
FROM case_study_sections css
JOIN case_studies cs ON css.case_study_id = cs.case_study_id
ORDER BY css.created_at DESC
LIMIT 10;

-- Step 5: Now create the RLS policies (these will work now that org_id exists)

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can manage their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can insert their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can update their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can delete their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can read their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Public can read sections of published case studies" ON case_study_sections;

-- Create comprehensive RLS policies

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

-- 5. Public read policy for published case studies
CREATE POLICY "Public can read sections of published case studies" ON case_study_sections
  FOR SELECT USING (
    case_study_id IN (
      SELECT case_study_id FROM case_studies cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Step 6: Ensure RLS is enabled
ALTER TABLE case_study_sections ENABLE ROW LEVEL SECURITY;

-- Step 7: Verify policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'case_study_sections'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ org_id column added to case_study_sections!';
    RAISE NOTICE '✅ All existing sections updated with correct org_id!';
    RAISE NOTICE '✅ RLS policies created successfully!';
    RAISE NOTICE '🎉 Case study sections should now work properly!';
END $$;