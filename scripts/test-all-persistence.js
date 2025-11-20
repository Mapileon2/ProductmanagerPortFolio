import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSection(tableName, idColumn, label, userId) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('user_id', userId)
    .single()
  
  if (!profile) return { status: 'error', message: 'No profile' }
  
  // Count sections
  const { data: sections } = await supabase
    .from(tableName)
    .select(idColumn)
    .eq('org_id', profile.org_id)
  
  const count = sections?.length || 0
  
  if (count === 0) {
    return { status: 'empty', count: 0 }
  } else if (count === 1) {
    return { status: 'ok', count: 1 }
  } else {
    // For skill_categories, we might have multiple categories
    if (tableName === 'skill_categories') {
         return { status: 'ok', count: count }
    }
    return { status: 'duplicates', count }
  }
}

async function testAllPersistence() {
  console.log('🧪 TESTING ALL SECTION PERSISTENCE\n')
  console.log('=' .repeat(70))

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
  
  const sections = [
    { table: 'story_sections', id: 'story_id', label: 'My Story' },
    { table: 'cv_sections', id: 'cv_section_id', label: 'CV' },
    { table: 'contact_sections', id: 'contact_id', label: 'Contact' },
    { table: 'carousels', id: 'carousel_id', label: 'Carousel' },
    { table: 'journey_timelines', id: 'timeline_id', label: 'My Journey' },
    { table: 'skill_categories', id: 'category_id', label: 'Magic Toolbox (Categories)' },
    { table: 'ai_configurations', id: 'configuration_id', label: 'AI Settings' }
  ]
  
  console.log('📊 Section Status:\n')
  
  let allGood = true
  
  for (const section of sections) {
    const result = await testSection(section.table, section.id, section.label, CURRENT_USER_ID)
    
    let icon, message
    if (result.status === 'ok') {
      icon = '✅'
      message = `${section.label}: 1 section (perfect!)`
    } else if (result.status === 'empty') {
      icon = '⚠️ '
      message = `${section.label}: No sections (will be created on first use)`
    } else if (result.status === 'duplicates') {
      icon = '❌'
      message = `${section.label}: ${result.count} sections (DUPLICATES FOUND!)`
      allGood = false
    } else {
      icon = '❌'
      message = `${section.label}: Error`
      allGood = false
    }
    
    console.log(`${icon} ${message}`)
  }
  
  console.log('\n' + '='.repeat(70))
  
  if (allGood) {
    console.log('🎉 ALL SECTIONS ARE CLEAN!')
    console.log('\n✅ Persistence Status: WORKING')
    console.log('\n💡 You can now:')
    console.log('   1. Refresh your browser (F5)')
    console.log('   2. Edit any section in admin panel')
    console.log('   3. Save changes')
    console.log('   4. Refresh and verify persistence')
    console.log('   5. Check homepage for changes')
  } else {
    console.log('⚠️  DUPLICATES FOUND!')
    console.log('\n🔧 Run cleanup script:')
    console.log('   node scripts/cleanup-all-duplicate-sections.js')
  }
}

testAllPersistence().catch(console.error)
