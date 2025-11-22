-- ============================================================================
-- CLEANUP DUPLICATE JOURNEY TIMELINES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: See all timelines for your org
SELECT 
  timeline_id,
  title,
  subtitle,
  created_at,
  (SELECT COUNT(*) FROM journey_milestones WHERE timeline_id = journey_timelines.timeline_id) as milestone_count
FROM journey_timelines
WHERE org_id = 'default-org'
ORDER BY created_at DESC;

-- Step 2: Keep only the NEWEST timeline and delete the rest
-- This will keep the most recent one with all its milestones
DELETE FROM journey_timelines
WHERE org_id = 'default-org'
AND timeline_id NOT IN (
  SELECT timeline_id 
  FROM journey_timelines 
  WHERE org_id = 'default-org'
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 3: Verify only one timeline remains
SELECT 
  timeline_id,
  title,
  subtitle,
  created_at,
  (SELECT COUNT(*) FROM journey_milestones WHERE timeline_id = journey_timelines.timeline_id) as milestone_count
FROM journey_timelines
WHERE org_id = 'default-org';

-- ============================================================================
-- After running this:
-- 1. Refresh your admin page
-- 2. Open Journey Management
-- 3. Your milestones should appear!
-- ============================================================================
