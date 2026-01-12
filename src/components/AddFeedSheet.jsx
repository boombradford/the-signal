import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFeedSync } from '../hooks/useFeedSync';
import { useCategories } from '../hooks/useDatabase';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Popular feed suggestions with SVG icons
const SUGGESTED_FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
  { name: 'A List Apart', url: 'https://alistapart.com/main/feed/' },
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
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 1V21M1 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  loading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  rss: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
};

export default function AddFeedSheet({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const focusTrapRef = useFocusTrap(true);
  const { subscribeFeed } = useFeedSync();
  const { categories } = useCategories();

  const handleSubmit = async (feedUrl = url) => {
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

    const result = await subscribeFeed(normalizedUrl, selectedCategory);

    setLoading(false);

    if (result.success) {
      setSuccess(`Added "${result.feed.title}" with ${result.articleCount} articles`);
      setUrl('');
      onSuccess?.(); // Refresh feeds list
      setTimeout(onClose, 1500);
    } else {
      setError(result.error);
    }
  };

  const handleSuggestionClick = (feed) => {
    setUrl(feed.url);
    handleSubmit(feed.url);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="ios-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        ref={focusTrapRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="ios-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-feed-title"
        tabIndex={-1}
      >
        <div className="ios-sheet-handle" />

        <div className="px-4 pb-4 overflow-y-auto max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="add-feed-title" className="font-display font-bold text-[22px] text-label">
              Add Feed
            </h2>
            <button
              onClick={onClose}
              className="ios-button -mr-2"
              aria-label="Cancel adding feed"
            >
              Cancel
            </button>
          </div>

          {/* URL Input */}
          <div className="mb-4">
            <label htmlFor="feed-url" className="ios-list-header block mb-1">
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
                className="ios-textfield pr-10"
                autoFocus
                disabled={loading}
                aria-describedby={error ? 'feed-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
              />
              {url && !loading && (
                <button
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-secondary p-1"
                  aria-label="Clear URL"
                >
                  {Icons.close}
                </button>
              )}
            </div>
          </div>

          {/* Category selector */}
          {categories.length > 0 && (
            <fieldset className="mb-4">
              <legend className="ios-list-header block mb-1">Category (optional)</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-[var(--color-tint)] text-white'
                      : 'bg-[var(--color-fill)] text-label-secondary'
                  }`}
                  role="radio"
                  aria-checked={selectedCategory === null}
                >
                  None
                </button>
                {categories.map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[var(--color-tint)] text-white'
                        : 'bg-[var(--color-fill)] text-label-secondary'
                    }`}
                    role="radio"
                    aria-checked={selectedCategory === cat.id}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              id="feed-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)] text-[14px]"
              role="alert"
            >
              {error}
            </motion.div>
          )}

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 text-[var(--color-success)] text-[14px] flex items-center gap-2"
              role="status"
            >
              {Icons.check}
              {success}
            </motion.div>
          )}

          {/* Submit button */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !url.trim()}
            className="ios-button ios-button-filled w-full mb-6 disabled:opacity-50"
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
          </button>

          {/* Suggestions */}
          <div>
            <p className="ios-list-header" id="popular-feeds-label">Popular Feeds</p>
            <ul className="ios-list-group" aria-labelledby="popular-feeds-label">
              {SUGGESTED_FEEDS.map((feed) => (
                <li key={feed.url}>
                  <button
                    onClick={() => handleSuggestionClick(feed)}
                    disabled={loading}
                    className="ios-list-item w-full text-left gap-3 disabled:opacity-50"
                  >
                    <span className="text-label-secondary" aria-hidden="true">
                      {Icons.rss}
                    </span>
                    <span className="flex-1 font-display text-label">{feed.name}</span>
                    <span className="text-label-tertiary" aria-hidden="true">
                      {Icons.add}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </>
  );
}
