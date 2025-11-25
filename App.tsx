
import React, { useState, useEffect, useCallback, createContext } from 'react';
import { AuthContextType, CaseStudy, BlogPost, User, View } from './types';
import { api } from './services/api';
import HomePage from './pages/HomePage';
import CaseStudyPage from './pages/CaseStudyPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import PublicPortfolioPage from './pages/PublicPortfolioPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import DevelopmentBanner from './components/DevelopmentBanner';
import DevModeDebug from './components/DevModeDebug';

export const AuthContext = createContext<AuthContextType | null>(null);

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
    const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
    const [publicUsername, setPublicUsername] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if URL is a public portfolio route (/u/username)
    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/u\/([a-z0-9_-]+)/i);
        if (match) {
            setPublicUsername(match[1]);
            setView('home'); // Use home view for public portfolio
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await api.checkAuth();
                setUser(currentUser);
            } catch (error) {
                console.log("Not authenticated");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, pass: string): Promise<User> => {
        const loggedInUser = await api.login(email, pass);
        setUser(loggedInUser);
        setView('admin');
        return loggedInUser;
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        setView('home');
    };

    const navigateTo = useCallback(async (newView: View, idOrSlug?: string) => {
        if (newView === 'caseStudy' && idOrSlug) {
            try {
                const caseStudyData = await api.getCaseStudyById(idOrSlug);
                setSelectedCaseStudy(caseStudyData);
                setSelectedBlogPost(null);
                setView('caseStudy');
            } catch (error) {
                console.error("Failed to load case study:", error);
                setView('home');
            }
        } else if (newView === 'blogPost' && idOrSlug) {
            try {
                const blogPostData = await api.getBlogPostBySlug(idOrSlug);
                if (blogPostData) {
                    setSelectedBlogPost(blogPostData);
                    setSelectedCaseStudy(null);
                    setView('blogPost');
                } else {
                    setView('blog');
                }
            } catch (error) {
                console.error("Failed to load blog post:", error);
                setView('blog');
            }
        } else {
            setSelectedCaseStudy(null);
            setSelectedBlogPost(null);
            setView(newView);
        }
        window.scrollTo(0, 0);
    }, []);

    const authContextValue: AuthContextType = {
        user,
        login,
        logout,
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                </div>
            );
        }
        
        // Check if we're in development mode
        const isDevelopmentMode = !import.meta.env.VITE_SUPABASE_URL || 
                                 import.meta.env.VITE_SUPABASE_URL.includes('placeholder') ||
                                 import.meta.env.VITE_SUPABASE_URL.includes('your-project') ||
                                 !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                                 import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder') ||
                                 import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your_supabase');
        
        // In development mode, auto-authenticate when accessing admin
        if (view.startsWith('admin') && !user && isDevelopmentMode) {
            // Set mock user for development mode
            const mockUser: User = {
                id: 'dev-user-123',
                email: 'developer@example.com',
                name: 'Developer'
            };
            setUser(mockUser);
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">🔧 Development Mode: Auto-authenticating...</p>
                    </div>
                </div>
            );
        }
        
        // For production mode, require login for admin
        if (view.startsWith('admin') && !user && !isDevelopmentMode) {
             return <LoginPage navigateTo={navigateTo} />;
        }

        // If viewing a public portfolio by username
        if (publicUsername) {
            if (view === 'caseStudy' && selectedCaseStudy) {
                return <CaseStudyPage caseStudy={selectedCaseStudy} navigateTo={navigateTo} />;
            }
            return <PublicPortfolioPage username={publicUsername} navigateTo={navigateTo} />;
        }

        switch (view) {
            case 'home':
                return <HomePage navigateTo={navigateTo} />;
            case 'caseStudy':
                return selectedCaseStudy ? <CaseStudyPage caseStudy={selectedCaseStudy} navigateTo={navigateTo} /> : <HomePage navigateTo={navigateTo} />;
            case 'blog':
                return <BlogListPage navigateTo={navigateTo} isAuthenticated={!!user} />;
            case 'blogPost':
                return selectedBlogPost ? <BlogPostPage post={selectedBlogPost} navigateTo={navigateTo} isAuthenticated={!!user} /> : <BlogListPage navigateTo={navigateTo} isAuthenticated={!!user} />;
            case 'admin':
                return <AdminPage navigateTo={navigateTo} />;
            case 'login':
                 return <LoginPage navigateTo={navigateTo} />;
            default:
                return <HomePage navigateTo={navigateTo} />;
        }
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
                <DevelopmentBanner />
                {renderContent()}
                <DevModeDebug />
            </div>
        </AuthContext.Provider>
    );
};

export default App;
