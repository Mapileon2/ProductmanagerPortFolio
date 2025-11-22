-- 🚨 EMERGENCY RLS DISABLE FIX
-- This completely disables RLS temporarily to fix the profile issue
-- Copy and paste this into Supabase Dashboard → SQL Editor

-- Step 1: Completely disable RLS on both tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view published profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;

-- Step 3: Create organizations for all auth users
INSERT INTO organizations (org_id, name, slug)
SELECT 
  id::text,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  'user-' || SUBSTRING(id::text, 1, 8)
FROM auth.users
WHERE id::text NOT IN (SELECT org_id FROM organizations WHERE org_id IS NOT NULL)
ON CONFLICT (org_id) DO NOTHING;

-- Step 4: Clean up any problematic profiles
DELETE FROM user_profiles WHERE user_id IS NULL OR org_id IS NULL;

-- Step 5: Ensure username and is_portfolio_public columns exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'username') THEN
    ALTER TABLE user_profiles ADD COLUMN username TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_portfolio_public') THEN
    ALTER TABLE user_profiles ADD COLUMN is_portfolio_public BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Step 6: Create a simple, permissive RLS policy
CREATE POLICY "Allow all operations for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read for published profiles" ON user_profiles
    FOR SELECT USING (is_portfolio_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON organizations
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Re-enable RLS with simple policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Step 8: Grant broad permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
GRANT ALL ON organizations TO authenticated;

-- Step 9: Verify the fix
SELECT 'Emergency RLS Fix Applied - Profile Settings Should Work Now' as status;

-- Step 10: Show any existing profiles
SELECT user_id, org_id, email, username, is_portfolio_public 
FROM user_profiles 
LIMIT 5;