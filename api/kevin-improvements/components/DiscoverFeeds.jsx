/**
 * DiscoverFeeds Component
 *
 * A discovery panel for finding new RSS feeds based on:
 * - AI-powered personalized recommendations
 * - Trending/popular sources
 * - Category exploration
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// API endpoint - update to your Vercel deployment
const SUGGESTIONS_API = '/api/suggestions';

// Category icons and colors
const CATEGORY_CONFIG = {
  tech: { icon: '💻', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  ai: { icon: '🤖', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  finance: { icon: '📈', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  science: { icon: '🔬', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  world: { icon: '🌍', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  culture: { icon: '🎭', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
  newsletters: { icon: '📧', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' }
};

const TYPE_BADGES = {
  'personalized': { label: 'For You', color: 'bg-blue-500' },
  'ai-personalized': { label: 'AI Pick', color: 'bg-purple-500' },
  'discovery': { label: 'Popular', color: 'bg-green-500' },
  'explore': { label: 'Explore', color: 'bg-amber-500' }
};

export default function DiscoverFeeds({
  currentFeeds = [],
  readHistory = [],
  savedArticles = [],
  onSubscribe
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'personalized', 'discovery'
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(SUGGESTIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFeeds,
          readHistory: readHistory.slice(-50), // Last 50 articles
          savedArticles: savedArticles.slice(-30),
          mode: 'both'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setPatterns(data.patterns);

    } catch (err) {
      setError('Unable to load suggestions. Please try again.');
      console.error('Suggestions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (feed) => {
    setSubscribing(feed.url);

    try {
      if (onSubscribe) {
        await onSubscribe(feed.url, feed.category);
      }

      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.url !== feed.url));

    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setSubscribing(null);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'personalized') return s.type === 'personalized' || s.type === 'ai-personalized';
    if (filter === 'discovery') return s.type === 'discovery' || s.type === 'explore';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Discover Sources
          </h2>
          {patterns && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Based on {patterns.articleCount} articles you've read
            </p>
          )}
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Reading Insights */}
      {patterns && patterns.topCategories.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your interests
          </p>
          <div className="flex flex-wrap gap-2">
            {patterns.topCategories.map(category => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.tech;
              return (
                <span
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
                >
                  {config.icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'personalized', label: 'For You' },
          { key: 'discovery', label: 'Explore' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Suggestions List */}
      {!loading && !error && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No new suggestions available.</p>
                <p className="text-sm mt-1">Keep reading to get personalized recommendations!</p>
              </div>
            ) : (
              filteredSuggestions.map((feed, index) => {
                const categoryConfig = CATEGORY_CONFIG[feed.category] || CATEGORY_CONFIG.tech;
                const typeBadge = TYPE_BADGES[feed.type] || TYPE_BADGES.discovery;

                return (
                  <motion.div
                    key={feed.url}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${categoryConfig.color}`}>
                        {categoryConfig.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {feed.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs text-white ${typeBadge.color}`}>
                            {typeBadge.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {feed.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {feed.reason}
                        </p>
                      </div>

                      {/* Subscribe Button */}
                      <button
                        onClick={() => handleSubscribe(feed)}
                        disabled={subscribing === feed.url}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        {subscribing === feed.url ? (
                          <motion.svg
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </motion.svg>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
