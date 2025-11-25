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

async function verifyAndPublish() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password';
  const username = `testuser-${Date.now()}`;

  // 1. Sign up a new user
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    process.exit(1);
  }

  if (!user) {
    console.error('Sign up did not return a user.');
    process.exit(1);
  }

  console.log(`User created: ${email}`);

  // 2. Create an organization
  const { error: orgError } = await supabase
    .from('organizations')
    .insert({
      org_id: user.id,
      name: `${username}'s Org`,
      slug: username,
    });

  if (orgError) {
    console.error('Failed to create organization:', orgError);
    process.exit(1);
  }

  console.log(`Organization created for ${username}`);

  // 3. Create a user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user.id,
      org_id: user.id, // Using user_id as org_id for simplicity
      email,
      name: 'Test User',
      username,
      portfolio_status: 'published',
    });

  if (profileError) {
    console.error('Failed to create profile:', profileError);
    process.exit(1);
  }

  console.log(`Profile created for ${username}`);

  // 4. Verify public access
  const { data: publicProfile, error: publicProfileError } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (publicProfileError || !publicProfile) {
    console.error('Failed to access public profile:', publicProfileError);
    process.exit(1);
  }

  console.log('Public profile is accessible!');
  console.log('Verification successful!');

  // Pass the username to the next step
  console.log(`::set-output name=username::${username}`);
}

verifyAndPublish();
