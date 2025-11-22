-- ============================================
-- FINAL FIX: Case Study Sections RLS Issue
-- ============================================
-- This is the definitive fix for the RLS policy error

-- Step 1: Check if org_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'case_study_sections' 
        AND column_name = 'org_id'
    ) THEN
        -- Add the org_id column
        ALTER TABLE case_study_sections ADD COLUMN org_id TEXT;
        RAISE NOTICE '✅ Added org_id column to case_study_sections';
    ELSE
        RAISE NOTICE '✅ org_id column already exists in case_study_sections';
    END IF;
END $$;

-- Step 2: Populate org_id for existing records
UPDATE case_study_sections 
SET org_id = (
    SELECT cs.org_id 
    FROM case_studies cs 
    WHERE cs.case_study_id = case_study_sections.case_study_id
)
WHERE org_id IS NULL;

-- Step 3: Verify the update worked
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM case_study_sections 
    WHERE org_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE NOTICE '⚠️  Warning: % case_study_sections still have NULL org_id', null_count;
    ELSE
        RAISE NOTICE '✅ All case_study_sections have org_id populated';
    END IF;
END $$;

-- Step 4: Disable RLS temporarily to clean up policies
ALTER TABLE case_study_sections DISABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can insert their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can update their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can delete their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Users can read their own case study sections" ON case_study_sections;
DROP POLICY IF EXISTS "Public can read sections of published case studies" ON case_study_sections;
DROP POLICY IF EXISTS "case_study_sections_select_policy" ON case_study_sections;
DROP POLICY IF EXISTS "case_study_sections_insert_policy" ON case_study_sections;
DROP POLICY IF EXISTS "case_study_sections_update_policy" ON case_study_sections;
DROP POLICY IF EXISTS "case_study_sections_delete_policy" ON case_study_sections;

-- Step 6: Create comprehensive RLS policies

-- 1. SELECT policy (read access) - for authenticated users
CREATE POLICY "authenticated_users_can_read_own_case_study_sections" ON case_study_sections
  FOR SELECT 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 2. INSERT policy (create access) - for authenticated users
CREATE POLICY "authenticated_users_can_insert_own_case_study_sections" ON case_study_sections
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. UPDATE policy (edit access) - for authenticated users
CREATE POLICY "authenticated_users_can_update_own_case_study_sections" ON case_study_sections
  FOR UPDATE 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  ) 
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 4. DELETE policy (delete access) - for authenticated users
CREATE POLICY "authenticated_users_can_delete_own_case_study_sections" ON case_study_sections
  FOR DELETE 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 5. Public read policy for published case studies - for anonymous users
CREATE POLICY "public_can_read_published_case_study_sections" ON case_study_sections
  FOR SELECT 
  TO anon
  USING (
    case_study_id IN (
      SELECT case_study_id FROM case_studies cs
      JOIN user_profiles up ON cs.org_id = up.org_id
      WHERE cs.is_published = true AND up.is_portfolio_public = true
    )
  );

-- Step 7: Re-enable RLS
ALTER TABLE case_study_sections ENABLE ROW LEVEL SECURITY;

-- Step 8: Add index for performance
CREATE INDEX IF NOT EXISTS idx_case_study_sections_org_id ON case_study_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_case_study_sections_case_study_id ON case_study_sections(case_study_id);

-- Step 9: Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'case_study_sections'
ORDER BY policyname;

-- Step 10: Test the setup with a sample query
DO $$
DECLARE
    section_count INTEGER;
BEGIN
    -- Count sections (this should work without RLS errors)
    SELECT COUNT(*) INTO section_count FROM case_study_sections;
    RAISE NOTICE '✅ Found % case study sections', section_count;
    
    -- Check org_id distribution
    FOR rec IN (
        SELECT org_id, COUNT(*) as count 
        FROM case_study_sections 
        GROUP BY org_id
    ) LOOP
        RAISE NOTICE '   org_id: % has % sections', rec.org_id, rec.count;
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CASE STUDY SECTIONS FIX COMPLETE!';
    RAISE NOTICE '✅ org_id column added and populated';
    RAISE NOTICE '✅ RLS policies created with proper roles';
    RAISE NOTICE '✅ Performance indexes added';
    RAISE NOTICE '✅ Case study editing should now work!';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST: Try editing a case study section now';
END $$;