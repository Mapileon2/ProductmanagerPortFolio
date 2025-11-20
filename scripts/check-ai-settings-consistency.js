import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 AI Settings Consistency Check\n');
console.log('='.repeat(60));

async function checkAISettings() {
  try {
    // Login first
    const email = process.env.TEST_EMAIL || 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password123';
    await supabase.auth.signInWithPassword({ email, password });

    // 1. Check database schema
    console.log('\n📋 Step 1: Checking database schema...');
    const { data: tables, error: schemaError } = await supabase
      .from('ai_configurations')
      .select('*')
      .limit(0);
    
    if (schemaError) {
      console.error('❌ ai_configurations table not found or inaccessible');
      console.error('   Error:', schemaError.message);
      return;
    }
    console.log('✅ ai_configurations table exists');

    // 2. Check for existing configurations
    console.log('\n📋 Step 2: Checking existing AI configurations...');
    const { data: configs, error: configError } = await supabase
      .from('ai_configurations')
      .select('*');
    
    if (configError) {
      console.error('❌ Error fetching configurations:', configError.message);
      return;
    }

    console.log(`✅ Found ${configs.length} AI configuration(s)`);
    
    if (configs.length > 0) {
      configs.forEach((config, index) => {
        console.log(`\n   Configuration ${index + 1}:`);
        console.log(`   - Config ID: ${config.configuration_id}`);
        console.log(`   - Org ID: ${config.org_id}`);
        console.log(`   - Provider: ${config.provider}`);
        console.log(`   - Selected Model: ${config.selected_model}`);
        console.log(`   - Is Configured: ${config.is_configured}`);
        console.log(`   - API Key Stored: ${config.encrypted_api_key ? 'Yes (***hidden***)' : 'No'}`);
        console.log(`   - API Key Length: ${config.encrypted_api_key?.length || 0} chars`);
        console.log(`   - Last Updated: ${config.updated_at}`);
        console.log(`   - Last Tested: ${config.last_tested_at || 'Never'}`);
      });
    }

    // 3. Check available models
    console.log('\n📋 Step 3: Checking available models in code...');
    const availableModels = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-image',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
    console.log('✅ Available models:', availableModels.join(', '));

    // 4. Validate selected models
    if (configs.length > 0) {
      console.log('\n📋 Step 4: Validating selected models...');
      configs.forEach((config, index) => {
        const isValid = availableModels.includes(config.selected_model);
        if (isValid) {
          console.log(`✅ Configuration ${index + 1}: Model "${config.selected_model}" is valid`);
        } else {
          console.log(`❌ Configuration ${index + 1}: Model "${config.selected_model}" is NOT in available models list`);
        }
      });
    }

    // 5. Check data consistency
    console.log('\n📋 Step 5: Checking data consistency...');
    let inconsistencies = 0;
    
    configs.forEach((config, index) => {
      // Check if is_configured matches API key presence
      const hasApiKey = !!config.encrypted_api_key;
      if (config.is_configured !== hasApiKey) {
        console.log(`⚠️  Configuration ${index + 1}: is_configured (${config.is_configured}) doesn't match API key presence (${hasApiKey})`);
        inconsistencies++;
      }
      
      // Check if selected_model is set
      if (!config.selected_model) {
        console.log(`⚠️  Configuration ${index + 1}: No model selected`);
        inconsistencies++;
      }
      
      // Check if provider is set
      if (!config.provider) {
        console.log(`⚠️  Configuration ${index + 1}: No provider set`);
        inconsistencies++;
      }
    });
    
    if (inconsistencies === 0) {
      console.log('✅ No data inconsistencies found');
    } else {
      console.log(`⚠️  Found ${inconsistencies} inconsistency/inconsistencies`);
    }

    // 6. Check RLS policies
    console.log('\n📋 Step 6: Checking RLS policies...');
    console.log('⚠️  Cannot verify RLS policies (requires admin access)');
    console.log('   Note: Ensure RLS policies are set up for ai_configurations table');

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Database table: EXISTS`);
    console.log(`✅ Configurations found: ${configs.length}`);
    console.log(`✅ Available models: ${availableModels.length}`);
    console.log(`${inconsistencies === 0 ? '✅' : '⚠️ '} Data consistency: ${inconsistencies === 0 ? 'GOOD' : `${inconsistencies} issue(s)`}`);
    
    if (configs.length === 0) {
      console.log('\n💡 TIP: No AI configurations found. Users need to:');
      console.log('   1. Go to Admin Page');
      console.log('   2. Click "AI Settings"');
      console.log('   3. Enter their Gemini API key');
      console.log('   4. Select a model');
      console.log('   5. Test connection');
      console.log('   6. Save settings');
    } else {
      const configuredCount = configs.filter(c => c.is_configured).length;
      console.log(`\n✅ ${configuredCount}/${configs.length} configuration(s) fully configured`);
    }

  } catch (error) {
    console.error('\n❌ Error during consistency check:', error.message);
    console.error(error);
  }
}

checkAISettings();
