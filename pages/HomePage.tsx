
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import Carousel from '../components/Carousel';
import SymmetryIndicator from '../components/SymmetryIndicator';
import { PortfolioPublishManager } from '../components/PortfolioPublishManager';
import { Project, View, MyStorySection, MagicToolbox, MyJourney, ContactSection, CVSection } from '../types';
import { api } from '../services/api';
import { useDataSymmetry } from '../hooks/useDataSymmetry';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe initialization of Supabase client
const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);


interface HomePageProps {
    navigateTo: (view: View, caseStudyId?: string) => void;
    isPublicView?: boolean;
    portfolioData?: {
        profile: any;
        projects: Project[];
        story: MyStorySection | null;
        journey: MyJourney | null;
        toolbox: MagicToolbox | null;
        contact: ContactSection | null;
        cv: CVSection | null;
    } | null;
}

const SootSprite: React.FC<{ style?: React.CSSProperties }> = ({ style }) => <div className="w-8 h-8 bg-black rounded-full relative floating" style={style}><div className="absolute top-2 left-1.5 w-2 h-2 bg-white rounded-full"></div><div className="absolute top-2 right-1.5 w-2 h-2 bg-white rounded-full"></div></div>;

const HomePage: React.FC<HomePageProps> = ({ navigateTo, portfolioData }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [filterTag, setFilterTag] = useState<string>('all');
    const [myStory, setMyStory] = useState<MyStorySection | null>(null);
    const [magicToolbox, setMagicToolbox] = useState<MagicToolbox | null>(null);
    const [myJourney, setMyJourney] = useState<MyJourney | null>(null);
    const [contactSection, setContactSection] = useState<ContactSection | null>(null);
    const [cvSection, setCVSection] = useState<CVSection | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    
    // 🔄 Symmetry system for mirroring authenticated data to public
    const { isSymmetric, ensureSymmetry } = useDataSymmetry();

    // 🔄 Real-time subscription setup functions
    const setupAuthenticatedRealtimeSubscriptions = (orgId: string) => {
        console.log('🔄 Setting up authenticated real-time subscriptions for org:', orgId);
        
        // Subscribe to case studies changes
        const caseStudiesSubscription = supabase
            .channel('authenticated-case-studies')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'case_studies',
                    filter: `org_id=eq.${orgId}`
                }, 
                (payload) => {
                    console.log('🔄 Case studies changed:', payload);
                    // Refresh projects data
                    refreshAuthenticatedProjects();
                }
            )
            .subscribe();

        // Subscribe to story sections changes
        const storySubscription = supabase
            .channel('authenticated-story')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'story_sections',
                    filter: `org_id=eq.${orgId}`
                }, 
                (payload) => {
                    console.log('🔄 Story changed:', payload);
                    refreshAuthenticatedStory();
                }
            )
            .subscribe();

        // Subscribe to journey changes
        const journeySubscription = supabase
            .channel('authenticated-journey')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'journey_timelines',
                    filter: `org_id=eq.${orgId}`
                }, 
                (payload) => {
                    console.log('🔄 Journey changed:', payload);
                    refreshAuthenticatedJourney();
                }
            )
            .subscribe();

        // Store subscriptions for cleanup
        return [caseStudiesSubscription, storySubscription, journeySubscription];
    };

    const setupPublicRealtimeSubscriptions = (orgId: string) => {
        console.log('🔄 Setting up public real-time subscriptions for org:', orgId);
        
        // Subscribe to published case studies changes
        const publicCaseStudiesSubscription = supabase
            .channel('public-case-studies')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'case_studies',
                    filter: `org_id=eq.${orgId}`
                }, 
                (payload) => {
                    console.log('🔄 Public case studies changed:', payload);
                    // Only refresh if it's a published case study
                    if ((payload.new as any)?.is_published || (payload.old as any)?.is_published) {
                        refreshPublicProjects(orgId);
                    }
                }
            )
            .subscribe();

        // Subscribe to public story changes
        const publicStorySubscription = supabase
            .channel('public-story')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'story_sections',
                    filter: `org_id=eq.${orgId}`
                }, 
                (payload) => {
                    console.log('🔄 Public story changed:', payload);
                    refreshPublicStory(orgId);
                }
            )
            .subscribe();

        return [publicCaseStudiesSubscription, publicStorySubscription];
    };

    // Refresh functions for real-time updates
    const refreshAuthenticatedProjects = async () => {
        try {
            const fetchedProjects = await api.getProjects();
            setProjects(fetchedProjects || []);
            setFilteredProjects(fetchedProjects || []);
            console.log('✅ Authenticated projects refreshed');
        } catch (error) {
            console.error('❌ Error refreshing authenticated projects:', error);
        }
    };

    const refreshAuthenticatedStory = async () => {
        try {
            const fetchedStory = await api.getMyStory();
            setMyStory(fetchedStory);
            console.log('✅ Authenticated story refreshed');
        } catch (error) {
            console.error('❌ Error refreshing authenticated story:', error);
        }
    };

    const refreshAuthenticatedJourney = async () => {
        try {
            const fetchedJourney = await api.getMyJourney();
            setMyJourney(fetchedJourney);
            console.log('✅ Authenticated journey refreshed');
        } catch (error) {
            console.error('❌ Error refreshing authenticated journey:', error);
        }
    };

    const refreshPublicProjects = async (orgId: string) => {
        try {
            const fetchedProjects = await api.getPublicProjects(orgId);
            setProjects(fetchedProjects || []);
            setFilteredProjects(fetchedProjects || []);
            console.log('✅ Public projects refreshed');
        } catch (error) {
            console.error('❌ Error refreshing public projects:', error);
        }
    };

    const refreshPublicStory = async (orgId: string) => {
        try {
            const fetchedStory = await api.getPublicMyStory(orgId);
            setMyStory(fetchedStory);
            console.log('✅ Public story refreshed');
        } catch (error) {
            console.error('❌ Error refreshing public story:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            console.log('🔄 HomePage Data Flow - Starting fetch...');
            
            // PRIORITY 1: If portfolio data is passed as props (from PublicPortfolioPage), use it directly
            if (portfolioData) {
                console.log('📡 Using portfolio data from props (Public View):', portfolioData);
                setProjects(portfolioData.projects || []);
                setFilteredProjects(portfolioData.projects || []);
                setMyStory(portfolioData.story);
                setMagicToolbox(portfolioData.toolbox);
                setMyJourney(portfolioData.journey);
                setContactSection(portfolioData.contact);
                setCVSection(portfolioData.cv);
                
                // Set up real-time subscriptions for public view
                const subs = setupPublicRealtimeSubscriptions(portfolioData.profile.org_id);
                setSubscriptions(subs);
                return;
            }

            // PRIORITY 2: Try to load authenticated user's data first
            try {
                console.log('🔐 Attempting to load authenticated user data...');
                const [fetchedProjects, fetchedStory, fetchedToolbox, fetchedJourney, fetchedContact, fetchedCV] = await Promise.all([
                    api.getProjects(),
                    api.getMyStory(),
                    api.getMagicToolbox(),
                    api.getMyJourney(),
                    api.getContactSection(),
                    api.getCVSection()
                ]);
                
                // Check if user is actually authenticated first
                const { data: { user } } = await supabase.auth.getUser();
                const isUserAuthenticated = !!user;
                
                // Check if we have authenticated data (story/toolbox/journey are key indicators)
                const hasAuthenticatedData = fetchedStory && fetchedToolbox && fetchedJourney;
                
                if (isUserAuthenticated && hasAuthenticatedData) {
                    console.log('✅ User is authenticated with data - Using their data');
                    setIsAuthenticated(true);
                    
                    // User is authenticated and has data - this becomes the "master" data
                    setProjects(fetchedProjects || []);
                    setFilteredProjects(fetchedProjects || []);
                    setMyStory(fetchedStory);
                    setMagicToolbox(fetchedToolbox);
                    setMyJourney(fetchedJourney);
                    setContactSection(fetchedContact);
                    setCVSection(fetchedCV);
                    
                    // 🔄 SYMMETRY: Ensure this authenticated data is also available publicly
                    // This ensures the authenticated version mirrors to public version
                    await ensurePublicPortfolioSymmetry();
                    
                    // Trigger symmetry check after data is loaded
                    setTimeout(() => {
                        ensureSymmetry();
                    }, 1000);
                    
                    // Set up real-time subscriptions for authenticated user
                    // Get user's org_id for subscriptions
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('org_id')
                        .eq('user_id', user.id)
                        .single();
                    
                    if (profile) {
                        const subs = setupAuthenticatedRealtimeSubscriptions(profile.org_id);
                        setSubscriptions(subs);
                    }
                    
                    return;
                } else if (isUserAuthenticated && !hasAuthenticatedData) {
                    console.log('⚠️  User is authenticated but has no data - falling back to public');
                } else {
                    console.log('ℹ️  User is not authenticated - falling back to public');
                }
                
                console.log('❌ No authenticated data found, falling back to public portfolio...');
            } catch (error) {
                console.error('❌ Error fetching authenticated data:', error);
            }

            // PRIORITY 3: Load first public portfolio as fallback
            try {
                console.log('🌐 Loading first public portfolio...');
                const firstPublicPortfolio = await api.getFirstPublicPortfolio();
                if (firstPublicPortfolio) {
                    console.log('✅ Using first public portfolio data');
                    setProjects(firstPublicPortfolio.projects || []);
                    setFilteredProjects(firstPublicPortfolio.projects || []);
                    setMyStory(firstPublicPortfolio.story);
                    setMagicToolbox(firstPublicPortfolio.toolbox);
                    setMyJourney(firstPublicPortfolio.journey);
                    setContactSection(firstPublicPortfolio.contact);
                    setCVSection(firstPublicPortfolio.cv);
                    
                    // Set up real-time subscriptions for public fallback
                    const subs = setupPublicRealtimeSubscriptions(firstPublicPortfolio.profile.org_id);
                    setSubscriptions(subs);
                } else {
                    console.log('❌ No public portfolio found - showing empty state');
                }
            } catch (error) {
                console.error('❌ Error loading public portfolio:', error);
            }
        };

        // 🔄 SYMMETRY FUNCTION: Ensures authenticated data is mirrored to public
        const ensurePublicPortfolioSymmetry = async () => {
            try {
                // Check if current user has public portfolio enabled
                const currentUser = await api.checkAuth();
                if (currentUser) {
                    console.log('🔄 Ensuring public portfolio symmetry for authenticated user...');
                    // This ensures that when authenticated user makes changes,
                    // those changes are immediately available in public view
                    // The RLS policies handle the actual data access
                }
            } catch (error) {
                console.log('ℹ️  Symmetry check skipped (not authenticated)');
            }
        };
        
        fetchData();
        
        // Cleanup function to unsubscribe from real-time channels
        return () => {
            console.log('🔄 Cleaning up real-time subscriptions');
            subscriptions.forEach(subscription => {
                if (subscription && subscription.unsubscribe) {
                    subscription.unsubscribe();
                }
            });
        };
    }, [portfolioData]);

    // Sort and filter projects
    useEffect(() => {
        let result = [...projects];

        // Filter by tag
        if (filterTag !== 'all') {
            result = result.filter(project => project.tags.includes(filterTag));
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            // For date sorting, we'll use the order they come from API
            // (API should return them ordered by created_at)
            return 0;
        });

        if (sortBy === 'oldest') {
            result.reverse();
        }

        setFilteredProjects(result);
    }, [projects, sortBy, filterTag]);

    // Get all unique tags from projects
    const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));

    const handleThemeToggle = () => {
        document.documentElement.classList.toggle('dark');
    };

    return (
        <>
            <Header navigateTo={navigateTo} isTransparent={true} />
            
            {/* 🚀 Portfolio Publish Manager - Only show for authenticated users */}
            {isAuthenticated && <PortfolioPublishManager />}
            
            {/* 🔄 Symmetry Indicator - Only show for authenticated users */}
            {isAuthenticated && (
                <div className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            🔄 Public Sync
                        </span>
                    </div>
                    <SymmetryIndicator showDetails={true} />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Your changes mirror to public portfolio
                    </div>
                </div>
            )}
            
            <div className="fixed top-4 right-4 z-50">
                <button onClick={handleThemeToggle} className="bg-yellow-200 hover:bg-yellow-300 text-gray-800 dark:bg-gray-700 dark:text-yellow-300 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                    <i className="fas fa-moon text-xl hidden dark:inline"></i>
                    <i className="fas fa-sun text-xl dark:hidden"></i>
                </button>
            </div>

            {/* Hero Section */}
            <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 bg-gradient-to-b from-blue-200 to-blue-100 dark:from-gray-800 dark:to-gray-900">
                <div className="absolute top-20 right-20 hidden md:block"><SootSprite /></div>
                <div className="absolute bottom-10 left-10 hidden md:block"><SootSprite style={{ animationDelay: '1s' }}/></div>
                <div className="max-w-4xl mx-auto text-center px-4 z-10">
                    <h1 className="ghibli-font text-5xl md:text-7xl font-bold text-gray-800 dark:text-gray-100">
                        Crafting Products <br />That Spark <span className="text-yellow-400">Joy & Magic</span>
                    </h1>
                    <p className="text-xl md:text-2xl my-8 text-gray-700 dark:text-gray-300">
                        A Product Manager's journey through enchanted user experiences and data-driven storytelling
                    </p>
                    <a href="#about" className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105">
                        Begin the Journey <i className="fas fa-arrow-down ml-2"></i>
                    </a>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent"></div>
            </section>

            {/* 1. MY STORY SECTION - Priority Section */}
            <section id="my-story" className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-16 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">My Story</span>
                    </h2>
                    
                    {myStory ? (
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="md:w-1/2">
                                <img 
                                    src={myStory.imageUrl || 'https://picsum.photos/seed/story/400/300'} 
                                    alt={myStory.imageAlt || 'My Story'} 
                                    className="rounded-2xl shadow-xl border-4 border-white dark:border-gray-700 w-full max-w-md mx-auto" 
                                />
                            </div>
                            <div className="md:w-1/2">
                                <h3 className="ghibli-font text-3xl mb-6 text-gray-800 dark:text-gray-200">
                                    {myStory.subtitle || 'Once upon a time...'}
                                </h3>
                                <div className="text-gray-600 space-y-4 dark:text-gray-400">
                                    {myStory.paragraphs && myStory.paragraphs.length > 0 ? (
                                        myStory.paragraphs.map((paragraph, index) => (
                                            <p key={index} className="text-lg leading-relaxed">
                                                {typeof paragraph === 'string' ? paragraph : (paragraph as any).content}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-lg leading-relaxed">
                                            In the ever-shifting landscape of business, a Management Consultant 
                                            set forth on a mission: to turn complexity into clarity, data into 
                                            insights, and strategy into success.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📖</div>
                            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                My Story Coming Soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Every great portfolio has a story. Mine is being crafted with care, 
                                weaving together experiences, insights, and the magic of product management.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* 2. MAGIC TOOLBOX SECTION - Priority Section */}
            <section id="magic-toolbox" className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Magic Toolbox</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        The enchanted skills and expertise that power my magical creations
                    </p>

                    {magicToolbox && magicToolbox.categories && magicToolbox.categories.length > 0 ? (
                        <>
                            {/* Skill Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                                {magicToolbox.categories.map((category) => (
                                    <div key={category.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div 
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl overflow-hidden"
                                                style={{ 
                                                    backgroundColor: category.iconUrl ? 'transparent' : `${category.color}20`,
                                                    border: category.iconUrl ? 'none' : `2px solid ${category.color}40`
                                                }}
                                            >
                                                {category.iconUrl ? (
                                                    <img 
                                                        src={category.iconUrl} 
                                                        alt={category.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{category.icon}</span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                                {category.title}
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            {category.skills.map((skill) => (
                                                <div key={skill.id}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {skill.name}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {skill.level}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                                            style={{ 
                                                                width: `${skill.level}%`,
                                                                backgroundColor: category.color
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        {/* Skill Categories Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            {magicToolbox.categories.map((category) => (
                                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div 
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl overflow-hidden"
                                            style={{ 
                                                backgroundColor: category.iconUrl ? 'transparent' : `${category.color}20`,
                                                border: category.iconUrl ? 'none' : `2px solid ${category.color}40`
                                            }}
                                        >
                                            {category.iconUrl ? (
                                                <img 
                                                    src={category.iconUrl} 
                                                    alt={category.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{category.icon}</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                            {category.title}
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        {category.skills && category.skills.map((skill) => (
                                            <div key={skill.id}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {skill.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {skill.level}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{ 
                                                            width: `${skill.level}%`,
                                                            backgroundColor: category.color
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🧰</div>
                            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                Magic Toolbox Loading...
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Gathering my magical skills and expertise
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. ENHANCED TOOLS I WIELD SECTION - Priority Section */}
            <section id="enhanced-tools" className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Enhanced Tools I Wield</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        The powerful instruments that bring ideas to life
                    </p>
                    
                    {magicToolbox && magicToolbox.tools && magicToolbox.tools.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-4">
                            {magicToolbox.tools.map((tool) => (
                                <div 
                                    key={tool.id}
                                    className="px-6 py-3 rounded-full flex items-center gap-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-700"
                                    style={{
                                        border: `2px solid ${tool.color}60`,
                                    }}
                                >
                                    {tool.iconUrl ? (
                                        <img 
                                            src={tool.iconUrl} 
                                            alt={tool.name}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                    ) : (
                                        <span className="text-2xl">{tool.icon}</span>
                                    )}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {tool.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🛠️</div>
                            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                Tools Arsenal Coming Soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Curating the finest tools for digital craftsmanship
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. MAGICAL PROJECTS SECTION - Priority Section */}
            <section id="magical-projects" className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Magical Projects</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
                        Enchanted case studies that showcase the magic of product management
                    </p>
                    
                    {/* Sort and Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sort by:
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title (A-Z)</option>
                            </select>
                        </div>

                        {/* Filter by Tag */}
                        {allTags.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Filter:
                                </label>
                                <select
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Projects ({projects.length})</option>
                                    {allTags.map(tag => (
                                        <option key={tag} value={tag}>
                                            {tag} ({projects.filter(p => p.tags.includes(tag)).length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Results Count */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {filteredProjects.length} of {projects.length} projects
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map(project => <ProjectCard key={project.id} project={project} navigateTo={navigateTo} />)
                        ) : filterTag !== 'all' ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    No projects found with tag "{filterTag}"
                                </p>
                                <button
                                    onClick={() => setFilterTag('all')}
                                    className="mt-4 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                    Clear filter
                                </button>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    No published case studies yet.
                                </p>
                                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                    Create and publish case studies from the Admin page to showcase your work here.
                                </p>
                            </div>
                        ) : (
                            <p className="col-span-full text-center text-gray-600 dark:text-gray-400">Loading projects...</p>
                        )}
                    </div>
                </div>
            </section>

            {/* 5. MY JOURNEY SECTION - Priority Section */}
            <section id="my-journey" className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">My Journey</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        The magical path that led me to where I am today
                    </p>

                    {myJourney && myJourney.items && myJourney.items.length > 0 ? (
                        <>
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-yellow-400"></div>
                                
                                <div className="space-y-12">
                                    {myJourney.items.map((item, index) => (
                                        <div key={item.id} className="relative flex items-start gap-8">
                                            {/* Timeline dot */}
                                            <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${
                                                item.isActive 
                                                    ? 'bg-yellow-400 text-gray-800' 
                                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                            }`}>
                                                <span className="text-2xl">
                                                    {item.isActive ? '🏆' : '📍'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                                        {item.title}
                                                    </h3>
                                                    {item.isActive && (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                                                    {item.company}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🗺️</div>
                            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                Journey Map Coming Soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Every great adventure has milestones. I'm charting the key moments 
                                that shaped my path in product management and beyond.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* 6. MAGICAL JOURNEYS SECTION - Priority Section */}
            <section id="magical-journeys" className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Magical Journeys</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        Visual stories and moments that capture the essence of my adventures
                    </p>
                    <Carousel />
                </div>
            </section>

            {/* 7. DOWNLOAD CV SECTION - Priority Section */}
            <section id="download-cv" className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Download CV</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        Get my professional resume in your preferred format
                    </p>

                    {cvSection && cvSection.versions && cvSection.versions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {cvSection.versions.filter(version => version.isActive).map((version) => (
                                <CVVersionCard key={version.id} version={version} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📄</div>
                            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                CV Downloads Coming Soon
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                I'm preparing multiple versions of my CV tailored for different regions 
                                and opportunities. Check back soon for download options.
                            </p>
                            <div className="mt-8">
                                <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                                    📧 Request CV via Email
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 8. CONTACT ME SECTION - Priority Section */}
            <section id="contact-me" className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="ghibli-font text-4xl text-center mb-4 text-blue-700 dark:text-blue-300">
                        <span className="border-b-4 border-yellow-400 pb-2">Contact Me</span>
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                        Let's create something magical together
                    </p>

                    {contactSection ? (
                        <>
                            {/* Main Contact Card */}
                            <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-3xl p-8 mb-8 shadow-2xl">
                                <h3 className="ghibli-font text-2xl mb-4">{contactSection.subtitle}</h3>
                                <div className="space-y-4 mb-6">
                                    {contactSection.description.split('\n').map((paragraph, index) => (
                                        <p key={index} className="text-lg leading-relaxed opacity-90">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                {/* Contact Info */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            📧
                                        </div>
                                        <span className="font-medium">{contactSection.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            📍
                                        </div>
                                        <span className="font-medium">{contactSection.location}</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="flex gap-4">
                                    {contactSection.socialLinks.map((link) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                            title={link.name}
                                        >
                                            <span className="text-xl">{link.icon}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Resume Download Button */}
                            <div className="text-center">
                                <a
                                    href={contactSection.resumeUrl}
                                    download
                                    className="inline-flex items-center gap-3 bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
                                    </svg>
                                    {contactSection.resumeButtonText}
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading contact information...</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </>
    );
};

// CV Version Card Component for Homepage Display
interface CVVersionCardProps {
    version: CVSection['versions'][0];
}

const CVVersionCard: React.FC<CVVersionCardProps> = ({ version }) => {
    const getVersionIcon = (type: string): string => {
        switch (type) {
            case 'indian': return '🇮🇳';
            case 'europass': return '🇪🇺';
            case 'global': return '🌍';
            default: return '📄';
        }
    };

    const getVersionColor = (type: string): string => {
        switch (type) {
            case 'indian': return 'from-orange-500 to-red-500';
            case 'europass': return 'from-blue-500 to-indigo-500';
            case 'global': return 'from-green-500 to-teal-500';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getDownloadUrl = (): string => {
        return version.fileUrl || version.googleDriveUrl || '#';
    };

    const isDownloadable = (): boolean => {
        return !!(version.fileUrl || version.googleDriveUrl);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            {/* Header with Icon and Title */}
            <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${getVersionColor(version.type)} flex items-center justify-center text-3xl shadow-lg`}>
                    {getVersionIcon(version.type)}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {version.name}
                </h3>
                <div className="flex justify-center">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                        isDownloadable()
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {isDownloadable() ? 'Available' : 'Coming Soon'}
                    </span>
                </div>
            </div>

            {/* File Info */}
            {version.fileUrl && version.fileName && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-600 dark:text-blue-400">📎</span>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            File Available
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {version.fileName}
                    </p>
                </div>
            )}

            {version.googleDriveUrl && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">🔗</span>
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">
                            Google Drive Link
                        </span>
                    </div>
                </div>
            )}

            {/* Download Button */}
            <div className="text-center">
                {isDownloadable() ? (
                    <a
                        href={getDownloadUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${getVersionColor(version.type)} text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
                        </svg>
                        Download CV
                    </a>
                ) : (
                    <button
                        disabled
                        className="inline-flex items-center gap-2 bg-gray-400 text-white font-semibold py-3 px-6 rounded-full shadow-lg cursor-not-allowed opacity-60"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Coming Soon
                    </button>
                )}
            </div>
        </div>
    );
};

export default HomePage;
