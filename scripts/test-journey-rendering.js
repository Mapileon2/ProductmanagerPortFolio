// Test the journey data rendering specifically
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Journey Data Rendering for youremailgf');
console.log('='.repeat(55));

// Simulate the exact transformJourney function
function transformJourneyItem(dbRow) {
  return {
    id: dbRow.milestone_id,
    title: dbRow.title,
    company: dbRow.company,
    period: dbRow.period,
    description: dbRow.description,
    isActive: dbRow.is_active
  };
}

function transformJourney(dbRow) {
  return {
    id: dbRow.timeline_id,
    title: dbRow.title,
    subtitle: dbRow.subtitle,
    items: dbRow.journey_milestones
      ?.sort((a, b) => a.order_key.localeCompare(b.order_key))
      ?.map(transformJourneyItem) || []
  };
}

async function testJourneyRendering() {
    console.log('\n1️⃣  Getting raw journey data from database...');
    
    const email = process.env.TEST_EMAIL || 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password123';
    await supabase.auth.signInWithPassword({ email, password });

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = profile ? profile.org_id : 'default-org';

    const { data: rawJourney, error: journeyError } = await supabase
        .from('journey_timelines')
        .select(`
            timeline_id,
            title,
            subtitle,
            journey_milestones (
                milestone_id,
                title,
                company,
                period,
                description,
                is_active,
                order_key
            )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (journeyError) {
        console.log('❌ Journey query failed:', journeyError.message);
        return;
    }
    
    console.log('✅ Raw journey data from database:');
    console.log('   Timeline ID:', rawJourney.timeline_id);
    console.log('   Title:', rawJourney.title);
    console.log('   Subtitle:', rawJourney.subtitle);
    console.log('   Raw milestones:', rawJourney.journey_milestones?.length || 0);
    
    if (rawJourney.journey_milestones) {
        rawJourney.journey_milestones.forEach((milestone, index) => {
            console.log(`   ${index + 1}. Raw milestone:`);
            console.log(`      - milestone_id: ${milestone.milestone_id}`);
            console.log(`      - title: ${milestone.title}`);
            console.log(`      - company: ${milestone.company}`);
            console.log(`      - period: ${milestone.period}`);
            console.log(`      - is_active: ${milestone.is_active}`);
            console.log(`      - order_key: ${milestone.order_key}`);
        });
    }
    
    console.log('\n2️⃣  Applying transformation (like API does)...');
    
    const transformedJourney = transformJourney(rawJourney);
    
    console.log('✅ Transformed journey data:');
    console.log('   ID:', transformedJourney.id);
    console.log('   Title:', transformedJourney.title);
    console.log('   Subtitle:', transformedJourney.subtitle);
    console.log('   Items array length:', transformedJourney.items?.length || 0);
    
    if (transformedJourney.items && transformedJourney.items.length > 0) {
        transformedJourney.items.forEach((item, index) => {
            console.log(`   ${index + 1}. Transformed item:`);
            console.log(`      - id: ${item.id}`);
            console.log(`      - title: ${item.title}`);
            console.log(`      - company: ${item.company}`);
            console.log(`      - period: ${item.period}`);
            console.log(`      - description: ${item.description}`);
            console.log(`      - isActive: ${item.isActive}`);
        });
    } else {
        console.log('   🚨 NO ITEMS IN TRANSFORMED DATA!');
    }
    
    console.log('\n3️⃣  Testing what HomePage component would receive...');
    
    // This is what HomePage.tsx expects to render
    const homePageData = {
        myJourney: transformedJourney
    };
    
    console.log('📋 Data structure for HomePage rendering:');
    console.log('   myJourney exists:', !!homePageData.myJourney);
    console.log('   myJourney.title:', homePageData.myJourney?.title);
    console.log('   myJourney.subtitle:', homePageData.myJourney?.subtitle);
    console.log('   myJourney.items exists:', !!homePageData.myJourney?.items);
    console.log('   myJourney.items.length:', homePageData.myJourney?.items?.length || 0);
    
    if (homePageData.myJourney?.items && homePageData.myJourney.items.length > 0) {
        console.log('\n📝 What would render in HomePage:');
        homePageData.myJourney.items.forEach((item, index) => {
            console.log(`   Timeline Item ${index + 1}:`);
            console.log(`   - Title: "${item.title}"`);
            console.log(`   - Company: "${item.company}"`);
            console.log(`   - Period: "${item.period}"`);
            console.log(`   - Active: ${item.isActive} (${item.isActive ? '🏆 Current' : '📍 Past'})`);
            console.log(`   - Description: "${item.description}"`);
        });
        
        console.log('\n✅ JOURNEY DATA IS READY FOR RENDERING!');
        console.log('   The HomePage should show a timeline with these milestones.');
        
    } else {
        console.log('\n❌ NO ITEMS TO RENDER!');
        console.log('   This explains why My Journey section appears blank.');
    }
    
    console.log('\n4️⃣  Browser debugging commands...');
    console.log('Open http://localhost:3002/u/youremailgf and run in console:');
    console.log('');
    console.log('// Check if journey data exists in React state');
    console.log('console.log("Journey data:", document.querySelector("#journey"));');
    console.log('');
    console.log('// Check if timeline items exist in DOM');
    console.log('console.log("Timeline items:", document.querySelectorAll("#journey .space-y-12 > div"));');
    console.log('');
    console.log('// Check for any JavaScript errors');
    console.log('console.log("Check console for red errors");');
    
    console.log('\n' + '='.repeat(55));
    console.log('🎯 CONCLUSION');
    console.log('='.repeat(55));
    
    if (transformedJourney.items && transformedJourney.items.length > 0) {
        console.log('\n✅ BACKEND DATA IS PERFECT');
        console.log('   - Journey timeline exists');
        console.log('   - Milestones are properly transformed');
        console.log('   - Data structure matches HomePage expectations');
        console.log('');
        console.log('🔍 IF MY JOURNEY IS STILL BLANK:');
        console.log('   1. Check browser console for JavaScript errors');
        console.log('   2. Verify React component state is updating');
        console.log('   3. Check if CSS is hiding the content');
        console.log('   4. Inspect DOM elements in browser DevTools');
        
    } else {
        console.log('\n❌ DATA TRANSFORMATION ISSUE');
        console.log('   The milestones are not being transformed correctly');
        console.log('   This explains the blank My Journey section');
    }
}

testJourneyRendering().catch(console.error);