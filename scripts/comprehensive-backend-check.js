import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function comprehensiveBackendCheck() {
  console.log('🔍 Comprehensive Backend Check for Profile Settings...\n');

  try {
    // Step 1: Check environment variables
    console.log('1. Checking environment variables...');
    if (!process.env.VITE_SUPABASE_URL) {
      console.error('❌ VITE_SUPABASE_URL is missing');
      return;
    }
    if (!process.env.VITE_SUPABASE_ANON_KEY) {
      console.error('❌ VITE_SUPABASE_ANON_KEY is missing');
      return;
    }
    console.log('✅ Environment variables present');
    console.log('   Supabase URL:', process.env.VITE_SUPABASE_URL);

    // Step 2: Test basic connection
    console.log('\n2. Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      console.log('   Error code:', connectionError.code);
      console.log('   Error details:', connectionError.details);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Step 3: Check table structure
    console.log('\n3. Checking user_profiles table structure...');
    const { data: tableStructure, error: structureError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Table structure error:', structureError.message);
    } else {
      console.log('✅ Table structure accessible');
      if (tableStructure && tableStructure.length > 0) {
        console.log('   Available columns:', Object.keys(tableStructure[0]));
      } else {
        console.log('   Table is empty (no existing profiles)');
      }
    }

    // Step 4: Check RLS policies
    console.log('\n4. Testing RLS policies...');
    
    // Try to access without authentication (should fail)
    const { data: noAuthData, error: noAuthError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .limit(1);

    if (noAuthError) {
      console.log('✅ RLS is working (unauthenticated access blocked)');
      console.log('   Error:', noAuthError.message);
    } else {
      console.log('⚠️  RLS might not be properly configured (unauthenticated access allowed)');
    }

    // Step 5: Check authentication status
    console.log('\n5. Checking authentication status...');

    const email = process.env.TEST_EMAIL || 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password123';
    await supabase.auth.signInWithPassword({ email, password });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('   This is expected when running from command line');
      console.log('   In browser, user should be authenticated');
    } else {
      console.log('✅ User authenticated:', user.email);
      
      // Step 6: Test profile operations for authenticated user
      console.log('\n6. Testing profile operations...');
      
      // Try to get profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('org_id', user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile not found:', profileError.message);
        
        if (profileError.code === 'PGRST116') {
          console.log('\n🔧 Attempting to create profile...');
          
          const defaultUsername = user.email?.split('@')[0]?.replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-6)}`;
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              org_id: user.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email,
              username: defaultUsername,
              is_portfolio_public: true
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Profile creation failed:', createError.message);
          } else {
            console.log('✅ Profile created successfully:', newProfile.username);
          }
        }
      } else {
        console.log('✅ Profile found:', userProfile.username);
      }
    }

    // Step 7: Check for common issues
    console.log('\n7. Checking for common issues...');
    
    // Check if there are any profiles at all
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('org_id, username, created_at')
      .limit(5);

    if (allError) {
      console.error('❌ Cannot access profiles table:', allError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Total profiles visible:', allProfiles?.length || 0);
      
      if (allProfiles && allProfiles.length > 0) {
        console.log('   Sample profiles:');
        allProfiles.forEach((p, i) => {
          console.log(`     ${i + 1}. ${p.username} (${p.org_id.slice(0, 8)}...)`);
        });
      }
    }

    // Step 8: Test API endpoints
    console.log('\n8. Testing API endpoint patterns...');
    
    // Test the exact query that ProfileSettingsManager uses
    console.log('   Testing ProfileSettingsManager query pattern...');
    
    if (user) {
      const { data: testQuery, error: testError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('org_id', user.id)
        .single();

      if (testError) {
        console.log('   ❌ Query failed:', testError.message);
        console.log('   Error code:', testError.code);
      } else {
        console.log('   ✅ Query successful');
      }
    }

  } catch (error) {
    console.error('❌ Comprehensive check failed:', error.message);
  }
}

// Run comprehensive check
comprehensiveBackendCheck().then(() => {
  console.log('\n🏁 Comprehensive backend check complete');
  console.log('\n💡 Next Steps:');
  console.log('1. If authentication issues: Make sure user is logged in browser');
  console.log('2. If RLS issues: Check Supabase dashboard RLS policies');
  console.log('3. If table issues: Run database migrations');
  console.log('4. If profile creation fails: Check unique constraints');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check crashed:', error);
  process.exit(1);
});