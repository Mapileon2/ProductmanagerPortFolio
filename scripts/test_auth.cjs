const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password';

  console.log(`Testing with new user: ${email}`);

  // 1. Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    process.exit(1);
  }

  if (!signUpData.user) {
      console.error('Sign up did not return a user.');
      process.exit(1);
  }

  console.log('Sign up successful.');

  // 2. Sign out
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error('Sign out failed:', signOutError.message);
    process.exit(1);
  }

  console.log('Sign out successful.');

  // 3. Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    process.exit(1);
  }

  if (!signInData.user) {
      console.error('Sign in did not return a user.');
      process.exit(1);
  }

  console.log('Sign in successful.');
  console.log('Authentication test passed!');
}

testAuth();
