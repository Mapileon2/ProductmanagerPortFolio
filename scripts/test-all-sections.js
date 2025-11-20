import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllSections() {
  console.log('🧪 COMPREHENSIVE FUNCTIONALITY TEST\n');
  console.log('=' .repeat(60));

  try {
    // Authentication Check
    console.log('\n1️⃣  AUTHENTICATION CHECK');
    console.log('-'.repeat(60));

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated');
      console.log('💡 Please log in first at http://localhost:3000');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id, name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ User profile not found');
      return;
    }

    console.log('✅ Profile found:', profile.name);
    console.log('✅ Org ID:', profile.org_id);

    const orgId = profile.org_id;

    // Test 1: Carousel Images
    console.log('\n2️⃣  CAROUSEL IMAGES');
    console.log('-'.repeat(60));
    const { data: carousel } = await supabase
      .from('carousels')
      .select('carousel_id')
      .eq('org_id', orgId)
      .single();

    if (carousel) {
      const { data: slides, error: slidesError } = await supabase
        .from('carousel_slides')
        .select('*, assets(*)')
        .eq('carousel_id', carousel.carousel_id)
        .eq('is_active', true)
        .order('order_key');

      if (slidesError) {
        console.error('❌ Error fetching slides:', slidesError.message);
      } else {
        console.log(`✅ Found ${slides.length} carousel slides`);
        slides.forEach((slide, i) => {
          console.log(`   ${i + 1}. ${slide.title}`);
        });
      }
    } else {
      console.log('⚠️  No carousel found');
    }

    // Test 2: My Story
    console.log('\n3️⃣  MY STORY SECTION');
    console.log('-'.repeat(60));
    const { data: story, error: storyError } = await supabase
      .from('story_sections')
      .select(`
        *,
        story_paragraphs(*),
        assets(*)
      `)
      .eq('org_id', orgId)
      .single();

    if (storyError) {
      console.log('⚠️  No story found:', storyError.message);
    } else {
      console.log('✅ Story section found');
      console.log(`   Title: ${story.title}`);
      console.log(`   Subtitle: ${story.subtitle}`);
      console.log(`   Paragraphs: ${story.story_paragraphs?.length || 0}`);
    }

    // Test 3: Magic Toolbox
    console.log('\n4️⃣  MAGIC TOOLBOX');
    console.log('-'.repeat(60));
    
    const { data: categories, error: catError } = await supabase
      .from('skill_categories')
      .select(`
        *,
        skills(*)
      `)
      .eq('org_id', orgId)
      .order('order_key');

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message);
    } else {
      console.log(`✅ Found ${categories.length} skill categories`);
      categories.forEach(cat => {
        console.log(`   📦 ${cat.title}`);
        console.log(`      Icon: ${cat.icon || 'none'}`);
        console.log(`      Icon URL: ${cat.icon_url ? 'Yes' : 'No'}`);
        console.log(`      Color: ${cat.color}`);
        console.log(`      Skills: ${cat.skills?.length || 0}`);
        cat.skills?.forEach(skill => {
          console.log(`         - ${skill.name}: ${skill.level}%`);
        });
      });
    }

    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .eq('org_id', orgId)
      .order('order_key');

    if (toolsError) {
      console.error('❌ Error fetching tools:', toolsError.message);
    } else {
      console.log(`✅ Found ${tools.length} tools`);
      tools.forEach(tool => {
        console.log(`   🔧 ${tool.name} ${tool.icon}`);
        console.log(`      Icon URL: ${tool.icon_url ? 'Yes' : 'No'}`);
        console.log(`      Color: ${tool.color}`);
      });
    }

    // Test 4: Journey Timeline
    console.log('\n5️⃣  JOURNEY TIMELINE');
    console.log('-'.repeat(60));
    
    const { data: timeline, error: timelineError } = await supabase
      .from('journey_timelines')
      .select(`
        *,
        journey_milestones(*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (timelineError) {
      console.log('⚠️  No timeline found:', timelineError.message);
    } else if (timeline) {
      console.log('✅ Journey timeline found');
      console.log(`   Title: ${timeline.title}`);
      console.log(`   Subtitle: ${timeline.subtitle || 'none'}`);
      console.log(`   Milestones: ${timeline.journey_milestones?.length || 0}`);
      timeline.journey_milestones?.forEach(milestone => {
        console.log(`   ${milestone.is_current ? '🏆' : '📍'} ${milestone.title} at ${milestone.company}`);
        console.log(`      Period: ${milestone.period}`);
      });
    } else {
      console.log('⚠️  No timeline found');
    }

    // Test 5: Contact Section
    console.log('\n6️⃣  CONTACT SECTION');
    console.log('-'.repeat(60));
    
    const { data: contact, error: contactError } = await supabase
      .from('contact_sections')
      .select(`
        *,
        social_links(*)
      `)
      .eq('org_id', orgId)
      .single();

    if (contactError) {
      console.log('⚠️  No contact section found:', contactError.message);
    } else {
      console.log('✅ Contact section found');
      console.log(`   Title: ${contact.title}`);
      console.log(`   Email: ${contact.email}`);
      console.log(`   Location: ${contact.location}`);
      console.log(`   Social Links: ${contact.social_links?.length || 0}`);
      contact.social_links?.forEach(link => {
        console.log(`      ${link.icon} ${link.name}: ${link.url}`);
      });
    }

    // Test 6: CV Section
    console.log('\n7️⃣  CV SECTION');
    console.log('-'.repeat(60));
    
    const { data: cvSection, error: cvError } = await supabase
      .from('cv_sections')
      .select(`
        *,
        cv_versions(*)
      `)
      .eq('org_id', orgId)
      .single();

    if (cvError) {
      console.log('⚠️  No CV section found:', cvError.message);
    } else {
      console.log('✅ CV section found');
      console.log(`   Title: ${cvSection.title}`);
      console.log(`   Versions: ${cvSection.cv_versions?.length || 0}`);
      cvSection.cv_versions?.forEach(version => {
        console.log(`      ${version.is_active ? '✓' : '○'} ${version.name} (${version.type})`);
        if (version.file_url) console.log(`         File: ${version.file_name}`);
        if (version.google_drive_url) console.log(`         Drive: Yes`);
      });
    }

    // Test 7: Case Studies
    console.log('\n8️⃣  CASE STUDIES');
    console.log('-'.repeat(60));
    
    const { data: caseStudies, error: csError } = await supabase
      .from('case_studies')
      .select('case_study_id, title, status, template')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (csError) {
      console.log('⚠️  Error fetching case studies:', csError.message);
    } else {
      console.log(`✅ Found ${caseStudies.length} case studies`);
      caseStudies.forEach(cs => {
        console.log(`   📄 ${cs.title}`);
        console.log(`      Status: ${cs.status}`);
        console.log(`      Template: ${cs.template}`);
      });
    }

    // Test 8: AI Configuration
    console.log('\n9️⃣  AI CONFIGURATION');
    console.log('-'.repeat(60));
    
    const { data: aiConfig, error: aiError } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (aiError) {
      console.log('⚠️  No AI configuration found');
    } else {
      console.log('✅ AI configuration found');
      console.log(`   Model: ${aiConfig.selected_model}`);
      console.log(`   Configured: ${aiConfig.is_configured ? 'Yes' : 'No'}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const sections = [
      { name: 'Carousel', data: carousel },
      { name: 'My Story', data: story },
      { name: 'Magic Toolbox Categories', data: categories?.length > 0 },
      { name: 'Magic Toolbox Tools', data: tools?.length > 0 },
      { name: 'Journey Timeline', data: timeline },
      { name: 'Contact Section', data: contact },
      { name: 'CV Section', data: cvSection },
      { name: 'Case Studies', data: caseStudies?.length > 0 },
      { name: 'AI Configuration', data: aiConfig }
    ];

    sections.forEach(section => {
      const status = section.data ? '✅' : '⚠️ ';
      console.log(`${status} ${section.name}`);
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Visit http://localhost:3000 to see the homepage');
    console.log('   2. Check that all sections display correctly');
    console.log('   3. Go to Admin Panel to add/edit content');
    console.log('   4. Verify changes persist after page reload');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testAllSections();
