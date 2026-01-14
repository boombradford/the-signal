/**
 * QuickAddButton Component
 *
 * A floating action button for quickly adding any URL to Kevin.
 * Always visible in the nav, opens a modal for URL input.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// API endpoint - update this to your Vercel deployment
const QUICK_SAVE_API = '/api/quick-save';

export default function QuickAddButton({ onArticleSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();

      // Try to paste from clipboard
      navigator.clipboard?.readText?.().then(text => {
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
          setUrl(text);
        }
      }).catch(() => {
        // Clipboard access denied, that's fine
      });
    }
  }, [isOpen]);

  // Handle keyboard shortcut (Cmd/Ctrl + Shift + S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(QUICK_SAVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          source: 'quick-add'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const article = await response.json();

      setSuccess({
        title: article.title,
        type: article.contentType
      });

      // Callback to parent component
      if (onArticleSaved) {
        onArticleSaved(article);
      }

      // Reset after delay
      setTimeout(() => {
        setUrl('');
        setSuccess(null);
        setIsOpen(false);
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'youtube': return '🎬';
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      case 'reddit': return '🤖';
      case 'newsletter': return '📧';
      default: return '📄';
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Quick add URL"
        title="Quick Add (⌘+Shift+S)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quick Add
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Close"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4">
                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="text-4xl mb-2">
                        {getContentTypeIcon(success.type)}
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        Saved!
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {success.title}
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="Paste any URL..."
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />

                        {error && (
                          <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Supports articles, YouTube videos, tweets, and more
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <motion.svg
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </motion.svg>
                            Saving...
                          </>
                        ) : (
                          'Save Article'
                        )}
                      </button>
                    </>
                  )}
                </form>

                {/* Keyboard hint */}
                {!success && (
                  <div className="px-4 pb-3 text-center">
                    <span className="text-xs text-gray-400">
                      Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to save
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
