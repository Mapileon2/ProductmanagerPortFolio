-- ============================================
-- RE-ENABLE RLS for case_study_sections with Proper Policies
-- ============================================
-- Run this AFTER the emergency fix and testing is complete

-- Step 1: Verify org_id column exists and is populated
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM case_study_sections;
    SELECT COUNT(*) INTO null_count FROM case_study_sections WHERE org_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot re-enable RLS: % sections still have NULL org_id', null_count;
    END IF;
    
    RAISE NOTICE '✅ All % sections have org_id populated', total_count;
END $$;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "authenticated_users_can_read_own_case_study_sections" ON case_study_sections;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_case_study_sections" ON case_study_sections;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_case_study_sections" ON case_study_sections;
DROP POLICY IF EXISTS "authenticated_users_can_delete_own_case_study_sections" ON case_study_sections;
DROP POLICY IF EXISTS "public_can_read_published_case_study_sections" ON case_study_sections;

-- Step 3: Create comprehensive RLS policies

-- Policy 1: Authenticated users can read their own sections
CREATE POLICY "authenticated_users_can_read_own_case_study_sections" ON case_study_sections
  FOR SELECT 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Authenticated users can insert their own sections
CREATE POLICY "authenticated_users_can_insert_own_case_study_sections" ON case_study_sections
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Authenticated users can update their own sections
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

-- Policy 4: Authenticated users can delete their own sections
CREATE POLICY "authenticated_users_can_delete_own_case_study_sections" ON case_study_sections
  FOR DELETE 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Public can read published case study sections
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

-- Step 4: Re-enable RLS
ALTER TABLE case_study_sections ENABLE ROW LEVEL SECURITY;

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_case_study_sections_org_id ON case_study_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_case_study_sections_case_study_id ON case_study_sections(case_study_id);

-- Step 6: Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'case_study_sections'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS RE-ENABLED with Proper Policies!';
    RAISE NOTICE '✅ All CRUD operations protected';
    RAISE NOTICE '✅ Public read access for published case studies';
    RAISE NOTICE '✅ Private data remains secure';
    RAISE NOTICE '✅ Performance indexes added';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST: Verify case study editing still works';
    RAISE NOTICE '🌐 TEST: Verify public portfolios still accessible';
END $$;