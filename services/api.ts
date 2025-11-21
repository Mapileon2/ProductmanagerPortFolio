import { createClient } from '@supabase/supabase-js'
import { ulid } from 'ulid'
import type { 
  CaseStudy, CarouselImage, Project, User, MyStorySection, 
  AISettings, MagicToolbox, MyJourney, ContactSection, CVSection,
  GeminiModel, SkillCategory, Tool, JourneyItem, SocialLink, CVVersion
} from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 API Service Environment Check:');
console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseAnonKey:', supabaseAnonKey ? 'Set' : 'Missing');

const isDevelopmentMode = !supabaseUrl || 
                          !supabaseAnonKey || 
                          supabaseUrl.includes('placeholder') || 
                          supabaseUrl.includes('your-project') ||
                          supabaseAnonKey.includes('placeholder') ||
                          supabaseAnonKey.includes('your_supabase') ||
                          supabaseUrl === 'https://placeholder.supabase.co'

console.log('isDevelopmentMode:', isDevelopmentMode);

if (isDevelopmentMode) {
  console.warn('🔧 Development Mode: Using mock data')
  console.warn('To enable full functionality, configure Supabase in .env.local')
  console.warn('See QUICK_START.md for setup instructions')
} else {
  console.log('🚀 Production Mode: Using real Supabase')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Helper function to get user's org_id with error handling
async function getUserOrgId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No authenticated user found')
      return null
    }
    
    console.log('🔍 getUserOrgId: Authenticated user found:', user.id)
    
    // Ensure organization exists for this user
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('org_id')
      .eq('org_id', user.id)
      .single();
    
    if (orgError && orgError.code === 'PGRST116') {
      // Create organization if it doesn't exist
      console.log('🔧 Creating organization for user...');
      const { error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          org_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          slug: `user-${user.id.slice(0, 8)}`
        });
      
      if (createOrgError) {
        console.error('Failed to create organization:', createOrgError);
        // Continue anyway - the user.id is still valid as org_id
      }
    }
    
    return user.id
  } catch (error) {
    console.error('Error in getUserOrgId:', error)
    return null
  }
}

// Mock data for development mode
const mockUser: User = {
  id: 'dev-user-123',
  email: 'developer@example.com',
  name: 'Developer'
}

const mockStory: MyStorySection = {
  id: 'story-1',
  title: 'My Story',
  subtitle: 'Once upon a time...',
  paragraphs: [
    'Welcome to the Portfolio Management System! This is a demo story section.',
    'In development mode, you can explore all the UI components and features.',
    'To enable full functionality, please configure Supabase in your .env.local file.'
  ],
  imageUrl: 'https://picsum.photos/seed/profile/500/600',
  imageAlt: 'Developer Profile'
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<User> {
    if (isDevelopmentMode) {
      console.log('🔧 Development Mode: Mock login successful')
      return mockUser
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || 'User'
    }
  },

  async logout(): Promise<void> {
    if (isDevelopmentMode) {
      console.log('🔧 Development Mode: Mock logout successful')
      return
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async checkAuth(): Promise<User | null> {
    if (isDevelopmentMode) {
      return mockUser
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return {
      id: user.id,
      email: user.email!,
      name: profile?.name || 'User'
    }
  },

  // Asset Management
  async uploadImage(file: File): Promise<{ asset_id: string; url: string }> {
    console.log('🔄 Starting image upload:', file.name, file.size, file.type);
    console.log('🔍 Development mode check:', isDevelopmentMode);
    
    if (isDevelopmentMode) {
      console.log('⚠️  In development mode - this should not happen for real uploads');
      throw new Error('Development mode detected - real uploads not available');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Current user:', user ? user.email : 'Not authenticated');
    if (authError) {
      console.error('❌ Auth check failed:', authError);
    }
    
    const { data: uploadData, error } = await supabase.functions.invoke('generate-upload-signature', {
      body: {
        asset_type: 'image',
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type
      }
    })
    
    if (error) {
      console.error('❌ Upload signature failed:', error);
      throw error;
    }
    
    console.log('✅ Upload signature generated:', uploadData.asset_id);
    
    // Upload to Cloudinary
    const formData = new FormData()
    
    console.log('🔄 Uploading to Cloudinary:', uploadData.upload_url);
    console.log('📋 Upload parameters:', uploadData.upload_params);
    
    // Debug: Log what's being sent to Cloudinary
    console.log('📋 FormData contents:');
    Object.entries(uploadData.upload_params).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
      formData.append(key, value as string);
    });
    formData.append('file', file);
    console.log('  file: [File object]');
    
    const uploadResponse = await fetch(uploadData.upload_url, {
      method: 'POST',
      body: formData
    })
    
    console.log('📊 Cloudinary response status:', uploadResponse.status);
    
    const uploadResult = await uploadResponse.json()
    if (!uploadResponse.ok) {
      console.error('❌ Cloudinary upload failed:', uploadResult);
      throw new Error(uploadResult.error?.message || 'Upload failed');
    }
    
    console.log('✅ Cloudinary upload successful:', uploadResult.public_id);
    
    // Finalize upload
    console.log('🔄 Finalizing upload...');
    const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-upload', {
      body: {
        asset_id: uploadData.asset_id,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height
      }
    })
    
    if (finalizeError) throw finalizeError
    
    return {
      asset_id: uploadData.asset_id,
      url: finalizeData.asset.cloudinary_url
    }
  },

  async uploadDocument(file: File): Promise<{ asset_id: string; url: string }> {
    console.log('🔄 Starting document upload:', file.name, file.size, file.type);
    console.log('🔍 Development mode check:', isDevelopmentMode);
    
    if (isDevelopmentMode) {
      console.log('⚠️  In development mode - this should not happen for real uploads');
      throw new Error('Development mode detected - real uploads not available. Please configure Supabase in .env.local');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Current user:', user ? user.email : 'Not authenticated');
    if (authError) {
      console.error('❌ Auth check failed:', authError);
    }
    
    const { data: uploadData, error } = await supabase.functions.invoke('generate-upload-signature', {
      body: {
        asset_type: 'document',
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type
      }
    })
    
    console.log('📋 Upload signature response:', uploadData ? 'Success' : 'Failed');
    if (error) {
      console.error('❌ Upload signature error:', error);
      throw error
    }
    
    // Upload to Cloudinary
    const formData = new FormData()
    console.log('🔄 Uploading to Cloudinary:', uploadData.upload_url);
    Object.entries(uploadData.upload_params).forEach(([key, value]) => {
      formData.append(key, value as string)
    })
    formData.append('file', file)
    
    const uploadResponse = await fetch(uploadData.upload_url, {
      method: 'POST',
      body: formData
    })
    
    console.log('📊 Cloudinary response status:', uploadResponse.status);
    const uploadResult = await uploadResponse.json()
    
    if (!uploadResponse.ok) {
      console.error('❌ Cloudinary upload failed:', uploadResult);
      throw new Error(uploadResult.error?.message || 'Upload failed')
    }
    
    console.log('✅ Cloudinary upload successful:', uploadResult.public_id);
    
    // Finalize upload
    console.log('🔄 Finalizing upload...');
    const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-upload', {
      body: {
        asset_id: uploadData.asset_id,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_url: uploadResult.secure_url
      }
    })
    
    if (finalizeError) {
      console.error('❌ Finalize upload error:', finalizeError);
      throw finalizeError
    }
    
    console.log('✅ Upload finalized successfully');
    
    return {
      asset_id: uploadData.asset_id,
      url: finalizeData.asset.cloudinary_url
    }
  },

  // Case Studies
  async getCaseStudies(): Promise<CaseStudy[]> {
    console.log('🔍 getCaseStudies called - fetching lightweight data for list');
    
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        case_study_sections!inner (
          section_id,
          section_type,
          enabled,
          content
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching case studies:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} case studies`);
    return data.map(transformCaseStudy)
  },

  async getCaseStudyById(id: string): Promise<CaseStudy> {
    console.log('🔍 getCaseStudyById called for:', id);
    
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        assets!case_studies_hero_image_asset_id_fkey (cloudinary_url),
        case_study_sections (
          *,
          section_assets (
            *,
            assets (*)
          ),
          embed_widgets (*)
        )
      `)
      .eq('case_study_id', id)
      .single()
    
    if (error) {
      console.error('❌ Error fetching case study:', error);
      throw error;
    }
    
    console.log('✅ Case study fetched, sections:', data.case_study_sections?.length || 0);
    const transformed = transformCaseStudy(data);
    console.log('📦 Transformed sections:', Object.keys(transformed.sections));
    
    return transformed;
  },

  async createCaseStudy(title: string, template: 'default' | 'ghibli' | 'modern'): Promise<CaseStudy> {
    const case_study_id = ulid()
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Get user's org_id
    const orgId = await getUserOrgId()
    if (!orgId) {
      throw new Error('User profile not found. Please set up your profile first.')
    }
    
    const { data, error } = await supabase
      .from('case_studies')
      .insert({
        case_study_id,
        org_id: orgId,
        title,
        slug,
        template,
        status: 'draft',
        is_published: false
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Create default sections
    const defaultSections = createDefaultSections(case_study_id)
    await supabase.from('case_study_sections').insert(defaultSections)
    
    return transformCaseStudy({ ...data, case_study_sections: defaultSections })
  },

  async updateCaseStudy(caseStudy: CaseStudy): Promise<CaseStudy> {
    console.log('🔄 updateCaseStudy called for:', caseStudy.id);
    console.log('📝 Sections to save:', Object.keys(caseStudy.sections));
    
    // Find asset_id for hero image if it exists
    let heroImageAssetId = null
    if (caseStudy.sections.hero.imageUrl) {
      const { data: asset } = await supabase
        .from('assets')
        .select('asset_id')
        .eq('cloudinary_url', caseStudy.sections.hero.imageUrl)
        .single()
      
      heroImageAssetId = asset?.asset_id || null
    }
    
    // Update main case study
    console.log('💾 Updating main case study record...');
    const { error: updateError } = await supabase
      .from('case_studies')
      .update({
        title: caseStudy.title,
        template: caseStudy.template,
        content_html: caseStudy.content,
        hero_image_asset_id: heroImageAssetId,
        is_published: caseStudy.is_published ?? false,
        published_at: caseStudy.published_at,
        updated_at: new Date().toISOString()
      })
      .eq('case_study_id', caseStudy.id)
    
    if (updateError) {
      console.error('❌ Error updating case study:', updateError);
      throw updateError;
    }
    console.log('✅ Main case study updated');
    
    // Update sections
    console.log('💾 Updating sections...');
    
    // Define section order
    const sectionOrder = ['hero', 'overview', 'problem', 'process', 'showcase', 'gallery', 'video', 'figma', 'miro', 'document', 'links', 'reflection'];
    
    for (const [sectionType, sectionData] of Object.entries(caseStudy.sections)) {
      console.log(`   Saving ${sectionType}:`, {
        enabled: sectionData.enabled,
        hasContent: JSON.stringify(sectionData).length > 50
      });
      
      // Check if section already exists
      const { data: existingSection } = await supabase
        .from('case_study_sections')
        .select('section_id, order_key')
        .eq('case_study_id', caseStudy.id)
        .eq('section_type', sectionType)
        .single();
      
      // Get order index (1-based)
      const orderIndex = sectionOrder.indexOf(sectionType);
      const orderKey = orderIndex >= 0 ? (orderIndex + 1).toString().padStart(6, '0') : '999999';
      
      const { error: sectionError } = await supabase
        .from('case_study_sections')
        .upsert({
          section_id: existingSection?.section_id || ulid(), // Use existing ID or generate new one
          case_study_id: caseStudy.id,
          section_type: sectionType,
          enabled: sectionData.enabled,
          content: JSON.stringify(sectionData),
          order_key: existingSection?.order_key || orderKey, // Use existing order or assign new
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'case_study_id,section_type'
        })
      
      if (sectionError) {
        console.error(`❌ Error saving ${sectionType} section:`, sectionError);
        throw sectionError;
      }
      console.log(`   ✅ ${sectionType} saved`);
    }
    
    console.log('✅ All sections saved successfully');
    return caseStudy
  },

  async deleteCaseStudy(id: string): Promise<void> {
    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('case_study_id', id)
    
    if (error) throw error
  },

  // Projects (derived from case studies)
  async getProjects(): Promise<Project[]> {
    const demoProjects = [
      {
        id: 'proj1',
        title: 'Demo Project 1',
        description: 'A sample project showcasing the portfolio system capabilities.',
        imageUrl: 'https://picsum.photos/seed/proj1/400/300',
        tags: ['React', 'TypeScript', 'Supabase'],
        caseStudyId: 'cs-1'
      },
      {
        id: 'proj2',
        title: 'Demo Project 2',
        description: 'Another example project with different technologies.',
        imageUrl: 'https://picsum.photos/seed/proj2/400/300',
        tags: ['Next.js', 'Tailwind', 'AI'],
        caseStudyId: 'cs-2'
      },
      {
        id: 'proj3',
        title: 'Demo Project 3',
        description: 'Innovative solutions with cutting-edge technology.',
        imageUrl: 'https://picsum.photos/seed/proj3/400/300',
        tags: ['Vue.js', 'Node.js', 'MongoDB'],
        caseStudyId: 'cs-3'
      }
    ];
    
    if (isDevelopmentMode) {
      return demoProjects;
    }
    
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        case_study_id,
        title,
        hero_image_asset_id,
        is_published,
        assets!case_studies_hero_image_asset_id_fkey (cloudinary_url),
        case_study_sections!inner (content)
      `)
      .eq('is_published', true)
      .eq('case_study_sections.section_type', 'hero')
    
    if (error) {
      console.error('Error fetching projects:', error);
      return []; // Return empty array on error
    }
    
    // If no published case studies, return empty array
    if (!data || data.length === 0) {
      console.log('⚠️  No published case studies found');
      return [];
    }
    
    return data.map(item => ({
      id: item.case_study_id,
      title: item.title,
      description: extractDescription(item.case_study_sections[0]?.content),
      imageUrl: (item.assets as any)?.cloudinary_url || 'https://picsum.photos/400/300',
      tags: extractTags(item.case_study_sections[0]?.content),
      caseStudyId: item.case_study_id
    }))
  },

  // Carousel Management
  async getCarouselImages(): Promise<CarouselImage[]> {
    if (isDevelopmentMode) {
      return [
        {
          id: 'img1',
          src: 'https://picsum.photos/seed/carousel1/1024/500',
          title: 'Welcome to Your Portfolio',
          description: 'This is a demo carousel showcasing the beautiful image management system.'
        },
        {
          id: 'img2',
          src: 'https://picsum.photos/seed/carousel2/1024/500',
          title: 'Powerful Content Management',
          description: 'Manage all your content with an intuitive admin interface.'
        },
        {
          id: 'img3',
          src: 'https://picsum.photos/seed/carousel3/1024/500',
          title: 'AI-Enhanced Writing',
          description: 'Let AI help you craft compelling content for your portfolio.'
        }
      ]
    }
    
    const { data, error } = await supabase
      .from('carousel_slides')
      .select(`
        *,
        assets (*)
      `)
      .eq('is_active', true)
      .order('order_key')
    
    if (error) throw error
    return data.map(transformCarouselSlide)
  },

  async createCarouselImage(imageData: Omit<CarouselImage, 'id'> & { asset_id?: string }): Promise<CarouselImage> {
    const slide_id = ulid()
    
    // Get user's org and carousel
    const orgId = await getUserOrgId()
    if (!orgId) {
      throw new Error('User profile not found. Please set up your profile first.')
    }
    
    let { data: carousel } = await supabase
      .from('carousels')
      .select('carousel_id')
      .eq('org_id', orgId)
      .single()
    
    if (!carousel) {
      // Create default carousel
      const carousel_id = ulid()
      await supabase.from('carousels').insert({
        carousel_id,
        org_id: orgId,
        name: 'Homepage Carousel'
      })
      carousel = { carousel_id }
    }
    
    // Use provided asset_id or upload image
    let asset_id = imageData.asset_id
    if (!asset_id) {
      const imageFile = await fetch(imageData.src).then(r => r.blob())
      const uploadResult = await this.uploadImage(imageFile as File)
      asset_id = uploadResult.asset_id
    }
    
    // Get next order key
    const { count } = await supabase
      .from('carousel_slides')
      .select('*', { count: 'exact', head: true })
      .eq('carousel_id', carousel.carousel_id)
    
    const { data, error } = await supabase
      .from('carousel_slides')
      .insert({
        slide_id,
        carousel_id: carousel.carousel_id,
        asset_id,
        title: imageData.title,
        description: imageData.description,
        order_key: ((count || 0) + 1).toString().padStart(6, '0')
      })
      .select(`
        *,
        assets (*)
      `)
      .single()
    
    if (error) throw error
    return transformCarouselSlide(data)
  },

  async updateCarouselImage(id: string, updates: Partial<CarouselImage>): Promise<CarouselImage> {
    const { data, error } = await supabase
      .from('carousel_slides')
      .update({
        title: updates.title,
        description: updates.description,
        updated_at: new Date().toISOString()
      })
      .eq('slide_id', id)
      .select(`
        *,
        assets (*)
      `)
      .single()
    
    if (error) throw error
    return transformCarouselSlide(data)
  },

  async deleteCarouselImage(id: string): Promise<void> {
    const { error } = await supabase
      .from('carousel_slides')
      .delete()
      .eq('slide_id', id)
    
    if (error) throw error
  },

  async reorderCarouselImages(imageIds: string[]): Promise<void> {
    const { error } = await supabase.functions.invoke('bulk-operations', {
      body: {
        operation: 'reorder',
        resource_type: 'carousel_slides',
        items: imageIds.map((id, index) => ({
          id,
          order_key: (index + 1).toString().padStart(6, '0')
        }))
      }
    })
    
    if (error) throw error
  },

  // My Story Management
  async getMyStory(): Promise<MyStorySection> {
    if (isDevelopmentMode) {
      return mockStory
    }
    
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning default story');
      return this.createDefaultStory()
    }
    
    const { data, error } = await supabase
      .from('story_sections')
      .select(`
        *,
        story_paragraphs (*),
        assets (*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // Create default story if none exists
      return this.createDefaultStory()
    }
    
    return transformStorySection(data)
  },

  async updateMyStory(story: MyStorySection): Promise<MyStorySection> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, cannot update story');
      throw new Error('User profile not found. Please set up your profile first.')
    }
    
    // Find asset_id for image URL if it exists
    let imageAssetId = null
    if (story.imageUrl) {
      const { data: asset } = await supabase
        .from('assets')
        .select('asset_id')
        .eq('cloudinary_url', story.imageUrl)
        .single()
      
      imageAssetId = asset?.asset_id || null
    }
    
    // Update main story section
    const { error: storyError } = await supabase
      .from('story_sections')
      .upsert({
        story_id: story.id,
        org_id: orgId,
        title: story.title,
        subtitle: story.subtitle,
        image_asset_id: imageAssetId,
        image_alt: story.imageAlt,
        updated_at: new Date().toISOString()
      })
    
    if (storyError) throw storyError
    
    // Update paragraphs
    await supabase
      .from('story_paragraphs')
      .delete()
      .eq('story_id', story.id)
    
    const paragraphInserts = story.paragraphs.map((content, index) => ({
      paragraph_id: ulid(),
      story_id: story.id,
      content,
      order_key: (index + 1).toString().padStart(6, '0')
    }))
    
    await supabase
      .from('story_paragraphs')
      .insert(paragraphInserts)
    
    return story
  },

  async createDefaultStory(): Promise<MyStorySection> {
    const orgId = await getUserOrgId()
    
    // If no org_id, return mock data without database insert
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning mock story without database insert');
      return mockStory
    }
    
    const story_id = ulid()
    
    const { error } = await supabase
      .from('story_sections')
      .insert({
        story_id,
        org_id: orgId,
        title: 'My Story',
        subtitle: 'Once upon a time...'
      })
    
    if (error) {
      console.error('Error creating story section:', error)
      return mockStory
    }
    
    const defaultParagraphs = [
      'In the ever-shifting landscape of business, a Management Consultant set forth on a mission: to turn complexity into clarity, data into direction, and strategy into success.',
      'Armed with strategic problem-solving, data analysis, and actionable insights, I navigate the intricate pathways of decision-making, helping leaders and organizations find their way through uncertainty.',
      'Each project is a new chapter, each challenge a new adventure. Let\'s embark on this journey together—where data meets strategy, and insights lead to success.'
    ]
    
    const paragraphInserts = defaultParagraphs.map((content, index) => ({
      paragraph_id: ulid(),
      story_id,
      content,
      order_key: (index + 1).toString().padStart(6, '0')
    }))
    
    await supabase
      .from('story_paragraphs')
      .insert(paragraphInserts)
    
    return {
      id: story_id,
      title: 'My Story',
      subtitle: 'Once upon a time...',
      paragraphs: defaultParagraphs,
      imageUrl: 'https://picsum.photos/seed/profile/500/600',
      imageAlt: 'Profile'
    }
  },

  // AI Settings
  async getAISettings(): Promise<AISettings> {
    if (isDevelopmentMode) {
      return {
        id: 'dev-ai-settings',
        apiKey: '',
        selectedModel: 'gemini-2.0-flash-exp',
        isConfigured: false,
        lastUpdated: new Date().toISOString()
      }
    }
    
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning default AI settings');
      return {
        id: ulid(),
        apiKey: '',
        selectedModel: 'gemini-2.0-flash-exp',
        isConfigured: false,
        lastUpdated: new Date().toISOString()
      }
    }
    
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('org_id', orgId)
      .single()
    
    if (error) {
      // Return default settings if none exist
      return {
        id: ulid(),
        apiKey: '',
        selectedModel: 'gemini-2.0-flash-exp',
        isConfigured: false,
        lastUpdated: new Date().toISOString()
      }
    }
    
    return {
      id: data.config_id,
      apiKey: '***hidden***', // Never return actual key
      selectedModel: data.selected_model,
      isConfigured: data.is_configured,
      lastUpdated: data.updated_at
    }
  },

  async updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, cannot update AI settings');
      throw new Error('User profile not found. Please set up your profile first.')
    }
    
    const config_id = settings.id || ulid()
    
    // If API key is not provided, fetch existing config to preserve it
    if (!settings.apiKey && settings.id) {
      const { data: existing } = await supabase
        .from('ai_configurations')
        .select('encrypted_api_key, is_configured')
        .eq('config_id', settings.id)
        .single()
      
      // Update only the model, keep existing API key
      const { data, error } = await supabase
        .from('ai_configurations')
        .update({
          selected_model: settings.selectedModel,
          updated_at: new Date().toISOString()
        })
        .eq('config_id', settings.id)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: data.config_id,
        apiKey: '***hidden***',
        selectedModel: data.selected_model,
        isConfigured: data.is_configured,
        lastUpdated: data.updated_at
      }
    }
    
    // Full update with new API key
    // IMPORTANT: Trim whitespace from API key
    const trimmedApiKey = settings.apiKey?.trim()
    
    const { data, error } = await supabase
      .from('ai_configurations')
      .upsert({
        config_id,
        org_id: orgId,
        encrypted_api_key: trimmedApiKey, // In production, encrypt this
        selected_model: settings.selectedModel,
        is_configured: !!trimmedApiKey,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.config_id,
      apiKey: '***hidden***',
      selectedModel: data.selected_model,
      isConfigured: data.is_configured,
      lastUpdated: data.updated_at
    }
  },

  async getAvailableModels(): Promise<GeminiModel[]> {
    return [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Most powerful model with advanced reasoning. Solves complex problems, conducts deep research, codes, and analyzes large documents (up to 1M tokens).',
        maxTokens: 1000000,
        isRecommended: true
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Optimized for speed and cost efficiency. Suitable for high-volume tasks, low latency applications, daily tasks, brainstorming, and writing.',
        maxTokens: 1000000
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        description: 'Fastest and most cost-effective model. Improved quality over 1.5 series. Critical for speed and affordability in high-volume experiences.',
        maxTokens: 1000000
      },
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        description: 'Specialized model supporting image and text inputs/outputs. For image generation, analysis, and editing tasks.',
        maxTokens: 1000000
      },
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Experimental model with enhanced capabilities',
        maxTokens: 1000000
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Previous generation advanced model with superior reasoning',
        maxTokens: 2000000
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Previous generation fast model for quick responses',
        maxTokens: 1000000
      }
    ]
  },

  // AI Content Enhancement
  async enhanceContent(prompt: string, existingText?: string, tone?: string, customInstruction?: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-enhance-content', {
      body: {
        prompt,
        existing_text: existingText,
        tone,
        custom_instruction: customInstruction
      }
    })
    
    if (error) {
      console.error('Edge function error:', error);
      
      // Try to extract error message from the response
      let errorMessage = 'Failed to connect to AI service.';
      
      // Check if error has a message
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Check if data contains error details (from Edge Function)
      if (data && typeof data === 'object' && 'error' in data) {
        errorMessage = (data as any).error;
      }
      
      // Provide helpful context based on error type
      if (errorMessage.includes('API key not valid') || errorMessage.includes('Invalid API key')) {
        throw new Error('Invalid API key. Please update your Gemini API key in AI Settings.');
      } else if (errorMessage.includes('quota')) {
        throw new Error('API quota exceeded. Please wait or upgrade your Gemini API plan.');
      } else if (errorMessage.includes('not configured')) {
        throw new Error('AI not configured. Please set up your Gemini API key in AI Settings.');
      } else if (errorMessage.includes('Unauthorized')) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
    if (!data || !data.generated_text) {
      throw new Error('AI service returned empty response. Please try again.');
    }
    
    return data.generated_text;
  },

  // Magic Toolbox
  async getMagicToolbox(): Promise<MagicToolbox> {
    if (isDevelopmentMode) {
      return {
        id: 'dev-toolbox',
        title: 'My Magic Toolbox',
        subtitle: 'The enchanted tools and skills I wield',
        categories: [
          {
            id: 'cat1',
            title: 'Frontend Development',
            icon: '⚛️',
            color: 'blue',
            skills: [
              { id: 'skill1', name: 'React', level: 90 },
              { id: 'skill2', name: 'TypeScript', level: 85 },
              { id: 'skill3', name: 'Tailwind CSS', level: 80 }
            ]
          },
          {
            id: 'cat2',
            title: 'Backend Development',
            icon: '🚀',
            color: 'green',
            skills: [
              { id: 'skill4', name: 'Node.js', level: 85 },
              { id: 'skill5', name: 'PostgreSQL', level: 80 },
              { id: 'skill6', name: 'Supabase', level: 75 }
            ]
          }
        ],
        tools: [
          { id: 'tool1', name: 'VS Code', icon: '💻', color: 'blue' },
          { id: 'tool2', name: 'Figma', icon: '🎨', color: 'purple' },
          { id: 'tool3', name: 'Git', icon: '📝', color: 'orange' }
        ]
      }
    }
    
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning default toolbox');
      // Return the mock data structure
      return {
        id: 'dev-toolbox',
        title: 'My Magic Toolbox',
        subtitle: 'The enchanted tools and skills I wield',
        categories: [
          {
            id: 'cat1',
            title: 'Frontend Development',
            icon: '⚛️',
            color: 'blue',
            skills: [
              { id: 'skill1', name: 'React', level: 90 },
              { id: 'skill2', name: 'TypeScript', level: 85 },
              { id: 'skill3', name: 'Tailwind CSS', level: 80 }
            ]
          }
        ],
        tools: [
          { id: 'tool1', name: 'VS Code', icon: '💻', color: 'blue' }
        ]
      }
    }
    
    const [categoriesResult, toolsResult] = await Promise.all([
      supabase
        .from('skill_categories')
        .select(`
          *,
          skills (*)
        `)
        .eq('org_id', orgId)
        .order('order_key'),
      
      supabase
        .from('tools')
        .select('*')
        .eq('org_id', orgId)
        .order('order_key')
    ])
    
    if (categoriesResult.error) throw categoriesResult.error
    if (toolsResult.error) throw toolsResult.error
    
    return {
      id: ulid(),
      title: 'My Magic Toolbox',
      subtitle: 'The enchanted tools and skills I wield',
      categories: categoriesResult.data.map(transformSkillCategory),
      tools: toolsResult.data.map(transformTool)
    }
  },

  async updateMagicToolbox(toolbox: MagicToolbox): Promise<MagicToolbox> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      throw new Error('User profile not found. Please set up your profile first.')
    }

    // Delete existing categories and tools
    await Promise.all([
      supabase.from('skill_categories').delete().eq('org_id', orgId),
      supabase.from('tools').delete().eq('org_id', orgId)
    ])

    // Insert categories
    if (toolbox.categories.length > 0) {
      const categoryInserts = toolbox.categories.map((category, index) => ({
        category_id: category.id,
        org_id: orgId,
        title: category.title,
        icon: category.icon,
        icon_url: category.iconUrl,
        color: category.color,
        order_key: (index + 1).toString().padStart(6, '0')
      }))

      const { error: catError } = await supabase
        .from('skill_categories')
        .insert(categoryInserts)

      if (catError) throw catError

      // Insert skills for each category
      for (const category of toolbox.categories) {
        if (category.skills.length > 0) {
          const skillInserts = category.skills.map((skill, index) => ({
            skill_id: skill.id,
            category_id: category.id,
            name: skill.name,
            level: skill.level,
            order_key: (index + 1).toString().padStart(6, '0')
          }))

          const { error: skillError } = await supabase
            .from('skills')
            .insert(skillInserts)

          if (skillError) throw skillError
        }
      }
    }

    // Insert tools
    if (toolbox.tools.length > 0) {
      const toolInserts = toolbox.tools.map((tool, index) => ({
        tool_id: tool.id,
        org_id: orgId,
        name: tool.name,
        icon: tool.icon,
        icon_url: tool.iconUrl,
        color: tool.color,
        order_key: (index + 1).toString().padStart(6, '0')
      }))

      const { error: toolError } = await supabase
        .from('tools')
        .insert(toolInserts)

      if (toolError) throw toolError
    }

    return toolbox
  },

  // Journey Management
  async getMyJourney(): Promise<MyJourney> {
    if (isDevelopmentMode) {
      return {
        id: 'dev-journey',
        title: 'My Journey',
        subtitle: 'A timeline of my professional growth',
        items: [
          {
            id: 'milestone1',
            title: 'Senior Developer',
            company: 'Tech Company',
            period: '2023 - Present',
            description: 'Leading development of innovative web applications.',
            isActive: true
          },
          {
            id: 'milestone2',
            title: 'Full Stack Developer',
            company: 'Startup Inc',
            period: '2021 - 2023',
            description: 'Built scalable applications from ground up.',
            isActive: false
          }
        ]
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      // Return default journey if profile doesn't exist
      return this.createDefaultJourney()
    }
    
    const { data: timeline, error: timelineError } = await supabase
      .from('journey_timelines')
      .select(`
        *,
        journey_milestones (*)
      `)
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (timelineError) {
      console.error('Timeline error:', timelineError)
      return this.createDefaultJourney()
    }
    
    if (!timeline) {
      return this.createDefaultJourney()
    }
    
    return transformJourney(timeline)
  },

  async updateMyJourney(journey: MyJourney): Promise<MyJourney> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      throw new Error('User profile not found. Please set up your profile first.')
    }

    // Get or create timeline (get most recent if multiple exist)
    let { data: timeline } = await supabase
      .from('journey_timelines')
      .select('timeline_id')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!timeline) {
      // Create timeline
      const timeline_id = ulid()
      const { error: timelineError } = await supabase
        .from('journey_timelines')
        .insert({
          timeline_id,
          org_id: orgId,
          title: journey.title,
          subtitle: journey.subtitle
        })

      if (timelineError) throw timelineError
      timeline = { timeline_id }
    } else {
      // Update timeline
      await supabase
        .from('journey_timelines')
        .update({
          title: journey.title,
          subtitle: journey.subtitle,
          updated_at: new Date().toISOString()
        })
        .eq('timeline_id', timeline.timeline_id)
    }

    // Delete existing milestones
    await supabase
      .from('journey_milestones')
      .delete()
      .eq('timeline_id', timeline.timeline_id)

    // Insert new milestones
    if (journey.items && journey.items.length > 0) {
      const milestoneInserts = journey.items.map((item, index) => ({
        milestone_id: item.id.startsWith('milestone') ? ulid() : item.id,
        timeline_id: timeline.timeline_id,
        title: item.title,
        company: item.company,
        period: item.period,
        description: item.description,
        is_active: item.isActive,  // Fixed: is_active not is_current
        order_key: (index + 1).toString().padStart(6, '0')
      }))

      const { error: insertError } = await supabase
        .from('journey_milestones')
        .insert(milestoneInserts)

      if (insertError) throw insertError
    }

    return journey
  },

  async createDefaultJourney(): Promise<MyJourney> {
    // Implementation for creating default journey
    return {
      id: ulid(),
      title: 'My Journey',
      subtitle: 'A timeline of my professional growth',
      items: []
    }
  },

  // Contact Section
  async getContactSection(): Promise<ContactSection> {
    if (isDevelopmentMode) {
      return {
        id: 'dev-contact',
        title: 'Contact Me',
        subtitle: 'Let\'s connect and create something amazing together',
        description: 'Ready to bring your ideas to life? Let\'s chat about your next project!',
        email: 'hello@example.com',
        location: 'Remote',
        socialLinks: [
          { id: 'link1', name: 'LinkedIn', url: 'https://linkedin.com', icon: '💼', color: 'blue' },
          { id: 'link2', name: 'GitHub', url: 'https://github.com', icon: '🐙', color: 'gray' },
          { id: 'link3', name: 'Twitter', url: 'https://twitter.com', icon: '🐦', color: 'blue' }
        ],
        resumeUrl: '',
        resumeButtonText: 'Download Resume'
      }
    }
    
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning default contact');
      return this.createDefaultContact()
    }
    
    const { data } = await supabase
      .from('contact_sections')
      .select(`
        *,
        social_links (*),
        assets (cloudinary_url)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!data) {
      return this.createDefaultContact()
    }
    
    return transformContactSection(data)
  },

  async updateContactSection(contact: ContactSection): Promise<ContactSection> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      throw new Error('User profile not found. Please set up your profile first.')
    }

    // Find asset_id for the resume URL if it exists
    let resumeAssetId = null
    if (contact.resumeUrl) {
      const { data: asset } = await supabase
        .from('assets')
        .select('asset_id')
        .eq('cloudinary_url', contact.resumeUrl)
        .single()
      
      resumeAssetId = asset?.asset_id || null
    }

    // Update or insert contact section
    const { error: contactError } = await supabase
      .from('contact_sections')
      .upsert({
        contact_id: contact.id,
        org_id: orgId,
        title: contact.title,
        subtitle: contact.subtitle,
        description: contact.description,
        email: contact.email,
        location: contact.location,
        resume_asset_id: resumeAssetId,
        resume_button_text: contact.resumeButtonText,
        updated_at: new Date().toISOString()
      })

    if (contactError) throw contactError

    // Delete existing social links
    await supabase
      .from('social_links')
      .delete()
      .eq('contact_id', contact.id)

    // Insert new social links
    if (contact.socialLinks.length > 0) {
      const linkInserts = contact.socialLinks.map((link, index) => ({
        link_id: link.id,
        contact_id: contact.id,
        name: link.name,
        url: link.url,
        icon: link.icon,
        color: link.color,
        order_key: (index + 1).toString().padStart(6, '0')
      }))

      const { error: linksError } = await supabase
        .from('social_links')
        .insert(linkInserts)

      if (linksError) throw linksError
    }

    return contact
  },

  async createDefaultContact(): Promise<ContactSection> {
    // Implementation for creating default contact
    return {
      id: ulid(),
      title: 'Contact Me',
      subtitle: 'Let\'s connect and create something amazing together',
      description: 'Ready to bring your ideas to life? Let\'s chat!',
      email: 'hello@example.com',
      location: 'Remote',
      socialLinks: [],
      resumeUrl: '',
      resumeButtonText: 'Download Resume'
    }
  },

  // CV Section
  async getCVSection(): Promise<CVSection> {
    console.log('🔍 getCVSection called, isDevelopmentMode:', isDevelopmentMode);
    
    if (isDevelopmentMode) {
      return {
        id: 'dev-cv',
        title: 'Download CV',
        subtitle: 'Choose your preferred format',
        description: 'Available in multiple formats tailored for different regions and opportunities.',
        versions: [
          {
            id: 'cv1',
            name: 'Indian CV',
            type: 'indian',
            isActive: true
          },
          {
            id: 'cv2',
            name: 'Europass CV',
            type: 'europass',
            isActive: true
          },
          {
            id: 'cv3',
            name: 'Global CV',
            type: 'global',
            isActive: true
          }
        ]
      }
    }
    
    console.log('🔍 Getting user org_id...');
    const orgId = await getUserOrgId()
    
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning default CV section');
      return this.createDefaultCVSection()
    }
    
    console.log('🔍 User profile org_id:', orgId);
    
    console.log('🔍 Querying CV sections...');
    const { data, error } = await supabase
      .from('cv_sections')
      .select(`
        *,
        cv_versions!cv_versions_cv_section_id_fkey (
          *,
          assets (*)
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ CV section query error:', error);
      return this.createDefaultCVSection()
    }
    
    console.log('✅ CV section data retrieved:', data);
    
    if (!data) {
      console.log('⚠️  No CV section found, creating default...');
      return this.createDefaultCVSection()
    }
    
    console.log('🔄 Transforming CV section data...');
    const transformed = transformCVSection(data);
    console.log('✅ Transformed CV section:', transformed);
    return transformed;
  },

  async updateCVSection(cvSection: CVSection): Promise<CVSection> {
    const orgId = await getUserOrgId()
    if (!orgId) {
      console.warn('⚠️  No org_id found, cannot update CV section');
      throw new Error('User profile not found. Please set up your profile first.')
    }
    
    // Update main CV section
    const { error: sectionError } = await supabase
      .from('cv_sections')
      .upsert({
        cv_section_id: cvSection.id,
        org_id: orgId,
        title: cvSection.title,
        subtitle: cvSection.subtitle,
        description: cvSection.description,
        updated_at: new Date().toISOString()
      })
    
    if (sectionError) throw sectionError

    // Update CV versions
    for (let index = 0; index < cvSection.versions.length; index++) {
      const version = cvSection.versions[index];
      
      // Find asset_id for file URL if it exists
      let fileAssetId = null
      if (version.fileUrl) {
        const { data: asset } = await supabase
          .from('assets')
          .select('asset_id')
          .eq('cloudinary_url', version.fileUrl)
          .single()
        
        fileAssetId = asset?.asset_id || null
      }

      // Update or insert version
      const { error: versionError } = await supabase
        .from('cv_versions')
        .upsert({
          cv_version_id: version.id,
          cv_section_id: cvSection.id,
          name: version.name,
          type: version.type,
          file_asset_id: fileAssetId,
          google_drive_url: version.googleDriveUrl || null,
          file_name: version.fileName || null,
          file_size: version.fileSize || null,
          upload_date: version.uploadDate || null,
          is_active: version.isActive,
          order_key: (index + 1).toString().padStart(6, '0'),
          updated_at: new Date().toISOString()
        })

      if (versionError) {
        console.error('Error updating CV version:', versionError)
        throw versionError
      }
    }
    
    return cvSection
  },

  async createDefaultCVSection(): Promise<CVSection> {
    const orgId = await getUserOrgId()
    
    // If no org_id, return mock data without database insert
    if (!orgId) {
      console.warn('⚠️  No org_id found, returning mock CV section without database insert');
      return {
        id: 'dev-cv',
        title: 'Download CV',
        subtitle: 'Choose your preferred format',
        description: 'Available in multiple formats tailored for different regions and opportunities.',
        versions: [
          {
            id: 'cv1',
            name: 'Indian CV',
            type: 'indian',
            isActive: true
          },
          {
            id: 'cv2',
            name: 'Europass CV',
            type: 'europass',
            isActive: true
          },
          {
            id: 'cv3',
            name: 'Global CV',
            type: 'global',
            isActive: true
          }
        ]
      }
    }
    
    const cv_section_id = ulid()
    
    // Create CV section
    const { error: sectionError } = await supabase
      .from('cv_sections')
      .insert({
        cv_section_id,
        org_id: orgId,
        title: 'Download CV',
        subtitle: 'Choose your preferred format',
        description: 'Available in multiple formats tailored for different regions and opportunities.'
      })
    
    if (sectionError) {
      console.error('Error creating CV section:', sectionError)
      // Return mock data if insert fails
      return {
        id: 'dev-cv',
        title: 'Download CV',
        subtitle: 'Choose your preferred format',
        description: 'Available in multiple formats tailored for different regions and opportunities.',
        versions: [
          { id: 'cv1', name: 'Indian CV', type: 'indian', isActive: true },
          { id: 'cv2', name: 'Europass CV', type: 'europass', isActive: true },
          { id: 'cv3', name: 'Global CV', type: 'global', isActive: true }
        ]
      }
    }
    
    // Create default CV versions
    const versions = [
      { name: 'Indian CV', type: 'indian' as const },
      { name: 'Europass CV', type: 'europass' as const },
      { name: 'Global CV', type: 'global' as const }
    ]
    
    const versionInserts = versions.map((version, index) => ({
      cv_version_id: ulid(),
      cv_section_id,
      name: version.name,
      type: version.type,
      is_active: true,
      order_key: (index + 1).toString().padStart(6, '0')
    }))
    
    await supabase
      .from('cv_versions')
      .insert(versionInserts)
    
    return {
      id: cv_section_id,
      title: 'Download CV',
      subtitle: 'Choose your preferred format',
      description: 'Available in multiple formats tailored for different regions and opportunities.',
      versions: versions.map((version, index) => ({
        id: versionInserts[index].cv_version_id,
        name: version.name,
        type: version.type,
        isActive: true
      }))
    }
  },

  // Public Data Access (No Authentication Required)
  async getPublicPortfolioByUsername(username: string): Promise<{
    profile: any;
    caseStudies: CaseStudy[];
    story: MyStorySection | null;
    journey: MyJourney | null;
    toolbox: MagicToolbox | null;
    contact: ContactSection | null;
    carousel: CarouselImage[];
  }> {
    // Get user profile by username (public data)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id, username, portfolio_status, name, bio, avatar_url')
      .eq('username', username)
      .eq('portfolio_status', 'published') // Only show published portfolios
      .single();

    if (profileError || !profile) {
      throw new Error('Portfolio not found or not published');
    }

    // Get all public data in parallel
    const [caseStudies, story, journey, toolbox, contact, carousel] = await Promise.all([
      this.getPublicCaseStudies(profile.org_id),
      this.getPublicMyStory(profile.org_id),
      this.getPublicJourney(profile.org_id),
      this.getPublicMagicToolbox(profile.org_id),
      this.getPublicContactInfo(profile.org_id),
      this.getPublicCarousel(profile.org_id)
    ]);

    return {
      profile,
      caseStudies,
      story,
      journey,
      toolbox,
      contact,
      carousel
    };
  },

  async getPublicCaseStudies(orgId: string): Promise<CaseStudy[]> {
    const { data, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        assets!case_studies_hero_image_asset_id_fkey (cloudinary_url),
        case_study_sections (
          *,
          section_assets (
            *,
            assets (*)
          ),
          embed_widgets (*)
        )
      `)
      .eq('org_id', orgId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformCaseStudy);
  },

  async getPublicMyStory(orgId: string): Promise<MyStorySection | null> {
    const { data, error } = await supabase
      .from('story_sections')
      .select(`
        *,
        story_paragraphs (*),
        assets (*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return transformStorySection(data);
  },

  async getPublicJourney(orgId: string): Promise<MyJourney | null> {
    // Journey tables don't exist yet, return null for now
    // TODO: Implement when journey tables are created
    console.log('Journey tables not available yet');
    return null;
  },

  async getPublicMagicToolbox(orgId: string): Promise<MagicToolbox | null> {
    try {
      // Try to get skills and tools directly from their tables
      const [skillsData, toolsData] = await Promise.all([
        supabase
          .from('skill_categories')
          .select('*')
          .eq('org_id', orgId),
        supabase
          .from('tools')
          .select('*')
          .eq('org_id', orgId)
      ]);

      if (skillsData.error && toolsData.error) return null;

      return {
        id: `toolbox-${orgId}`,
        title: 'Skills & Tools',
        subtitle: 'My Technical Expertise',
        categories: skillsData.data?.map(transformSkillCategory) || [],
        tools: toolsData.data?.map(transformTool) || []
      };
    } catch (error) {
      console.log('Magic toolbox tables not fully available yet');
      return null;
    }
  },

  async getPublicContactInfo(orgId: string): Promise<ContactSection | null> {
    const { data, error } = await supabase
      .from('contact_sections')
      .select(`
        *,
        social_links (*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return transformContactSection(data);
  },

  async getPublicCarousel(orgId: string): Promise<CarouselImage[]> {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select(`
        *,
        assets (*)
      `)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('order_key');

    if (error) return [];
    return (data || []).map(transformCarouselSlide);
  },

  // Portfolio Publishing Methods (Authentication Required)
  async getPortfolioStatus(): Promise<{
    status: 'draft' | 'published';
    lastPublished?: string;
    version?: number;
    publicUrl?: string;
    username?: string;
  }> {
    if (isDevelopmentMode) {
      return {
        status: 'draft',
        username: 'demo-user',
        publicUrl: `${window.location.origin}/u/demo-user`
      };
    }

    const orgId = await getUserOrgId();
    if (!orgId) {
      // For public access, try to get status without auth
      return {
        status: 'draft',
        username: undefined,
        publicUrl: undefined
      };
    }

    // Get profile with portfolio status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('portfolio_status, username')
      .eq('org_id', orgId)
      .single();

    if (profileError) {
      // If profile doesn't exist, create one (similar to getProfileSettings)
      if (profileError.code === 'PGRST116') { // No rows returned
        console.log('🔧 Creating initial profile for portfolio status...');
        
        // Get user info from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return {
            status: 'draft',
            username: undefined,
            publicUrl: undefined
          };
        }

        const defaultUsername = user.email?.split('@')[0]?.replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-6)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            org_id: orgId,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            username: defaultUsername,
            is_portfolio_public: true,
            portfolio_status: 'draft'
          })
          .select('portfolio_status, username')
          .single();

        if (createError) {
          // If username conflict, try with timestamp
          if (createError.message.includes('duplicate') || createError.message.includes('unique')) {
            const timestampUsername = defaultUsername + Date.now().toString().slice(-4);
            const { data: retryProfile, error: retryError } = await supabase
              .from('user_profiles')
              .insert({
                org_id: orgId,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                username: timestampUsername,
                is_portfolio_public: true,
                portfolio_status: 'draft'
              })
              .select('portfolio_status, username')
              .single();

            if (retryError) {
              return {
                status: 'draft',
                username: undefined,
                publicUrl: undefined
              };
            }
            
            return {
              status: retryProfile.portfolio_status || 'draft',
              username: retryProfile.username,
              publicUrl: retryProfile.username ? `${window.location.origin}/u/${retryProfile.username}` : undefined
            };
          }
          
          return {
            status: 'draft',
            username: undefined,
            publicUrl: undefined
          };
        }
        
        return {
          status: newProfile.portfolio_status || 'draft',
          username: newProfile.username,
          publicUrl: newProfile.username ? `${window.location.origin}/u/${newProfile.username}` : undefined
        };
      }
      
      // Return default status for other errors
      return {
        status: 'draft',
        username: undefined,
        publicUrl: undefined
      };
    }

    return {
      status: profile.portfolio_status || 'draft',
      username: profile.username,
      publicUrl: profile.username ? `${window.location.origin}/u/${profile.username}` : undefined
    };
  },

  async publishPortfolio(): Promise<{ success: boolean; message: string; publicUrl?: string }> {
    if (isDevelopmentMode) {
      return {
        success: true,
        message: 'Portfolio published successfully (development mode)',
        publicUrl: `${window.location.origin}/u/demo-user`
      };
    }

    const orgId = await getUserOrgId();
    if (!orgId) throw new Error('User not authenticated');

    // Check if user has username
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('org_id', orgId)
      .single();

    if (!profile?.username) {
      throw new Error('Username required. Please set up your username in Profile Settings first.');
    }

    // Update portfolio status to published
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ portfolio_status: 'published' })
      .eq('org_id', orgId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: 'Portfolio published successfully!',
      publicUrl: `${window.location.origin}/u/${profile.username}`
    };
  },

  async unpublishPortfolio(): Promise<{ success: boolean; message: string }> {
    if (isDevelopmentMode) {
      return {
        success: true,
        message: 'Portfolio unpublished successfully (development mode)'
      };
    }

    const orgId = await getUserOrgId();
    if (!orgId) throw new Error('User not authenticated');

    // Update portfolio status to draft
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ portfolio_status: 'draft' })
      .eq('org_id', orgId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: 'Portfolio unpublished successfully!'
    };
  },

  // Blog Methods (for BlogListPage and App.tsx)
  async getBlogPosts(): Promise<any[]> {
    // Return empty array for now - blog feature can be implemented later
    return [];
  },

  async getBlogPostBySlug(slug: string): Promise<any | null> {
    // Return null for now - blog feature can be implemented later
    return null;
  },

  // Profile Settings Methods (for ProfileSettingsManager)
  async getProfileSettings(): Promise<any> {
    const orgId = await getUserOrgId();
    if (!orgId) throw new Error('User not authenticated');

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error) {
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116') { // No rows returned
        console.log('🔧 Creating initial profile for user...');
        
        // Get user info from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const defaultUsername = user.email?.split('@')[0]?.replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-6)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,  // ✅ Include user_id
            org_id: orgId,     // ✅ Include org_id
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            username: defaultUsername,
            is_portfolio_public: true
          })
          .select()
          .single();

        if (createError) {
          // If username conflict, try with timestamp
          if (createError.message.includes('duplicate') || createError.message.includes('unique')) {
            const timestampUsername = defaultUsername + Date.now().toString().slice(-4);
            const { data: retryProfile, error: retryError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,  // ✅ Include user_id
                org_id: orgId,     // ✅ Include org_id
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                username: timestampUsername,
                is_portfolio_public: true
              })
              .select()
              .single();

            if (retryError) throw retryError;
            return retryProfile;
          }
          throw createError;
        }
        
        return newProfile;
      }
      throw error;
    }
    
    return profile;
  },

  async updateProfileSettings(settings: any): Promise<any> {
    const orgId = await getUserOrgId();
    if (!orgId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(settings)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Public Methods (for HomePage)
  async getPublicProjects(orgId?: string): Promise<Project[]> {
    if (!orgId) {
      // Get projects from any published portfolio
      const { data, error } = await supabase
        .from('case_studies')
        .select(`
          *,
          case_study_sections!inner (
            section_id,
            section_type,
            enabled,
            content
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) return [];
      
      return (data || []).map(transformCaseStudy).map(cs => ({
        id: cs.id,
        title: cs.title,
        description: extractDescription(JSON.stringify(cs.sections)),
        imageUrl: cs.sections.hero?.imageUrl || `https://picsum.photos/seed/${cs.id}/400/300`,
        tags: extractTags(JSON.stringify(cs.sections)),
        caseStudyId: cs.id
      }));
    }

    return this.getPublicCaseStudies(orgId).then(caseStudies => 
      caseStudies.map(cs => ({
        id: cs.id,
        title: cs.title,
        description: extractDescription(JSON.stringify(cs.sections)),
        imageUrl: cs.sections.hero?.imageUrl || `https://picsum.photos/seed/${cs.id}/400/300`,
        tags: extractTags(JSON.stringify(cs.sections)),
        caseStudyId: cs.id
      }))
    );
  },

  async getFirstPublicPortfolio(): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('portfolio_status', 'published')
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  // Data Symmetry Methods (for useDataSymmetry hook)
  async verifyDataSymmetry(): Promise<{
    isSymmetric: boolean;
    differences: string[];
    authenticatedCount: number;
    publicCount: number;
  }> {
    const orgId = await getUserOrgId();
    if (!orgId) {
      return {
        isSymmetric: false,
        differences: ['User not authenticated'],
        authenticatedCount: 0,
        publicCount: 0
      };
    }

    // Optimized symmetry check: fetch counts only where possible

    // 1. Admin Count (Authenticated)
    const { count: adminCount, error: adminError } = await supabase
      .from('case_studies')
      .select('*', { count: 'exact', head: true });

    if (adminError) {
      console.error('Error fetching admin count:', adminError);
    }

    // 2. Public Count (Anonymous/Published)
    // We simulate a public fetch by applying the published filter
    const { count: publicCount, error: publicError } = await supabase
      .from('case_studies')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_published', true);

    if (publicError) {
      console.error('Error fetching public count:', publicError);
    }

    const differences: string[] = [];
    const safeAdminCount = adminCount || 0;
    const safePublicCount = publicCount || 0;

    // Note: In a draft system, Admin > Public is expected.
    // Symmetry here implies "Do the published counts match what we expect?"
    // But typically "Symmetry" in this context meant "Does the public API see what the Admin PUBLISHED?"
    // Since we are checking RAW counts, they might differ if drafts exist.
    // Assuming the intention was "Are there sync issues?", simple count mismatch isn't an error if drafts are allowed.
    // However, if we assume "Everything should be public" mode, then yes.
    // Given the SaaS change, `adminCount >= publicCount` is the new normal.

    // Let's verify if any PUBLISHED case studies are NOT visible to public
    // (This catches the RLS issue we fixed earlier)

    // Fetch count of case studies that ARE published but maybe hidden by RLS
    // This requires a raw count of 'is_published = true' seen by Admin
    const { count: adminPublishedCount } = await supabase
      .from('case_studies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Compare Admin's view of "Published" vs Public's view of "Published"
    if ((adminPublishedCount || 0) !== safePublicCount) {
      differences.push(`Visibility Mismatch: Admin sees ${adminPublishedCount} published studies, Public sees ${safePublicCount}`);
    }

    return {
      isSymmetric: differences.length === 0,
      differences,
      authenticatedCount: safeAdminCount, // Total admin items
      publicCount: safePublicCount // Total public items
    };
  },

  async ensureDataSymmetry(): Promise<void> {
    // This method can be implemented to fix data symmetry issues
    // For now, it's a no-op
    return;
  }
}

// Transform functions
function transformCaseStudy(dbRow: any): CaseStudy {
  const sections = {}
  
  if (dbRow.case_study_sections) {
    for (const section of dbRow.case_study_sections) {
      const sectionData = JSON.parse(section.content || '{}')
      sections[section.section_type] = {
        enabled: section.enabled,
        ...sectionData
      }
    }
  }
  
  // Add hero image URL from assets if available
  if (sections['hero'] && dbRow.assets?.cloudinary_url) {
    sections['hero'].imageUrl = dbRow.assets.cloudinary_url
  }
  
  // Migrate document section to include documents array if it doesn't exist
  if (sections['document'] && !('documents' in sections['document'])) {
    sections['document'].documents = []
  }
  
  return {
    id: dbRow.case_study_id,
    title: dbRow.title,
    template: dbRow.template,
    content: dbRow.content_html,
    is_published: dbRow.is_published ?? false,
    published_at: dbRow.published_at,
    sections: sections as CaseStudy['sections']
  }
}

function transformCarouselSlide(dbRow: any): CarouselImage {
  return {
    id: dbRow.slide_id,
    src: dbRow.assets?.cloudinary_url || '',
    title: dbRow.title,
    description: dbRow.description
  }
}

function transformStorySection(dbRow: any): MyStorySection {
  return {
    id: dbRow.story_id,
    title: dbRow.title,
    subtitle: dbRow.subtitle,
    paragraphs: dbRow.story_paragraphs
      ?.sort((a, b) => a.order_key.localeCompare(b.order_key))
      ?.map(p => p.content) || [],
    imageUrl: dbRow.assets?.cloudinary_url || '',
    imageAlt: dbRow.image_alt || ''
  }
}

function transformSkillCategory(dbRow: any): SkillCategory {
  return {
    id: dbRow.category_id,
    title: dbRow.title,
    icon: dbRow.icon,
    iconUrl: dbRow.icon_url,
    color: dbRow.color,
    skills: dbRow.skills?.map(transformSkill) || []
  }
}

function transformSkill(dbRow: any) {
  return {
    id: dbRow.skill_id,
    name: dbRow.name,
    level: dbRow.level
  }
}

function transformTool(dbRow: any): Tool {
  return {
    id: dbRow.tool_id,
    name: dbRow.name,
    icon: dbRow.icon,
    iconUrl: dbRow.icon_url,
    color: dbRow.color
  }
}

function transformJourney(dbRow: any): MyJourney {
  return {
    id: dbRow.timeline_id,
    title: dbRow.title,
    subtitle: dbRow.subtitle,
    items: dbRow.journey_milestones
      ?.sort((a, b) => a.order_key.localeCompare(b.order_key))
      ?.map(transformJourneyItem) || []
  }
}

function transformJourneyItem(dbRow: any): JourneyItem {
  return {
    id: dbRow.milestone_id,
    title: dbRow.title,
    company: dbRow.company,
    period: dbRow.period,
    description: dbRow.description,
    isActive: dbRow.is_active
  }
}

function transformContactSection(dbRow: any): ContactSection {
  return {
    id: dbRow.contact_id,
    title: dbRow.title,
    subtitle: dbRow.subtitle,
    description: dbRow.description,
    email: dbRow.email,
    location: dbRow.location,
    socialLinks: dbRow.social_links?.map(transformSocialLink) || [],
    resumeUrl: dbRow.assets?.cloudinary_url || '',
    resumeButtonText: dbRow.resume_button_text
  }
}

function transformSocialLink(dbRow: any): SocialLink {
  return {
    id: dbRow.link_id,
    name: dbRow.name,
    url: dbRow.url,
    icon: dbRow.icon,
    color: dbRow.color
  }
}

function transformCVSection(dbRow: any): CVSection {
  return {
    id: dbRow.cv_section_id,
    title: dbRow.title,
    subtitle: dbRow.subtitle,
    description: dbRow.description,
    versions: dbRow.cv_versions?.map(transformCVVersion) || []
  }
}

function transformCVVersion(dbRow: any): CVVersion {
  return {
    id: dbRow.cv_version_id,
    name: dbRow.name,
    type: dbRow.type,
    fileUrl: dbRow.assets?.cloudinary_url,
    googleDriveUrl: dbRow.google_drive_url,
    fileName: dbRow.assets?.original_filename,
    fileSize: dbRow.assets?.file_size,
    uploadDate: dbRow.assets?.created_at,
    isActive: dbRow.is_active
  }
}

function createDefaultSections(caseStudyId: string) {
  const sections = [
    { section_type: 'hero', title: 'Hero Section', enabled: true },
    { section_type: 'overview', title: 'Overview', enabled: true },
    { section_type: 'problem', title: 'Problem', enabled: true },
    { section_type: 'process', title: 'Process', enabled: true },
    { section_type: 'showcase', title: 'Showcase', enabled: true },
    { section_type: 'reflection', title: 'Reflection', enabled: true },
    { section_type: 'gallery', title: 'Gallery', enabled: false },
    { section_type: 'document', title: 'Document', enabled: false },
    { section_type: 'video', title: 'Video', enabled: false },
    { section_type: 'figma', title: 'Figma', enabled: false },
    { section_type: 'miro', title: 'Miro', enabled: false },
    { section_type: 'links', title: 'Links', enabled: false }
  ]
  
  return sections.map((section, index) => ({
    section_id: ulid(),
    case_study_id: caseStudyId,
    section_type: section.section_type,
    title: section.title,
    enabled: section.enabled,
    order_key: (index + 1).toString().padStart(6, '0'),
    content: JSON.stringify(getDefaultSectionContent(section.section_type))
  }))
}

function getDefaultSectionContent(sectionType: string) {
  const defaults = {
    hero: {
      headline: 'New Case Study',
      subheading: 'An amazing new project',
      text: 'This is the introduction to the project.',
      imageUrl: ''
    },
    overview: {
      title: 'Project Overview',
      summary: 'A brief summary of the project goals and outcomes.',
      metrics: 'Users Increased: 50%\nEngagement: +25%'
    },
    problem: {
      title: 'The Challenge',
      description: 'This is the problem statement we set out to solve.'
    },
    process: {
      title: 'Our Creative Process',
      description: 'Here is a description of our process.',
      steps: 'Step 1: Research\nStep 2: Design\nStep 3: Develop'
    },
    showcase: {
      title: 'Solution Showcase',
      description: 'This is how we solved the problem.',
      features: 'Feature 1\nFeature 2'
    },
    reflection: {
      title: 'Reflection',
      content: 'What we learned from this project.',
      learnings: 'Learning 1\nLearning 2'
    },
    gallery: { images: [] },
    document: { url: '', documents: [] },
    video: { url: '', caption: '' },
    figma: { url: '', caption: '' },
    miro: { url: '', caption: '' },
    links: { title: 'Additional Resources', items: 'GitHub|https://github.com' }
  }
  
  return defaults[sectionType] || {}
}

function extractDescription(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return parsed.text || parsed.description || 'No description available'
  } catch {
    return 'No description available'
  }
}

function extractTags(content: string): string[] {
  // Extract tags from content or return default tags
  return ['React', 'TypeScript', 'Design']
}