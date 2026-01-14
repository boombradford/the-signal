import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedSync } from '../hooks/useFeedSync';
import { useCategories } from '../hooks/useDatabase';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Categorized feed suggestions
const FEED_CATEGORIES = [
  {
    id: 'tech',
    name: 'Tech & AI',
    color: '#007AFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    feeds: [
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
      { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    color: '#34C759',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    feeds: [
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
      { name: 'Financial Times', url: 'https://www.ft.com/rss/home' },
      { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance' },
      { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/' },
    ]
  },
  {
    id: 'world',
    name: 'World News',
    color: '#FF9500',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    feeds: [
      { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=world' },
      { name: 'AP News', url: 'https://rsshub.app/apnews/topics/world-news' },
      { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
      { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    ]
  },
  {
    id: 'science',
    name: 'Science',
    color: '#AF52DE',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 3h6v11l5 7H4l5-7V3z" />
        <path d="M9 3h6" />
      </svg>
    ),
    feeds: [
      { name: 'Nature', url: 'https://www.nature.com/nature.rss' },
      { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml' },
      { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home/' },
      { name: 'Quanta Magazine', url: 'https://api.quantamagazine.org/feed/' },
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#FF3B30',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
      </svg>
    ),
    feeds: [
      { name: 'Variety', url: 'https://variety.com/feed/' },
      { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/' },
      { name: 'Entertainment Weekly', url: 'https://ew.com/feed/' },
      { name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-news/rss' },
    ]
  },
  {
    id: 'design',
    name: 'Design & Dev',
    color: '#5856D6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    feeds: [
      { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/' },
      { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
      { name: 'A List Apart', url: 'https://alistapart.com/main/feed/' },
      { name: 'Codrops', url: 'https://tympanus.net/codrops/feed/' },
    ]
  }
];

// Icon components
const Icons = {
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06z" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  add: (
    <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 1V21M1 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  loading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  rss: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
};

import { springGentle, springTactile, triggerHaptic } from '../utils/animations';

const springTransition = {
  type: 'spring',
  damping: 30,
  stiffness: 350,
  mass: 0.9
};

export default function AddFeedSheet({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [selectedDbCategory, setSelectedDbCategory] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const focusTrapRef = useFocusTrap(true);
  const { subscribeFeed } = useFeedSync();
  const { categories } = useCategories();

  const handleSubmit = async (feedUrl = url) => {
    triggerHaptic('medium');
    if (!feedUrl.trim()) {
      setError('Please enter a feed URL');
      return;
    }

    // Normalize URL
    let normalizedUrl = feedUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setLoading(true);
    setError(null);

    const result = await subscribeFeed(normalizedUrl, selectedDbCategory);

    setLoading(false);

    if (result.success) {
      setSuccess(`Added "${result.feed.title}" with ${result.articleCount} articles`);
      setUrl('');
      onSuccess?.();
      setTimeout(onClose, 1500);
    } else {
      setError(result.error);
    }
  };

  const handleSuggestionClick = async (feed) => {
    triggerHaptic('medium');
    setLoadingFeed(feed.url);
    setError(null);

    const result = await subscribeFeed(feed.url, selectedDbCategory);

    setLoadingFeed(null);

    if (result.success) {
      setSuccess(`Added "${result.feed.title}" with ${result.articleCount} articles`);
      onSuccess?.();
      setTimeout(onClose, 1500);
    } else {
      setError(result.error);
    }
  };

  const toggleCategory = (categoryId) => {
    triggerHaptic('selection');
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[199] bg-black/50 backdrop-blur-md"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Sheet - Premium glass styling */}
      <motion.div
        ref={focusTrapRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={springTransition}
        className="fixed bottom-0 left-0 right-0 z-[200] rounded-t-3xl max-h-[90vh] overflow-hidden"
        style={{
          background: 'rgba(15, 15, 18, 0.92)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -10px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-feed-title"
        tabIndex={-1}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-fill-secondary)]" />
        </div>

        <div className="px-5 pb-8 overflow-y-auto max-h-[calc(90vh-24px)] hide-scrollbar">
          {/* Header - Premium style */}
          <div className="flex items-center justify-between mb-6">
            <h2
              id="add-feed-title"
              className="text-[24px] text-label"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.025em'
              }}
            >
              Add Feed
            </h2>
            <motion.button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              whileTap={{ scale: 0.95 }}
              transition={springTactile}
              className="px-4 py-2 text-[15px] font-medium text-[var(--color-tint)] rounded-lg hover:bg-[var(--color-fill)] transition-colors"
              style={{ letterSpacing: '-0.016em' }}
              aria-label="Cancel adding feed"
            >
              Cancel
            </motion.button>
          </div>

          {/* URL Input - Premium styling */}
          <div className="mb-6">
            <label
              htmlFor="feed-url"
              className="block text-[11px] font-semibold text-label-tertiary mb-2 uppercase"
              style={{ letterSpacing: '0.06em' }}
            >
              Feed URL
            </label>
            <div className="relative">
              <input
                id="feed-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://example.com/feed.xml"
                className="w-full h-12 px-4 pr-12 text-[15px] text-label rounded-xl outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  letterSpacing: '-0.016em'
                }}
                autoFocus
                disabled={loading}
                aria-describedby={error ? 'feed-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.border = '1px solid var(--color-tint)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {url && !loading && (
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    setUrl('');
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={springTactile}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-secondary p-1 transition-colors"
                  aria-label="Clear URL"
                >
                  {Icons.close}
                </motion.button>
              )}
            </div>
          </div>

          {/* Category selector */}
          {categories.length > 0 && (
            <fieldset className="mb-5">
              <legend className="block text-xs font-medium text-label-secondary mb-2 uppercase tracking-wide">
                Assign to category
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                <motion.button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedDbCategory(null);
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={springTactile}
                  className={`glass-pill transition-all ${
                    selectedDbCategory === null ? 'glass-pill-active' : ''
                  }`}
                  role="radio"
                  aria-checked={selectedDbCategory === null}
                >
                  None
                </motion.button>
                {categories.map(cat => (
                  <motion.button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedDbCategory(cat.id);
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={springTactile}
                    className={`glass-pill transition-all ${
                      selectedDbCategory === cat.id ? 'glass-pill-active' : ''
                    }`}
                    role="radio"
                    aria-checked={selectedDbCategory === cat.id}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                id="feed-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 p-4 rounded-2xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm flex items-center gap-2"
                role="status"
              >
                {Icons.check}
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            onClick={() => handleSubmit()}
            disabled={loading || !url.trim()}
            className="glass-button-primary w-full mb-8"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            aria-busy={loading}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
                aria-hidden="true"
              >
                {Icons.loading}
              </motion.span>
            ) : (
              'Add Feed'
            )}
            {loading && <span className="sr-only">Adding feed...</span>}
          </motion.button>

          {/* Categorized Suggestions */}
          <div>
            <p className="text-xs font-medium text-label-secondary mb-3 uppercase tracking-wide">
              Discover Feeds
            </p>

            <div className="space-y-2">
              {FEED_CATEGORIES.map((category) => (
                <div key={category.id} className="glass-card rounded-2xl overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-fill)] transition-colors"
                    aria-expanded={expandedCategory === category.id}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}15`, color: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="text-left">
                        <span className="font-display font-semibold text-label block">
                          {category.name}
                        </span>
                        <span className="text-xs text-label-tertiary">
                          {category.feeds.length} feeds
                        </span>
                      </div>
                    </div>
                    <motion.span
                      animate={{ rotate: expandedCategory === category.id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-label-tertiary"
                    >
                      {Icons.chevron}
                    </motion.span>
                  </button>

                  {/* Expanded feeds list */}
                  <AnimatePresence>
                    {expandedCategory === category.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--color-separator)]">
                          {category.feeds.map((feed, index) => (
                            <motion.button
                              key={feed.url}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => handleSuggestionClick(feed)}
                              disabled={loadingFeed !== null}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-fill)] transition-colors disabled:opacity-50 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-label-secondary" aria-hidden="true">
                                  {Icons.rss}
                                </span>
                                <span className="font-display text-label">{feed.name}</span>
                              </div>
                              {loadingFeed === feed.url ? (
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="text-[var(--color-tint)]"
                                >
                                  {Icons.loading}
                                </motion.span>
                              ) : (
                                <span className="text-label-tertiary" aria-hidden="true">
                                  {Icons.add}
                                </span>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
