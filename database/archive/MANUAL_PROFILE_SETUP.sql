-- Manual User Profile Setup
-- Run this in your Supabase SQL Editor

-- Step 1: Verify organization exists (should already exist)
INSERT INTO organizations (org_id, name, slug)
VALUES ('default-org', 'My Portfolio', 'my-portfolio')
ON CONFLICT (org_id) DO NOTHING;

-- Step 2: Create user profile
-- Replace the user_id and email with your actual values
INSERT INTO user_profiles (user_id, org_id, email, name, role)
VALUES (
  '1f1a3c1a-e0ff-42a6-910c-930724e7ea5d',  -- Your user ID
  'default-org',                             -- Organization ID
  'your-email@example.com',                  -- Your email (get from auth.users)
  'Portfolio Owner',                         -- Your name
  'admin'                                    -- Your role
)
ON CONFLICT (user_id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 3: Verify the profile was created
SELECT * FROM user_profiles WHERE user_id = '1f1a3c1a-e0ff-42a6-910c-930724e7ea5d';
