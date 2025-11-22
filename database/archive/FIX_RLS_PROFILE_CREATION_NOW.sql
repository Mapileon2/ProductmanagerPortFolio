-- 🔧 EMERGENCY FIX: RLS Profile Creation Issue
-- This fixes the "new row violates row-level security policy" error

-- Step 1: Check current RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Step 2: Temporarily disable RLS to allow profile creation (EMERGENCY ONLY)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create proper RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view published profiles" ON user_profiles;

-- Step 4: Create comprehensive RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = org_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = org_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = org_id)
    WITH CHECK (auth.uid()::text = org_id);

-- Allow public access to view published profiles (for public portfolios)
CREATE POLICY "Public can view published profiles" ON user_profiles
    FOR SELECT USING (is_portfolio_public = true);

-- Step 5: Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Step 7: Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Step 8: Test profile creation (this should work now)
-- This will be tested by the application, not run here

-- NOTES:
-- 1. This fixes the RLS policy violation error
-- 2. Allows authenticated users to create/read/update their own profiles
-- 3. Allows public access to published profiles for public portfolio viewing
-- 4. Maintains security while enabling functionality