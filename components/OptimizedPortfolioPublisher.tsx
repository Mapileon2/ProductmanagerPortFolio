import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface PortfolioPublisherProps {
    onClose?: () => void;
    onOpenProfileSettings?: () => void;
}

interface PortfolioStatus {
    status: 'draft' | 'published';
    lastPublished?: string;
    version?: number;
    publicUrl?: string;
    username?: string;
}

const OptimizedPortfolioPublisher: React.FC<PortfolioPublisherProps> = ({ onClose, onOpenProfileSettings }) => {
    const [status, setStatus] = useState<PortfolioStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const portfolioStatus = await api.getPortfolioStatus();
            setStatus(portfolioStatus);
            setError(null);
        } catch (error) {
            console.error('Error loading portfolio status:', error);
            setError('Please login to manage your portfolio');
            // Set default status for non-authenticated users
            setStatus({
                status: 'draft',
                username: undefined,
                publicUrl: undefined
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            setError(null);
            setSuccess(null);
            
            const result = await api.publishPortfolio();
            
            if (result.success) {
                setSuccess('Portfolio published successfully! Your public URL is ready.');
                await loadStatus(); // Refresh status
            } else {
                setError(result.message || 'Failed to publish portfolio');
            }
        } catch (error: any) {
            console.error('Error publishing portfolio:', error);
            
            // Provide specific error messages based on the error
            if (error.message?.includes('Username required')) {
                setError('Please set up your username in Profile Settings before publishing.');
            } else if (error.message?.includes('not authenticated')) {
                setError('Please log in to publish your portfolio.');
            } else {
                setError(`Failed to publish portfolio: ${error.message}`);
            }
        } finally {
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            setPublishing(true);
            setError(null);
            setSuccess(null);
            
            const result = await api.unpublishPortfolio();
            
            if (result.success) {
                setSuccess('Portfolio unpublished successfully!');
                await loadStatus(); // Refresh status
            } else {
                setError(result.message || 'Failed to unpublish portfolio');
            }
        } catch (error) {
            console.error('Error unpublishing portfolio:', error);
            setError('Failed to unpublish portfolio');
        } finally {
            setPublishing(false);
        }
    };

    const copyUrl = () => {
        if (status?.publicUrl) {
            navigator.clipboard.writeText(status.publicUrl);
            setSuccess('URL copied to clipboard!');
            setTimeout(() => setSuccess(null), 2000);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Portfolio Publisher
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                    )}
                </div>
                
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading portfolio status...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Portfolio Publisher
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage your portfolio visibility and public access
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
            )}

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                            status?.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                Status: {status?.status === 'published' ? 'Live' : 'Draft'}
                            </p>
                            {status?.lastPublished && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Last published: {new Date(status.lastPublished).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {status?.status === 'published' && status.publicUrl && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyUrl}
                                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                Copy URL
                            </button>
                            <button
                                onClick={() => window.open(status.publicUrl, '_blank')}
                                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Visit
                            </button>
                        </div>
                    )}
                </div>
                
                {status?.publicUrl && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Public URL:</p>
                        <p className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
                            {status.publicUrl}
                        </p>
                    </div>
                )}
            </div>

            {/* Username Setup */}
            {!status?.username && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                Username Required for Publishing
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                                You need to set up your username before you can publish your portfolio. This will be your public URL.
                            </p>
                            <button
                                onClick={() => {
                                    if (onOpenProfileSettings) {
                                        onOpenProfileSettings();
                                    } else {
                                        // Fallback: try to find and click the profile settings button
                                        const profileButton = document.querySelector('[data-profile-settings-btn]') as HTMLButtonElement;
                                        if (profileButton) {
                                            profileButton.click();
                                        } else {
                                            alert('Please close this dialog and click "Manage Profile" in the admin dashboard to set your username.');
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-all shadow-sm hover:shadow-md"
                            >
                                Go to Profile Settings →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                {status?.status === 'published' ? (
                    <div className="flex-1 relative group">
                        <button
                            onClick={handleUnpublish}
                            disabled={publishing || !status?.username}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            {publishing ? 'Unpublishing...' : 'Unpublish Portfolio'}
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 relative group">
                        <button
                            onClick={handlePublish}
                            disabled={publishing || !status?.username}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            {publishing ? 'Publishing...' : 'Publish Portfolio'}
                        </button>
                        {(!status?.username && !publishing) && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Set username to publish
                            </div>
                        )}
                    </div>
                )}
                
                <button
                    onClick={loadStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Publishing your portfolio</strong> makes it publicly accessible at your custom URL. 
                    Only published case studies will be visible to visitors.
                </p>
            </div>
        </div>
    );
};

export default OptimizedPortfolioPublisher;