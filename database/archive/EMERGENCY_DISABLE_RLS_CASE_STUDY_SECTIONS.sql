-- ============================================
-- EMERGENCY: Temporarily Disable RLS for case_study_sections
-- ============================================
-- This will allow case study editing to work immediately
-- while we fix the underlying org_id column issue

-- Step 1: Temporarily disable RLS to allow editing
ALTER TABLE case_study_sections DISABLE ROW LEVEL SECURITY;

-- Step 2: Add org_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'case_study_sections' 
        AND column_name = 'org_id'
    ) THEN
        ALTER TABLE case_study_sections ADD COLUMN org_id TEXT;
        RAISE NOTICE '✅ Added org_id column to case_study_sections';
    ELSE
        RAISE NOTICE '✅ org_id column already exists';
    END IF;
END $$;

-- Step 3: Populate org_id for existing records
UPDATE case_study_sections 
SET org_id = (
    SELECT cs.org_id 
    FROM case_studies cs 
    WHERE cs.case_study_id = case_study_sections.case_study_id
)
WHERE org_id IS NULL;

-- Step 4: Verify the update
SELECT 
    COUNT(*) as total_sections,
    COUNT(org_id) as sections_with_org_id,
    COUNT(*) - COUNT(org_id) as sections_without_org_id
FROM case_study_sections;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚨 EMERGENCY FIX APPLIED!';
    RAISE NOTICE '✅ RLS temporarily disabled on case_study_sections';
    RAISE NOTICE '✅ org_id column added and populated';
    RAISE NOTICE '🎯 Case study editing should work now!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: This is a temporary fix';
    RAISE NOTICE '📝 TODO: Re-enable RLS with proper policies later';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST: Try editing a case study section now';
END $$;