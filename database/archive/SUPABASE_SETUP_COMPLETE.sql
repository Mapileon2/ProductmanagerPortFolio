-- ============================================================================
-- COMPLETE SUPABASE SETUP FOR USER PROFILE
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Ensure organization exists
INSERT INTO organizations (org_id, name, slug)
VALUES ('default-org', 'My Portfolio', 'my-portfolio')
ON CONFLICT (org_id) DO NOTHING;

-- Step 2: Get your user email from auth.users
-- (This will show your email - copy it for the next step)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Create user profile
-- IMPORTANT: Replace 'your-email@example.com' with your actual email from Step 2
INSERT INTO user_profiles (user_id, org_id, email, name, role)
VALUES (
  '1f1a3c1a-e0ff-42a6-910c-930724e7ea5d',  -- Your user ID
  'default-org',                             -- Organization ID
  'your-email@example.com',                  -- ⚠️ REPLACE THIS with your actual email
  'Portfolio Owner',                         -- Your name (you can change this)
  'admin'                                    -- Your role
)
ON CONFLICT (user_id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Verify the profile was created
SELECT 
  user_id,
  org_id,
  email,
  name,
  role,
  created_at
FROM user_profiles 
WHERE user_id = '1f1a3c1a-e0ff-42a6-910c-930724e7ea5d';

-- Step 5: Clean up duplicate CV sections (optional but recommended)
-- This removes the 10 extra CV sections created during testing
DELETE FROM cv_sections 
WHERE cv_section_id NOT IN (
  SELECT cv_section_id 
  FROM cv_sections 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Step 6: Verify everything is set up correctly
SELECT 
  'Organizations' as table_name,
  COUNT(*) as count
FROM organizations
UNION ALL
SELECT 
  'User Profiles' as table_name,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'CV Sections' as table_name,
  COUNT(*) as count
FROM cv_sections;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After running this, you should see:
-- ✅ 1 organization (default-org)
-- ✅ 1 user profile (your profile)
-- ✅ 1 CV section (cleaned up)
--
-- Then:
-- 1. Refresh your admin page
-- 2. Try uploading a file - it should work!
-- 3. All features will be enabled
-- ============================================================================
