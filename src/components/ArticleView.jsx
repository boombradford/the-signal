import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SimpleHeader } from './Header';
import SummaryCard from './SummaryCard';
import { useArticles, useSettings } from '../hooks/useDatabase';
import { useSummary } from '../hooks/useSummary';
import { formatRelativeTime } from '../utils/rss';
import { estimateReadingTime } from '../utils/ai';

// Icons
const Icons = {
  bookmark: (filled) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  share: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  ),
  external: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  ),
  loading: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  dots: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    </svg>
  ),
  toggle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
};

export default function ArticleView({ article, onClose }) {
  const contentRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [summaryStyle, setSummaryStyle] = useState('concise'); // concise, detailed, bullets

  const { toggleSaved } = useArticles();
  const { settings } = useSettings();
  const {
    summary,
    loading: summaryLoading,
    summarize,
    summarizeFromUrl,
    hasSummary,
    error: summaryError
  } = useSummary(article.id);

  // Scroll to top on mount
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [article.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'o' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenOriginal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async () => {
    await toggleSaved(article.id);
  };

  const handleSummarize = async (style = summaryStyle) => {
    try {
      if (article.content && article.content.length > 200) {
        await summarize(article.content, { style });
      } else {
        await summarizeFromUrl(article.link, { style });
      }
    } catch (err) {
      console.error('Summary failed:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: article.link
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(article.link);
    }
  };

  const handleOpenOriginal = () => {
    window.open(article.link, '_blank', 'noopener');
  };

  const readingTime = article.content
    ? estimateReadingTime(article.content)
    : null;

  // Sanitize and clean content - removes XSS vectors and duplicate images
  const getCleanContent = () => {
    const content = article.content || article.description || '';
    if (!content) return '';

    // Sanitize HTML to prevent XSS attacks
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
                     'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
                     'img', 'figure', 'figcaption', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
      ADD_ATTR: ['target'], // Allow target attribute for links
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    if (!article.thumbnail) return sanitized;

    // Create a temporary element to remove duplicate thumbnail
    const temp = document.createElement('div');
    temp.innerHTML = sanitized;

    // Remove the first image if it exists (likely duplicate of thumbnail)
    const firstImg = temp.querySelector('img');
    if (firstImg) {
      const imgSrc = firstImg.src || firstImg.getAttribute('src') || '';
      if (imgSrc === article.thumbnail ||
          imgSrc.includes(article.thumbnail?.split('/').pop()?.split('?')[0] || 'NOMATCH')) {
        firstImg.remove();
      } else {
        firstImg.remove();
      }
    }

    return temp.innerHTML;
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[var(--color-background)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-title"
    >
      <SimpleHeader
        title={article.feedTitle || 'Article'}
        onBack={onClose}
        rightAction={
          <button
            onClick={() => setShowActions(true)}
            className="ios-button -mr-2"
            aria-label="More options"
          >
            {Icons.dots}
          </button>
        }
      />

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="h-full overflow-y-auto hide-scrollbar pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(80px+env(safe-area-inset-bottom))]"
      >
        <article className="px-5 py-6 max-w-2xl mx-auto">
          {/* Article header */}
          <header className="mb-6">
            <h1
              id="article-title"
              className="font-display font-bold text-[28px] leading-tight text-label tracking-tight mb-4"
            >
              {article.title}
            </h1>

            <div className="flex items-center gap-3 text-[14px] text-label-secondary flex-wrap">
              {article.author && (
                <span className="font-medium">{article.author}</span>
              )}
              <span>{formatRelativeTime(article.pubDate)}</span>
              {readingTime && (
                <>
                  <span className="text-label-tertiary" aria-hidden="true">·</span>
                  <span>{readingTime}</span>
                </>
              )}
            </div>
          </header>

          {/* AI Summary Section */}
          <section aria-labelledby="summary-heading" className="mb-6">
            <SummaryCard
              summary={summary}
              loading={summaryLoading}
              error={summaryError}
              hasSummary={hasSummary}
              onGenerate={() => handleSummarize()}
              summaryStyle={summaryStyle}
              onStyleChange={setSummaryStyle}
              onRegenerateWithStyle={(style) => handleSummarize(style)}
              articleTitle={article.title}
              elevenLabsApiKey={settings?.elevenLabsApiKey}
            />
          </section>

          {/* View toggle for summary vs original */}
          {hasSummary && (
            <div className="flex items-center justify-between mb-4 p-3 bg-[var(--color-fill)] rounded-[var(--radius-md)]">
              <span className="text-sm font-medium text-label">View</span>
              <div className="flex gap-1" role="tablist">
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
                    !showOriginal
                      ? 'bg-[var(--color-tint)] text-white'
                      : 'text-label-secondary hover:bg-[var(--color-fill-secondary)]'
                  }`}
                  role="tab"
                  aria-selected={!showOriginal}
                >
                  Summary Only
                </button>
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${
                    showOriginal
                      ? 'bg-[var(--color-tint)] text-white'
                      : 'text-label-secondary hover:bg-[var(--color-fill-secondary)]'
                  }`}
                  role="tab"
                  aria-selected={showOriginal}
                >
                  Full Article
                </button>
              </div>
            </div>
          )}

          {/* Featured image */}
          {showOriginal && article.thumbnail && (
            <div className="mb-6 -mx-5 sm:mx-0 sm:rounded-[var(--radius-lg)] overflow-hidden">
              <img
                src={article.thumbnail}
                alt=""
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Article content */}
          {showOriginal && (
            <div
              className="reading-content"
              dangerouslySetInnerHTML={{
                __html: getCleanContent() || '<p>No content available. Open the original article to read more.</p>'
              }}
            />
          )}

          {/* Read more link */}
          <div className="mt-8 pt-6 border-t border-[var(--color-separator)]">
            <button
              onClick={handleOpenOriginal}
              className="ios-button ios-button-filled w-full gap-2"
            >
              Read Original Article
              {Icons.external}
            </button>
            <p className="text-center text-xs text-label-tertiary mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-[var(--color-fill)] rounded text-[11px] font-mono">Cmd+O</kbd> to open
            </p>
          </div>
        </article>
      </div>

      {/* Bottom action bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-[var(--material-regular)] backdrop-blur-[20px] border-t border-[var(--color-separator)] safe-bottom"
        aria-label="Article actions"
      >
        <div className="flex items-center justify-around py-3 px-4">
          <button
            onClick={handleSave}
            className={`ios-button flex-col gap-0.5 ${article.isSaved ? 'text-[var(--color-warning)]' : ''}`}
            aria-label={article.isSaved ? 'Remove from saved' : 'Save article'}
            aria-pressed={article.isSaved}
          >
            {Icons.bookmark(article.isSaved)}
            <span className="text-[11px]">{article.isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => handleSummarize()}
            className="ios-button flex-col gap-0.5"
            disabled={summaryLoading}
            aria-label={hasSummary ? 'Regenerate AI summary' : 'Generate AI summary'}
            aria-busy={summaryLoading}
          >
            {summaryLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              >
                {Icons.loading}
              </motion.span>
            ) : (
              Icons.ai
            )}
            <span className="text-[11px]">{hasSummary ? 'Resummarize' : 'Summarize'}</span>
          </button>

          <button
            onClick={handleShare}
            className="ios-button flex-col gap-0.5"
            aria-label="Share article"
          >
            {Icons.share}
            <span className="text-[11px]">Share</span>
          </button>

          <button
            onClick={handleOpenOriginal}
            className="ios-button flex-col gap-0.5"
            aria-label="Open original article in new tab"
          >
            {Icons.external}
            <span className="text-[11px]">Open</span>
          </button>
        </div>
      </nav>

      {/* Actions sheet */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ios-sheet-backdrop"
              onClick={() => setShowActions(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="ios-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Article options"
            >
              <div className="ios-sheet-handle" />
              <div className="px-4 pb-4">
                <nav aria-label="Article options">
                  <ul className="ios-list-group">
                    <li>
                      <button className="ios-list-item w-full text-left gap-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="flex-1 text-label">Mark as Unread</span>
                      </button>
                    </li>
                    <li>
                      <button
                        className="ios-list-item w-full text-left gap-3"
                        onClick={async () => {
                          await navigator.clipboard.writeText(article.link);
                          setShowActions(false);
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span className="flex-1 text-label">Copy Link</span>
                      </button>
                    </li>
                  </ul>
                </nav>

                <button
                  onClick={() => setShowActions(false)}
                  className="ios-button ios-button-filled w-full mt-3"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
