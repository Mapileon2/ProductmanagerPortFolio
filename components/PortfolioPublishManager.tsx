import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Mock useAuth hook for now - you can replace this with your actual auth hook
const useAuth = () => {
    const [user, setUser] = React.useState<any>(null);
    const [profile, setProfile] = React.useState<any>(null);
    
    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                // Get profile
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                setProfile(profileData);
            }
        };
        getUser();
    }, []);
    
    return { user, profile };
};

interface PortfolioStatus {
    status: 'draft' | 'published';
    lastPublished?: string;
    version?: number;
    hasChanges?: boolean;
}

interface PortfolioPublishManagerProps {
    onClose?: () => void;
}

export const PortfolioPublishManager: React.FC<PortfolioPublishManagerProps> = ({ onClose }) => {
    const { user, profile } = useAuth();
    const [portfolioStatus, setPortfolioStatus] = useState<PortfolioStatus>({ status: 'draft' });
    const [isPublishing, setIsPublishing] = useState(false);
    const [isUnpublishing, setIsUnpublishing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState<'publish' | 'unpublish' | null>(null);

    useEffect(() => {
        if (profile?.org_id) {
            fetchPortfolioStatus();
        }
    }, [profile?.org_id]);

    const fetchPortfolioStatus = async () => {
        if (!profile?.org_id) return;

        try {
            // Get current profile status
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('portfolio_status')
                .eq('org_id', profile.org_id)
                .single();

            if (profileError) throw profileError;

            // Get latest published snapshot info
            const { data: snapshotData, error: snapshotError } = await supabase
                .from('portfolio_snapshots')
                .select('published_at, version_number')
                .eq('org_id', profile.org_id)
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(1)
                .single();

            setPortfolioStatus({
                status: profileData.portfolio_status || 'draft',
                lastPublished: snapshotData?.published_at || undefined,
                version: snapshotData?.version_number || undefined,
                hasChanges: await checkForChanges()
            });
        } catch (error) {
            console.error('Error fetching portfolio status:', error);
        }
    };

    const checkForChanges = async (): Promise<boolean> => {
        // This would compare current content with last published snapshot
        // For now, we'll assume there are always changes in draft mode
        return portfolioStatus.status === 'draft';
    };

    const handlePublish = async () => {
        if (!profile?.org_id) return;

        setIsPublishing(true);
        try {
            const { data, error } = await supabase.rpc('publish_portfolio', {
                p_org_id: profile.org_id
            });

            if (error) throw error;

            console.log('Portfolio published:', data);
            await fetchPortfolioStatus();
            setShowConfirmDialog(null);
            
            // Show success message
            alert('🎉 Portfolio published successfully! Your changes are now live.');
        } catch (error) {
            console.error('Error publishing portfolio:', error);
            alert('❌ Failed to publish portfolio. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!profile?.org_id) return;

        setIsUnpublishing(true);
        try {
            const { data, error } = await supabase.rpc('unpublish_portfolio', {
                p_org_id: profile.org_id
            });

            if (error) throw error;

            console.log('Portfolio unpublished:', data);
            await fetchPortfolioStatus();
            setShowConfirmDialog(null);
            
            // Show success message
            alert('📝 Portfolio unpublished. Your portfolio is now in draft mode.');
        } catch (error) {
            console.error('Error unpublishing portfolio:', error);
            alert('❌ Failed to unpublish portfolio. Please try again.');
        } finally {
            setIsUnpublishing(false);
        }
    };

    const getStatusColor = () => {
        switch (portfolioStatus.status) {
            case 'published':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = () => {
        switch (portfolioStatus.status) {
            case 'published':
                return '🌐';
            case 'draft':
                return '📝';
            default:
                return '❓';
        }
    };

    if (!user || !profile) return null;

    return (
        <>
            {/* Status Bar */}
            <div className="fixed top-16 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
                        {getStatusIcon()} {portfolioStatus.status.charAt(0).toUpperCase() + portfolioStatus.status.slice(1)}
                    </div>
                    {portfolioStatus.version && (
                        <span className="text-xs text-gray-500">v{portfolioStatus.version}</span>
                    )}
                </div>

                {portfolioStatus.status === 'published' && portfolioStatus.lastPublished && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Published {new Date(portfolioStatus.lastPublished).toLocaleDateString()} at{' '}
                        {new Date(portfolioStatus.lastPublished).toLocaleTimeString()}
                    </p>
                )}

                {portfolioStatus.status === 'draft' && (
                    <>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Your portfolio is in draft mode. Visitors cannot see your changes until you publish.
                        </p>
                        {profile?.username && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                                <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                                    🚀 <strong>Ready to publish:</strong> Your portfolio will be available at:
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/u/${profile.username}`}
                                        readOnly
                                        className="flex-1 text-xs bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded px-2 py-1 font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
                                            alert('📋 Future URL copied to clipboard!');
                                        }}
                                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                                        title="Copy future URL"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {portfolioStatus.hasChanges && portfolioStatus.status === 'published' && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                        ⚠️ You have unpublished changes
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {portfolioStatus.status === 'draft' ? (
                        <button
                            onClick={() => setShowConfirmDialog('publish')}
                            disabled={isPublishing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                        >
                            {isPublishing ? '🔄 Publishing...' : '🚀 Publish'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowConfirmDialog('publish')}
                                disabled={isPublishing}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                            >
                                {isPublishing ? '🔄 Updating...' : '📤 Update'}
                            </button>
                            <button
                                onClick={() => setShowConfirmDialog('unpublish')}
                                disabled={isUnpublishing}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                            >
                                {isUnpublishing ? '🔄 Unpublishing...' : '📝 Draft'}
                            </button>
                        </>
                    )}
                </div>

                {/* Public URL */}
                {portfolioStatus.status === 'published' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        {profile?.username ? (
                            <>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">🌐 Your Public Portfolio URL:</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}/u/${profile.username}`}
                                        readOnly
                                        className="flex-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
                                            alert('📋 URL copied to clipboard!');
                                        }}
                                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                                        title="Copy URL"
                                    >
                                        📋 Copy
                                    </button>
                                    <button
                                        onClick={() => {
                                            window.open(`${window.location.origin}/u/${profile.username}`, '_blank');
                                        }}
                                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                                        title="Open in new tab"
                                    >
                                        🔗 Visit
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Share this URL with employers, clients, and your network!
                                </p>
                            </>
                        ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                                    ⚠️ <strong>Username Required:</strong> You need to set up a username to get your public portfolio URL.
                                </p>
                                <button
                                    onClick={() => {
                                        // This would ideally trigger opening the profile settings
                                        alert('Please go to "Public Profile" settings to set up your username first.');
                                    }}
                                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors"
                                >
                                    Set Up Username
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Dialogs */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                        {showConfirmDialog === 'publish' ? (
                            <>
                                <h3 className="text-lg font-semibold mb-4">
                                    {portfolioStatus.status === 'draft' ? '🚀 Publish Portfolio?' : '📤 Update Published Portfolio?'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {portfolioStatus.status === 'draft' 
                                        ? 'This will make your portfolio visible to everyone at your public URL. All your current content will be published.'
                                        : 'This will update your published portfolio with all your recent changes. Visitors will see the updated version immediately.'
                                    }
                                </p>
                                {profile?.username && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                            🌐 Your portfolio will be live at:
                                        </p>
                                        <div className="bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded px-3 py-2">
                                            <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                                                {window.location.origin}/u/{profile.username}
                                            </code>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md"
                                    >
                                        {isPublishing ? 'Publishing...' : (portfolioStatus.status === 'draft' ? 'Publish' : 'Update')}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDialog(null)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold mb-4">📝 Unpublish Portfolio?</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    This will make your portfolio private. Visitors will no longer be able to see your portfolio at the public URL. You can continue editing and publish again later.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUnpublish}
                                        disabled={isUnpublishing}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md"
                                    >
                                        {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDialog(null)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default PortfolioPublishManager;