-- Test the publish system
-- Run this after all steps are complete

-- Check if table exists
SELECT 'portfolio_snapshots table exists' as status 
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'portfolio_snapshots'
);

-- Check if functions exist
SELECT 'publish_portfolio function exists' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'publish_portfolio'
);

-- Check if portfolio_status column exists
SELECT 'portfolio_status column exists' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'portfolio_status'
);