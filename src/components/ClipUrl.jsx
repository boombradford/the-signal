import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy, springTactile, easeOut, triggerHaptic } from '../utils/animations';
import { articleOperations } from '../utils/db';

// Icons
const Icons = {
  clip: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  loading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  link: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  back: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  globe: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
};

export default function ClipUrl({ isOpen, onClose, onClipSaved }) {
  const inputRef = useRef(null);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, preview, saving, success, error
  const [scrapedData, setScrapedData] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [error, setError] = useState(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setUrl('');
      setStatus('idle');
      setScrapedData(null);
      setEditedTitle('');
      setError(null);
    }
  }, [isOpen]);

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setUrl(text);
      }
    } catch {
      // Clipboard access denied
    }
  };

  const handleScrape = async () => {
    if (!url || status === 'loading') return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch article');
      }

      const articleData = await response.json();
      setScrapedData(articleData);
      setEditedTitle(articleData.title || '');
      setStatus('preview');

    } catch (err) {
      console.error('Scrape error:', err);
      setError(err.message || 'Failed to fetch article');
      setStatus('error');
    }
  };

  const handleSave = async () => {
    if (!scrapedData) return;

    setStatus('saving');

    try {
      // Use edited title
      const articleToSave = {
        ...scrapedData,
        title: editedTitle || scrapedData.title
      };

      const savedArticle = await articleOperations.saveClip(articleToSave);

      setStatus('success');

      if (onClipSaved) {
        onClipSaved(savedArticle);
      }

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save article');
      setStatus('error');
    }
  };

  const handleBack = () => {
    setStatus('idle');
    setScrapedData(null);
    setEditedTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && status === 'idle') {
      handleScrape();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={easeOut}
            className="fixed inset-0 z-[200] bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={springGentle}
            className="fixed inset-x-4 top-[10%] z-[201] rounded-3xl overflow-hidden max-w-md mx-auto max-h-[80vh] flex flex-col"
            style={{
              background: 'rgba(12, 12, 14, 0.92)',
              backdropFilter: 'blur(80px) saturate(200%)',
              WebkitBackdropFilter: 'blur(80px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06) inset'
            }}
          >
            {/* Header - Premium with haptic */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-separator)]">
              <div className="flex items-center gap-3">
                {status === 'preview' && (
                  <motion.button
                    onClick={() => {
                      triggerHaptic('light');
                      handleBack();
                    }}
                    whileTap={{ scale: 0.9, x: -2 }}
                    transition={springTactile}
                    className="p-1 -ml-1 text-label-secondary hover:text-label transition-colors"
                  >
                    {Icons.back}
                  </motion.button>
                )}
                <span className="text-[var(--color-tint)]">{Icons.clip}</span>
                <h2
                  className="text-[19px] text-label"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {status === 'preview' ? 'Preview' : 'Clip Article'}
                </h2>
              </div>
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                whileTap={{ scale: 0.9 }}
                transition={springTactile}
                className="p-2 text-label-tertiary hover:text-label-secondary transition-colors"
              >
                {Icons.close}
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springSnappy}
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(50, 215, 75, 0.15)',
                      color: 'var(--color-success)'
                    }}
                  >
                    {Icons.check}
                  </motion.div>
                  <h3
                    className="text-[18px] text-label mb-2"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', fontWeight: 500 }}
                  >
                    Saved to Library
                  </h3>
                  <p className="text-[14px] text-label-secondary line-clamp-2">
                    {editedTitle}
                  </p>
                </motion.div>

              ) : status === 'preview' && scrapedData ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springGentle}
                >
                  {/* Thumbnail */}
                  {scrapedData.thumbnail && (
                    <div
                      className="w-full h-40 rounded-2xl overflow-hidden mb-4"
                      style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <img
                        src={scrapedData.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Source */}
                  <div className="flex items-center gap-2 mb-3 text-[12px] text-label-tertiary">
                    <span className="text-label-secondary">{Icons.globe}</span>
                    <span>{scrapedData.siteName}</span>
                    {scrapedData.author && (
                      <>
                        <span className="opacity-50">·</span>
                        <span>{scrapedData.author}</span>
                      </>
                    )}
                  </div>

                  {/* Editable Title */}
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full text-[18px] text-label bg-transparent border-none outline-none mb-3 leading-snug"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 500,
                      letterSpacing: '-0.01em'
                    }}
                    placeholder="Article title..."
                  />

                  {/* Description */}
                  {scrapedData.description && (
                    <p
                      className="text-[14px] text-label-secondary leading-relaxed mb-4 line-clamp-3"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                    >
                      {scrapedData.description}
                    </p>
                  )}

                  {/* Key Points */}
                  {scrapedData.keyPoints?.length > 0 && (
                    <div
                      className="p-4 rounded-xl mb-4"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3 text-[12px] text-[var(--color-tint)] font-medium">
                        {Icons.list}
                        <span>Key Points</span>
                      </div>
                      <ul className="space-y-2">
                        {scrapedData.keyPoints.slice(0, 4).map((point, i) => (
                          <li
                            key={i}
                            className="text-[13px] text-label-secondary leading-relaxed pl-3 border-l-2 border-[var(--color-separator)]"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Category Badge */}
                  {scrapedData.category && (
                    <div className="mb-4">
                      <span
                        className="inline-block px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase text-label-secondary rounded-lg"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {scrapedData.category}
                      </span>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] text-[var(--color-error)] mb-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Save Button - Premium with haptic */}
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleSave();
                    }}
                    disabled={status === 'saving'}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="w-full h-12 text-[15px] font-medium text-white bg-[var(--color-tint)] rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
                  >
                    {status === 'saving' ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          {Icons.loading}
                        </motion.span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        {Icons.check}
                        <span>Save to Library</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>

              ) : (
                <>
                  <p
                    className="text-[14px] text-label-secondary mb-4 leading-relaxed"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    Paste any article URL. We'll extract the content, key points, and save it to your library.
                  </p>

                  {/* URL Input */}
                  <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary">
                      {Icons.link}
                    </div>
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="https://example.com/article"
                      className="w-full h-12 pl-12 pr-4 text-[15px] text-label bg-[var(--color-fill)] border border-[var(--color-separator)] rounded-xl placeholder:text-label-tertiary outline-none focus:border-[var(--color-tint)] transition-colors"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Paste from clipboard button - Premium with haptic */}
                  <motion.button
                    onClick={() => {
                      triggerHaptic('light');
                      handlePaste();
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="w-full py-2.5 mb-4 text-[13px] text-label-secondary border border-[var(--color-separator)] rounded-lg hover:bg-[var(--color-fill)] transition-colors"
                  >
                    Paste from Clipboard
                  </motion.button>

                  {/* Error message */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] text-[var(--color-error)] mb-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Fetch button - Premium with haptic */}
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleScrape();
                    }}
                    disabled={!url || status === 'loading'}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="w-full h-11 text-[15px] font-medium text-white bg-[var(--color-tint)] rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
                  >
                    {status === 'loading' ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          {Icons.loading}
                        </motion.span>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        {Icons.list}
                        <span>Fetch Article</span>
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Small clip button for header - Premium with haptic
export function ClipButton({ onClick }) {
  return (
    <motion.button
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      whileTap={{ scale: 0.9 }}
      transition={springTactile}
      className="p-2 text-label-secondary hover:text-label transition-colors"
      aria-label="Clip article from URL"
    >
      {Icons.clip}
    </motion.button>
  );
}
