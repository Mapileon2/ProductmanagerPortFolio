import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { ulid } from 'ulid';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testJourneySave() {
  console.log('🔍 Testing Journey Save Functionality\n');
  console.log('='.repeat(70));

  // Login first
  const email = process.env.TEST_EMAIL || 'test@example.com';
  const password = process.env.TEST_PASSWORD || 'password123';

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login failed:', loginError.message);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const CURRENT_USER_ID = user.id;

  // Step 1: Check user profile
  console.log('\n📋 Step 1: Checking User Profile\n');
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', CURRENT_USER_ID)
    .maybeSingle();

  if (profileError) {
    console.log('❌ Error checking profile:', profileError.message);
    return;
  }

  if (!profile) {
    console.log('❌ No profile found for user:', CURRENT_USER_ID);
    console.log('\n💡 Run: node scripts/create-profile-for-current-user.js');
    return;
  }

  console.log('✅ Profile found');
  console.log(`   Org ID: ${profile.org_id}`);

  // Step 2: Try to create/update timeline
  console.log('\n📋 Step 2: Testing Timeline Creation\n');
  
  const timeline_id = ulid();
  const { data: timeline, error: timelineError } = await supabase
    .from('journey_timelines')
    .insert({
      timeline_id,
      org_id: profile.org_id,
      title: 'Test Journey',
      subtitle: 'Testing save functionality'
    })
    .select()
    .single();

  if (timelineError) {
    console.log('❌ Error creating timeline:', timelineError.message);
    console.log('   Code:', timelineError.code);
    console.log('   Details:', timelineError.details);
    console.log('\n💡 This is likely an RLS (Row Level Security) issue.');
    console.log('   The anon key cannot insert into journey_timelines.');
    console.log('\n📋 Solution: We need to fix RLS policies.');
    return;
  }

  console.log('✅ Timeline created successfully!');
  console.log(`   Timeline ID: ${timeline.timeline_id}`);

  // Step 3: Try to create milestone
  console.log('\n📋 Step 3: Testing Milestone Creation\n');
  
  const milestone_id = ulid();
  const { data: milestone, error: milestoneError } = await supabase
    .from('journey_milestones')
    .insert({
      milestone_id,
      timeline_id: timeline.timeline_id,
      title: 'Test Position',
      company: 'Test Company',
      period: '2024 - Present',
      description: 'Testing milestone creation',
      is_active: true,
      order_key: '000001'
    })
    .select()
    .single();

  if (milestoneError) {
    console.log('❌ Error creating milestone:', milestoneError.message);
    console.log('   Code:', milestoneError.code);
    console.log('   Details:', milestoneError.details);
    console.log('\n💡 This is likely an RLS issue.');
    return;
  }

  console.log('✅ Milestone created successfully!');
  console.log(`   Milestone ID: ${milestone.milestone_id}`);

  // Step 4: Clean up test data
  console.log('\n📋 Step 4: Cleaning Up Test Data\n');
  
  await supabase.from('journey_milestones').delete().eq('milestone_id', milestone_id);
  await supabase.from('journey_timelines').delete().eq('timeline_id', timeline_id);
  
  console.log('✅ Test data cleaned up');

  console.log('\n' + '='.repeat(70));
  console.log('\n🎉 All tests passed!');
  console.log('\n💡 Journey Management should work in the browser.');
  console.log('   If it still fails, check browser console for specific errors.');
}

testJourneySave().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error('\nFull error:', error);
});
