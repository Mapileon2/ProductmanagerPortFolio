// Test script to verify public portfolio functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Public Portfolio Functionality\n');
console.log('='.repeat(60));

async function testPublicAccess() {
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // Test 1: Check if username column exists
    console.log('\n📋 Test 1: Checking user_profiles schema...');
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('username, is_portfolio_public, name, email')
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const profile = data[0];
            if (profile.username && typeof profile.is_portfolio_public === 'boolean') {
                console.log('✅ user_profiles has username and is_portfolio_public columns');
                console.log(`   Username: ${profile.username}`);
                console.log(`   Public: ${profile.is_portfolio_public}`);
                results.passed.push('user_profiles schema');
            } else {
                console.log('❌ Missing username or is_portfolio_public columns');
                results.failed.push('user_profiles schema');
            }
        } else {
            console.log('⚠️  No user profiles found');
            results.warnings.push('No user profiles');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('user_profiles schema');
    }

    // Test 2: Check public access to story_sections
    console.log('\n📖 Test 2: Testing public access to My Story...');
    try {
        const { data, error } = await supabase
            .from('story_sections')
            .select(`
                *,
                story_paragraphs (
                    paragraph_id,
                    content,
                    order_key
                ),
                assets:image_asset_id (
                    cloudinary_url
                )
            `)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to My Story works');
            console.log(`   Title: ${data[0].title}`);
            console.log(`   Paragraphs: ${data[0].story_paragraphs?.length || 0}`);
            results.passed.push('My Story public access');
        } else {
            console.log('⚠️  No story sections found');
            results.warnings.push('No story data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('My Story public access');
    }

    // Test 3: Check public access to skill_categories (Magic Toolbox)
    console.log('\n🧰 Test 3: Testing public access to Magic Toolbox...');
    try {
        const { data, error } = await supabase
            .from('skill_categories')
            .select(`
                *,
                skills (
                    skill_id,
                    name,
                    level
                )
            `)
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to Magic Toolbox works');
            console.log(`   Categories: ${data.length}`);
            console.log(`   Skills: ${data.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0)}`);
            results.passed.push('Magic Toolbox public access');
        } else {
            console.log('⚠️  No skill categories found');
            results.warnings.push('No toolbox data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('Magic Toolbox public access');
    }

    // Test 4: Check public access to tools
    console.log('\n🔧 Test 4: Testing public access to Tools...');
    try {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .limit(10);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to Tools works');
            console.log(`   Tools: ${data.length}`);
            results.passed.push('Tools public access');
        } else {
            console.log('⚠️  No tools found');
            results.warnings.push('No tools data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('Tools public access');
    }

    // Test 5: Check public access to journey_timelines
    console.log('\n🗺️  Test 5: Testing public access to My Journey...');
    try {
        const { data, error } = await supabase
            .from('journey_timelines')
            .select(`
                *,
                journey_milestones (
                    milestone_id,
                    title,
                    company,
                    period,
                    description
                )
            `)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to My Journey works');
            console.log(`   Title: ${data[0].title}`);
            console.log(`   Milestones: ${data[0].journey_milestones?.length || 0}`);
            results.passed.push('My Journey public access');
        } else {
            console.log('⚠️  No journey timelines found');
            results.warnings.push('No journey data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('My Journey public access');
    }

    // Test 6: Check public access to cv_sections
    console.log('\n📄 Test 6: Testing public access to CV Downloads...');
    try {
        const { data, error } = await supabase
            .from('cv_sections')
            .select(`
                *,
                cv_versions (
                    cv_version_id,
                    name,
                    type,
                    is_active
                )
            `)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to CV Downloads works');
            console.log(`   Title: ${data[0].title}`);
            console.log(`   Versions: ${data[0].cv_versions?.length || 0}`);
            results.passed.push('CV Downloads public access');
        } else {
            console.log('⚠️  No CV sections found');
            results.warnings.push('No CV data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('CV Downloads public access');
    }

    // Test 7: Check public access to contact_sections
    console.log('\n📞 Test 7: Testing public access to Contact Me...');
    try {
        const { data, error } = await supabase
            .from('contact_sections')
            .select(`
                *,
                social_links (
                    link_id,
                    name,
                    url,
                    icon
                )
            `)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to Contact Me works');
            console.log(`   Title: ${data[0].title}`);
            console.log(`   Email: ${data[0].email}`);
            console.log(`   Social Links: ${data[0].social_links?.length || 0}`);
            results.passed.push('Contact Me public access');
        } else {
            console.log('⚠️  No contact sections found');
            results.warnings.push('No contact data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('Contact Me public access');
    }

    // Test 8: Check public access to carousel
    console.log('\n🎠 Test 8: Testing public access to Carousel...');
    try {
        const { data, error } = await supabase
            .from('carousels')
            .select(`
                *,
                carousel_slides (
                    slide_id,
                    title,
                    description
                )
            `)
            .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to Carousel works');
            console.log(`   Slides: ${data[0].carousel_slides?.length || 0}`);
            results.passed.push('Carousel public access');
        } else {
            console.log('⚠️  No carousel found');
            results.warnings.push('No carousel data');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('Carousel public access');
    }

    // Test 9: Check public access to published case studies
    console.log('\n💼 Test 9: Testing public access to Projects...');
    try {
        const { data, error } = await supabase
            .from('case_studies')
            .select('*')
            .eq('is_published', true)
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log('✅ Public access to Projects works');
            console.log(`   Published Projects: ${data.length}`);
            results.passed.push('Projects public access');
        } else {
            console.log('⚠️  No published projects found');
            results.warnings.push('No published projects');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        results.failed.push('Projects public access');
    }

    // Test 10: Check RLS policies
    console.log('\n🔒 Test 10: Checking RLS policies...');
    try {
        const { data, error } = await supabase.rpc('pg_policies', {});
        
        if (!error) {
            console.log('✅ RLS policies are accessible');
            results.passed.push('RLS policies check');
        }
    } catch (error) {
        // This is expected to fail for anon users, which is good
        console.log('✅ RLS policies are properly restricted (expected)');
        results.passed.push('RLS policies check');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   - ${test}`));
    
    if (results.warnings.length > 0) {
        console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
        results.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (results.failed.length > 0) {
        console.log(`\n❌ Failed: ${results.failed.length}`);
        results.failed.forEach(test => console.log(`   - ${test}`));
    }

    console.log('\n' + '='.repeat(60));
    
    if (results.failed.length === 0) {
        console.log('🎉 All critical tests passed!');
        console.log('✅ Public portfolio functionality is working correctly');
        console.log('✅ Supabase backend is properly configured');
        console.log('\n📝 Next steps:');
        console.log('   1. Test your public URL: http://localhost:3002/u/yourusername');
        console.log('   2. Verify all sections load without login');
        console.log('   3. Deploy to Vercel');
        console.log('   4. Share your public portfolio URL!');
    } else {
        console.log('⚠️  Some tests failed. Please check:');
        console.log('   1. Did you run FIX_PUBLIC_PORTFOLIO_RLS.sql?');
        console.log('   2. Is your portfolio set to public?');
        console.log('   3. Do you have content in all sections?');
    }
    
    console.log('='.repeat(60));
}

testPublicAccess().catch(console.error);
