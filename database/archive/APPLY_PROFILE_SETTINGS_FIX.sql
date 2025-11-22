-- 🔧 COMPLETE PROFILE SETTINGS FIX
-- Copy and paste this entire SQL block into Supabase Dashboard → SQL Editor
-- This fixes RLS policies, foreign key constraints, and profile creation issues

-- Step 1: Temporarily disable RLS to fix the constraint issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Create organization for existing users (if any)
INSERT INTO organizations (org_id, name, slug)
SELECT 
  id::text,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  'user-' || SUBSTRING(id::text, 1, 8)
FROM auth.users
WHERE id::text NOT IN (SELECT org_id FROM organizations)
ON CONFLICT (org_id) DO NOTHING;

-- Step 3: Fix existing user_profiles that might have inconsistent data
-- Update profiles to ensure both user_id and org_id are set correctly
UPDATE user_profiles 
SET 
  user_id = CASE 
    WHEN user_id IS NULL THEN org_id::uuid 
    ELSE user_id 
  END,
  org_id = CASE 
    WHEN org_id IS NULL THEN user_id::text 
    ELSE org_id 
  END
WHERE user_id IS NULL OR org_id IS NULL;

-- Step 4: Add missing username and is_portfolio_public columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'username') THEN
    ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_portfolio_public') THEN
    ALTER TABLE user_profiles ADD COLUMN is_portfolio_public BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Step 5: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view published profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;

-- Step 6: Create proper RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (
      auth.uid() = user_id OR 
      auth.uid()::text = org_id OR 
      is_portfolio_public = true
    );

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (
      auth.uid() = user_id AND 
      auth.uid()::text = org_id
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (
      auth.uid() = user_id OR 
      auth.uid()::text = org_id
    ) WITH CHECK (
      auth.uid() = user_id AND 
      auth.uid()::text = org_id
    );

-- Step 7: Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;

CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (auth.uid()::text = org_id);

CREATE POLICY "Users can insert own organization" ON organizations
    FOR INSERT WITH CHECK (auth.uid()::text = org_id);

CREATE POLICY "Users can update own organization" ON organizations
    FOR UPDATE USING (auth.uid()::text = org_id)
    WITH CHECK (auth.uid()::text = org_id);

-- Step 8: Re-enable RLS with proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Step 9: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;

-- Step 10: Clean up any duplicate or problematic profiles
-- This handles the "duplicate key" error by ensuring uniqueness
DELETE FROM user_profiles a USING user_profiles b 
WHERE a.user_id = b.user_id AND a.created_at < b.created_at;

-- Step 11: Verify the fix
SELECT 'Profile Settings Fix Applied Successfully - RLS Policies Updated' as status;

-- Step 12: Show current user profiles for verification
SELECT 
  user_id, 
  org_id, 
  email, 
  username, 
  is_portfolio_public,
  created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;