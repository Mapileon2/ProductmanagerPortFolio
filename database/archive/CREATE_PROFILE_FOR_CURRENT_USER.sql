-- ============================================================================
-- CREATE PROFILE FOR CURRENT USER
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current user
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '9d75db25-23d4-4710-8167-c0ca6c72e2ba';

-- Step 2: Ensure organization exists
INSERT INTO organizations (org_id, name, slug)
VALUES ('default-org', 'My Portfolio', 'my-portfolio')
ON CONFLICT (org_id) DO NOTHING;

-- Step 3: Create user profile for NEW user
INSERT INTO user_profiles (user_id, org_id, email, name, role)
VALUES (
  '9d75db25-23d4-4710-8167-c0ca6c72e2ba',  -- NEW user ID
  'default-org',
  'your-email@example.com',  -- ⚠️ REPLACE with your actual email
  'Portfolio Owner',
  'admin'
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
WHERE user_id = '9d75db25-23d4-4710-8167-c0ca6c72e2ba';

-- ============================================================================
-- After running this:
-- 1. Refresh your admin page
-- 2. Try saving in Journey Management
-- 3. It should work! ✅
-- ============================================================================
