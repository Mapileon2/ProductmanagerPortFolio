-- ============================================
-- FIX: Case Studies Not Showing on Homepage
-- ============================================
-- Problem: Case studies have wrong org_id
-- Solution: Update to match your profile org_id

-- Update case studies to use correct org_id
UPDATE case_studies
SET org_id = 'arpan-portfolio'
WHERE org_id = 'default-org';

-- Verify the fix
SELECT 
    title,
    org_id,
    is_published,
    CASE 
        WHEN org_id = 'arpan-portfolio' THEN '✅ Correct'
        ELSE '❌ Wrong'
    END as status
FROM case_studies;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Case studies fixed!';
    RAISE NOTICE '🎉 Refresh your homepage to see them appear';
END $$;
