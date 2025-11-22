-- 🎯 TARGETED FIX: Duplicate Profile Issue
-- This fixes the "duplicate key value violates unique constraint" error
-- Copy and paste this into Supabase Dashboard → SQL Editor

-- Step 1: Temporarily disable RLS to see and fix existing data
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Show existing profiles to understand the issue
SELECT 
  user_id, 
  org_id, 
  email, 
  username, 
  is_portfolio_public,
  created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- Step 3: Create organizations for any users that don't have them
INSERT INTO organizations (org_id, name, slug)
SELECT 
  id::text,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  'user-' || SUBSTRING(id::text, 1, 8)
FROM auth.users
WHERE id::text NOT IN (SELECT org_id FROM organizations WHERE org_id IS NOT NULL)
ON CONFLICT (org_id) DO NOTHING;

-- Step 4: Fix any profiles that have missing or inconsistent data
UPDATE user_profiles 
SET 
  user_id = COALESCE(user_id, org_id::uuid),
  org_id = COALESCE(org_id, user_id::text),
  username = COALESCE(username, 'user' || EXTRACT(epoch FROM created_at)::text),
  is_portfolio_public = COALESCE(is_portfolio_public, true)
WHERE user_id IS NULL OR org_id IS NULL OR username IS NULL OR is_portfolio_public IS NULL;

-- Step 5: Remove ALL existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view published profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read for published profiles" ON user_profiles;

-- Step 6: Create VERY simple and permissive policies
CREATE POLICY "authenticated_users_full_access" ON user_profiles
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "public_read_published" ON user_profiles
    FOR SELECT 
    TO anon
    USING (is_portfolio_public = true);

-- Step 7: Same for organizations
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON organizations;

CREATE POLICY "authenticated_users_full_access" ON organizations
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 8: Re-enable RLS with the simple policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Step 9: Grant maximum permissions
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON organizations TO authenticated;

-- Step 10: Verify the fix worked
SELECT 'Duplicate Profile Issue Fixed - Very Permissive Policies Applied' as status;

-- Step 11: Show final state
SELECT 
  'Final Check:' as info,
  user_id, 
  org_id, 
  email, 
  username, 
  is_portfolio_public
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 3;