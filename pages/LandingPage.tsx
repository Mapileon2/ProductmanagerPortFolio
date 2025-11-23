
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { View } from '../types';

interface LandingPageProps {
    navigateTo: (view: View) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ navigateTo }) => {
    const [stats, setStats] = useState<{ userCount: number; publishedCount: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const systemStats = await api.getSystemStats();
                setStats(systemStats);
            } catch (error) {
                console.error('Failed to fetch system stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Header navigateTo={navigateTo} isTransparent={false} />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Showcase Your Work <br />
                            <span className="text-yellow-400">Magically</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl md:text-2xl text-blue-100 mb-10">
                            The professional portfolio builder designed for Product Managers, Designers, and Developers.
                            Simple, beautiful, and powerful.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigateTo('login')}
                                className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full shadow-lg transform transition hover:scale-105 text-lg"
                            >
                                Create Your Portfolio
                            </button>
                            <button
                                onClick={() => navigateTo('caseStudy')} // Or a demo route
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-full shadow-lg transform transition hover:scale-105 text-lg"
                            >
                                View Examples
                            </button>
                        </div>

                        {/* Stats Pill */}
                        {stats && (
                            <div className="mt-12 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 border border-white/20 animate-fade-in-up">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium">
                                    Join <span className="font-bold text-yellow-300">{stats.userCount}+</span> creators with <span className="font-bold text-yellow-300">{stats.publishedCount}+</span> published portfolios
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-white dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose This Platform?</h2>
                            <p className="text-gray-600 dark:text-gray-400">Everything you need to build a stellar presence.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="p-8 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-2xl mb-6">
                                    🚀
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">SaaS-Ready Architecture</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Separate dashboard and public profiles. Manage your content privately, publish when ready.
                                </p>
                            </div>
                            <div className="p-8 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-2xl mb-6">
                                    🤖
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI-Enhanced Writing</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Built-in AI tools help you craft compelling stories and descriptions for your projects.
                                </p>
                            </div>
                            <div className="p-8 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center text-2xl mb-6">
                                    🎨
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Beautiful Templates</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Choose from Ghibli-inspired, Modern Glass, or Classic styles to match your personality.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
