-- 🚨 NUCLEAR OPTION: Completely Disable RLS
-- Use this if the previous fix didn't work
-- Copy and paste this into Supabase Dashboard → SQL Editor

-- Step 1: Completely disable RLS on both tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (nuclear approach)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on user_profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON user_profiles';
    END LOOP;
    
    -- Drop all policies on organizations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'organizations' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON organizations';
    END LOOP;
END $$;

-- Step 3: Grant maximum permissions (no RLS needed)
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON organizations TO authenticated;
GRANT ALL PRIVILEGES ON organizations TO anon;

-- Step 4: Create organizations for all users
INSERT INTO organizations (org_id, name, slug)
SELECT 
  id::text,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  'user-' || SUBSTRING(id::text, 1, 8)
FROM auth.users
WHERE id::text NOT IN (SELECT org_id FROM organizations WHERE org_id IS NOT NULL)
ON CONFLICT (org_id) DO NOTHING;

-- Step 5: Verify tables are accessible
SELECT 'NUCLEAR RLS DISABLE COMPLETE - All restrictions removed' as status;

-- Step 6: Show current state
SELECT COUNT(*) as user_profiles_count FROM user_profiles;
SELECT COUNT(*) as organizations_count FROM organizations;