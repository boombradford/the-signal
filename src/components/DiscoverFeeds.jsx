/**
 * DiscoverFeeds
 * 
 * Intelligent feed discovery with personalized recommendations.
 * Premium Apple-inspired design: clean typography, subtle accents, no decoration.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { easeApple, easeOut, springQuick, triggerHaptic } from '../utils/animations';

const SUGGESTIONS_API = '/api/suggestions';

// Category icons - minimal SF Symbols-inspired line icons
const CategoryIcons = {
  technology: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  tech: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  artificial_intelligence: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
      <path d="M12 12v10M8 22h8" />
      <path d="M6 8h.01M18 8h.01" />
    </svg>
  ),
  finance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  ),
  science: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v6l-4 8h14l-4-8V3" />
      <path d="M9 3h6" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  world: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  politics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M4 21V10l8-6 8 6v11" />
      <rect x="9" y="13" width="6" height="8" />
    </svg>
  ),
  culture: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  health: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  sports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0 0 20" />
      <path d="M2 12h20" />
      <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10" />
    </svg>
  ),
  newsletters: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  ),
  default: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
};

const TYPE_LABELS = {
  'personalized': 'For You',
  'recommended': 'Recommended',
  'discovery': 'Popular',
  'explore': 'Explore'
};

export default function DiscoverFeeds({
  currentFeeds = [],
  readHistory = [],
  savedArticles = [],
  onSubscribe,
  onClose
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
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
          readHistory: readHistory.slice(-50),
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
      setError('Unable to load suggestions');
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
      setSuggestions(prev => prev.filter(s => s.url !== feed.url));
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setSubscribing(null);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'personalized') return s.type === 'personalized' || s.type === 'recommended';
    if (filter === 'discovery') return s.type === 'discovery' || s.type === 'explore';
    return true;
  });

  const getCategoryIcon = (category) => {
    const key = category?.toLowerCase().replace(/\s+/g, '_');
    return CategoryIcons[key] || CategoryIcons.default;
  };

  const formatCategory = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'General';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[var(--color-background)]"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-separator)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-[28px] text-label"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 500,
                  letterSpacing: '-0.02em'
                }}
              >
                Discover
              </h1>
              {patterns && patterns.articleCount > 0 && (
                <p className="text-[13px] text-label-tertiary mt-0.5">
                  Personalized from {patterns.articleCount} articles read
                </p>
              )}
            </div>
            <motion.button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05, backgroundColor: 'var(--color-fill-secondary)' }}
              initial="rest"
              transition={springQuick}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-fill)] text-label-secondary transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-8 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Reading Interests - Premium animated pills */}
        {patterns && patterns.topCategories?.length > 0 && (
          <section className="py-6 border-b border-[var(--color-separator)]">
            <p className="text-[11px] font-medium text-label-tertiary uppercase tracking-wider mb-3">
              Your Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {patterns.topCategories.map((category, index) => (
                <motion.span
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-label cursor-default relative overflow-hidden transition-colors hover:bg-[var(--color-fill-secondary)]"
                  style={{
                    background: 'var(--color-fill)',
                    border: '1px solid var(--color-separator)',
                  }}
                >
                  <motion.span
                    className="text-label-secondary relative z-10"
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getCategoryIcon(category)}
                  </motion.span>
                  <span className="relative z-10">{formatCategory(category)}</span>
                </motion.span>
              ))}
            </div>
          </section>
        )}

        {/* Filter Tabs - Premium iOS Segmented Control */}
        <div className="flex items-center justify-between py-4">
          <div
            className="relative inline-flex p-1 rounded-[10px]"
            style={{
              background: 'rgba(118, 118, 128, 0.12)',
            }}
          >
            {/* Animated pill indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-[8px]"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 0 0 0.5px rgba(255, 255, 255, 0.1)',
              }}
              initial={false}
              animate={{
                x: filter === 'all' ? 0 : filter === 'personalized' ? 52 : 128,
                width: filter === 'all' ? 48 : filter === 'personalized' ? 72 : 68,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
                mass: 0.8
              }}
            />

            {[
              { key: 'all', label: 'All' },
              { key: 'personalized', label: 'For You' },
              { key: 'discovery', label: 'Explore' }
            ].map(tab => (
              <motion.button
                key={tab.key}
                onClick={() => {
                  if (tab.key !== filter) {
                    triggerHaptic('selection');
                    setFilter(tab.key);
                  }
                }}
                whileTap={{ scale: 0.97 }}
                className="relative z-10 px-3 py-[6px] text-[13px] font-semibold transition-colors duration-200"
                style={{
                  letterSpacing: '-0.01em',
                  color: filter === tab.key ? 'var(--color-label)' : 'var(--color-label-secondary)',
                  minWidth: tab.key === 'all' ? '48px' : tab.key === 'personalized' ? '72px' : '68px',
                }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={() => {
              triggerHaptic('light');
              fetchSuggestions();
            }}
            disabled={loading}
            whileTap={{ scale: 0.95 }}
            transition={springQuick}
            className="px-3 py-2 text-[15px] font-medium text-[var(--color-tint)] hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ letterSpacing: '-0.01em' }}
          >
            Refresh
          </motion.button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-fill-secondary)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-fill)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-[var(--color-fill)]" />
                    <div className="h-3 w-2/3 rounded bg-[var(--color-fill)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-label-secondary mb-4">{error}</p>
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                fetchSuggestions();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springQuick}
              className="px-5 py-2.5 bg-[var(--color-tint)] text-white text-[14px] font-medium rounded-lg hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)' }}
            >
              Try Again
            </motion.button>
          </div>
        )}

        {/* Suggestions List */}
        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {filteredSuggestions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-label-secondary">No new suggestions available</p>
                  <p className="text-[13px] text-label-tertiary mt-1">
                    Keep reading to get personalized recommendations
                  </p>
                </div>
              ) : (
                filteredSuggestions.map((feed, index) => (
                  <motion.div
                    key={feed.url}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ delay: index * 0.03, ...easeApple }}
                    className="group"
                  >
                    <div className="group/feed flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--color-fill-secondary)] transition-colors">
                      {/* Category Icon */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          className="relative w-10 h-10 rounded-lg flex items-center justify-center text-label-secondary"
                          style={{
                            background: 'var(--color-fill)',
                          }}
                          whileHover={{
                            background: 'var(--color-fill-secondary)',
                            color: 'var(--color-tint)',
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {getCategoryIcon(feed.category)}
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-medium text-label truncate"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                          >
                            {feed.name}
                          </h3>
                          <span className="flex-shrink-0 text-[11px] font-medium text-label-tertiary uppercase tracking-wide">
                            {TYPE_LABELS[feed.type] || 'Suggested'}
                          </span>
                        </div>
                        <p className="text-[13px] text-label-secondary line-clamp-1 mb-1">
                          {feed.description}
                        </p>
                        <p className="text-[12px] text-label-tertiary">
                          {feed.reason}
                        </p>
                      </div>

                      {/* Subscribe Button */}
                      <div className="relative flex-shrink-0">
                        <motion.button
                          onClick={() => {
                            triggerHaptic('medium');
                            handleSubscribe(feed);
                          }}
                          disabled={subscribing === feed.url}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          transition={springQuick}
                          className="relative px-4 py-2 text-white text-[13px] font-medium rounded-lg disabled:opacity-50 flex items-center gap-1.5 overflow-hidden"
                          style={{
                            background: 'var(--color-tint)',
                            boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)'
                          }}
                        >
                          {subscribing === feed.url ? (
                            <motion.svg
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="relative z-10"
                            >
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </motion.svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="relative z-10">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          )}
                          <span className="relative z-10">Add</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
