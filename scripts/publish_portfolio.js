
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

async function publish() {
  const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password',
  });

  if (loginError || !user) {
    console.error('Could not log in:', loginError?.message);
    process.exit(1);
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ portfolio_status: 'published', username: 'youremail', name: 'test' })
    .eq('email', 'test@example.com');

  if (error) {
    console.error('Could not publish portfolio:', error);
    process.exit(1);
  }

  console.log('Portfolio published successfully for test@example.com');
}

publish();
