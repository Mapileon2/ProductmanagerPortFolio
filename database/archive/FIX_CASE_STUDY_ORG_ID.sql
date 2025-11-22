-- Fix org_id mismatch for case studies
-- This updates all case studies to use the correct org_id from the public profile

-- Update case studies to match the profile org_id
UPDATE case_studies
SET org_id = 'arpan-portfolio'
WHERE org_id != 'arpan-portfolio';

-- Also update case_study_sections to match
UPDATE case_study_sections
SET org_id = 'arpan-portfolio'
WHERE org_id != 'arpan-portfolio';

-- Verify the fix
SELECT 
    cs.title,
    cs.org_id as case_study_org_id,
    cs.is_published,
    up.org_id as profile_org_id,
    up.username,
    CASE 
        WHEN cs.org_id = up.org_id THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM case_studies cs
CROSS JOIN user_profiles up
WHERE up.is_portfolio_public = true;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Case study org_id fixed!';
    RAISE NOTICE '🎉 Your case studies will now appear on the public homepage';
    RAISE NOTICE '🔄 Refresh http://localhost:3002/ to see them';
END $$;
