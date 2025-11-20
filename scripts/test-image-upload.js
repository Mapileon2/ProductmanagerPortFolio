import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  console.log('📸 Testing Image Upload Pipeline\n');
  
  try {
    // Step 1: Test authentication
    console.log('1️⃣ Testing authentication...');
    const email = process.env.TEST_EMAIL || 'admin@arpanportfolio.com';
    const password = process.env.TEST_PASSWORD || 'ArpanAdmin2024!';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    console.log('✅ Authentication successful');
    
    // Step 2: Test Edge Function - Generate Upload Signature
    console.log('\n2️⃣ Testing upload signature generation...');
    const { data: signatureData, error: signatureError } = await supabase.functions.invoke('generate-upload-signature', {
      body: {
        asset_type: 'image',
        original_filename: 'test-image.jpg',
        file_size: 50000,
        mime_type: 'image/jpeg'
      }
    });
    
    if (signatureError) {
      console.log('❌ Signature generation failed:', signatureError.message);
      console.log('🔧 This suggests Edge Function issues');
      
      // Check if secrets are set
      console.log('\n🔍 Checking Cloudinary configuration...');
      console.log(`VITE_CLOUDINARY_CLOUD_NAME: ${process.env.VITE_CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing'}`);
      console.log(`VITE_CLOUDINARY_API_KEY: ${process.env.VITE_CLOUDINARY_API_KEY ? 'Set' : 'Missing'}`);
      console.log(`VITE_CLOUDINARY_API_SECRET: ${process.env.VITE_CLOUDINARY_API_SECRET ? 'Set' : 'Missing'}`);
      
      return;
    }
    
    console.log('✅ Upload signature generated');
    console.log('📋 Signature data:', JSON.stringify(signatureData, null, 2));
    
    // Step 3: Test Cloudinary direct upload (simulation)
    console.log('\n3️⃣ Testing Cloudinary connectivity...');
    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: new FormData() // Empty form data just to test connectivity
      });
      
      console.log(`✅ Cloudinary API accessible (status: ${response.status})`);
    } catch (err) {
      console.log('❌ Cloudinary connectivity issue:', err.message);
    }
    
    // Get user org_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = profile ? profile.org_id : 'arpan-portfolio';

    // Step 4: Test database access for carousel
    console.log('\n4️⃣ Testing carousel database access...');
    const { data: carousels, error: carouselError } = await supabase
      .from('carousels')
      .select('*')
      .eq('org_id', orgId);
    
    if (carouselError) {
      console.log('❌ Carousel access failed:', carouselError.message);
    } else {
      console.log(`✅ Carousel accessible (${carousels.length} found)`);
      
      if (carousels.length === 0) {
        console.log('🔧 Creating default carousel...');
        const { error: createError } = await supabase
          .from('carousels')
          .insert({
            carousel_id: `default-carousel-${Date.now()}`,
            org_id: orgId,
            name: 'Homepage Carousel'
          });
        
        if (createError) {
          console.log('❌ Failed to create carousel:', createError.message);
        } else {
          console.log('✅ Default carousel created');
        }
      }
    }
    
    // Step 5: Test assets table access
    console.log('\n5️⃣ Testing assets table access...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('org_id', orgId)
      .limit(1);
    
    if (assetsError) {
      console.log('❌ Assets table access failed:', assetsError.message);
    } else {
      console.log('✅ Assets table accessible');
    }
    
    console.log('\n🎯 Diagnosis Complete!');
    console.log('\nIf you see any ❌ errors above, those need to be fixed for image uploads to work.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUpload().catch(console.error);