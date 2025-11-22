-- ============================================
-- SETUP YOUR PUBLIC PORTFOLIO USERNAME
-- ============================================
-- Run this in Supabase SQL Editor after running migration 007

-- Step 1: Check your current profile
SELECT 
  user_id,
  email,
  name,
  username,
  is_portfolio_public,
  org_id
FROM user_profiles
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Step 2: Set your username (choose one you like!)
UPDATE user_profiles 
SET 
  username = 'arpan',  -- Change this to your desired username
  is_portfolio_public = true  -- Make portfolio public
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Step 3: Verify it worked
SELECT 
  username,
  is_portfolio_public,
  name
FROM user_profiles
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Step 4: Test the public URL
-- Visit: https://yoursite.vercel.app/u/arpan (replace 'arpan' with your username)

-- ============================================
-- OPTIONAL: Make Portfolio Private
-- ============================================
-- If you want to hide your portfolio temporarily:
-- UPDATE user_profiles 
-- SET is_portfolio_public = false
-- WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================
-- OPTIONAL: Change Username
-- ============================================
-- If you want to change your username later:
-- UPDATE user_profiles 
-- SET username = 'newusername'
-- WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================
-- CHECK ALL PUBLIC PORTFOLIOS
-- ============================================
-- See all users with public portfolios:
SELECT 
  username,
  name,
  email,
  is_portfolio_public,
  created_at
FROM user_profiles
WHERE is_portfolio_public = true
ORDER BY created_at DESC;
