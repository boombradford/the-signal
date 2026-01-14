import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SimpleHeader } from './Header';
import SummaryCard from './SummaryCard';
import { useArticles, useSettings } from '../hooks/useDatabase';
import { useSummary } from '../hooks/useSummary';
import { formatRelativeTime } from '../utils/rss';
import { estimateReadingTime } from '../utils/ai';
import { getArticleImageUrl } from '../utils/imageProxy';
import { triggerHaptic, springGentle, springTactile } from '../utils/animations';

/**
 * ArticleView - Premium reading experience with Apple typography
 *
 * Design principles:
 * - Generous whitespace
 * - Optimal line length for reading
 * - Clear visual hierarchy
 * - Subtle, purposeful interactions
 * - iOS-style slide-in transition
 */

// Icons - 1.5px stroke
const Icons = {
  bookmark: (filled) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  ),
  summarize: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  share: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  external: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  loading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  more: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
};

// iOS-style transition for article view
const articleViewTransition = {
  initial: { x: '100%', opacity: 0.8 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 35,
      mass: 1
    }
  },
  exit: { 
    x: '30%', 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export default function ArticleView({ article, onClose, onLogoClick }) {
  const contentRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [summaryStyle, setSummaryStyle] = useState('concise');
  const [isSaved, setIsSaved] = useState(article.isSaved);
  const [readingProgress, setReadingProgress] = useState(0);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);

  // Smooth spring animation for progress bar
  const progressSpring = useSpring(0, { stiffness: 100, damping: 30 });
  const progressWidth = useTransform(progressSpring, [0, 100], ['0%', '100%']);

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

  // Track scroll progress
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight <= 0) {
      setReadingProgress(100);
      progressSpring.set(100);
      return;
    }

    const progress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
    setReadingProgress(progress);
    progressSpring.set(progress);

    // Haptic feedback when completing article
    if (progress >= 95 && !hasCompletedReading) {
      setHasCompletedReading(true);
      triggerHaptic('success');
    }
  }, [progressSpring, hasCompletedReading]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      setReadingProgress(0);
      progressSpring.set(0);
      setHasCompletedReading(false);
    }
  }, [article.id, progressSpring]);

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
    setIsSaved(!isSaved);
    try {
      await toggleSaved(article.id);
    } catch (err) {
      setIsSaved(isSaved);
      console.error('Failed to save article:', err);
    }
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

  const getCleanContent = () => {
    const content = article.content || article.description || '';
    if (!content) return '';

    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
                     'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
                     'img', 'figure', 'figcaption', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    if (!article.thumbnail) return sanitized;

    const temp = document.createElement('div');
    temp.innerHTML = sanitized;

    const firstImg = temp.querySelector('img');
    if (firstImg) {
      firstImg.remove();
    }

    return temp.innerHTML;
  };

  return (
    <motion.div
      initial={articleViewTransition.initial}
      animate={articleViewTransition.animate}
      exit={articleViewTransition.exit}
      className="fixed inset-0 z-50 bg-[var(--color-background)]"
    >
      <SimpleHeader
        title={article.feedTitle || 'Article'}
        onBack={onClose}
        onLogoClick={onLogoClick}
        rightAction={
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              setShowActions(true);
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="p-2 -mr-2 text-[var(--color-label-secondary)] hover:text-[var(--color-label)] transition-colors"
          >
            {Icons.more}
          </motion.button>
        }
      />

      {/* Reading Progress Indicator - elegant thin line with celebration */}
      <div
        className="fixed left-0 right-0 z-[51] h-[2px] bg-transparent"
        style={{ top: 'calc(44px + env(safe-area-inset-top))' }}
      >
        <motion.div
          className="h-full origin-left"
          style={{
            width: progressWidth,
            background: readingProgress >= 95
              ? 'linear-gradient(90deg, var(--color-tint), var(--color-success))'
              : 'var(--color-tint)'
          }}
          animate={readingProgress >= 95 ? {
            boxShadow: [
              '0 0 8px rgba(52, 199, 89, 0.4)',
              '0 0 16px rgba(52, 199, 89, 0.6)',
              '0 0 8px rgba(52, 199, 89, 0.4)'
            ]
          } : {
            boxShadow: readingProgress > 0 ? '0 0 8px rgba(10, 132, 255, 0.4)' : 'none'
          }}
          transition={readingProgress >= 95 ? {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          } : {}}
        />
      </div>

      {/* Reading Completion Celebration */}
      <AnimatePresence>
        {hasCompletedReading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
            style={{ top: 'calc(60px + env(safe-area-inset-top))' }}
          >
            <motion.div
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                background: 'rgba(52, 199, 89, 0.15)',
                border: '1px solid rgba(52, 199, 89, 0.3)',
                backdropFilter: 'blur(20px)'
              }}
              animate={{
                boxShadow: [
                  '0 4px 16px rgba(52, 199, 89, 0.2)',
                  '0 8px 24px rgba(52, 199, 89, 0.3)',
                  '0 4px 16px rgba(52, 199, 89, 0.2)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
              <span
                className="text-[13px] font-medium text-[var(--color-success)]"
                style={{ letterSpacing: '-0.008em' }}
              >
                Article Complete
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={contentRef}
        className="h-full overflow-y-auto hide-scrollbar scroll-smooth pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(80px+env(safe-area-inset-bottom))]"
      >
        <article className="px-5 py-10 max-w-[680px] mx-auto">
          {/* Article header */}
          <header className="mb-10">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[13px] text-[var(--color-label-secondary)]"
                style={{ letterSpacing: '-0.008em' }}
              >
                {article.feedTitle}
              </span>
              <span className="text-[var(--color-label-tertiary)]">·</span>
              <span
                className="text-[13px] text-[var(--color-label-tertiary)]"
                style={{ letterSpacing: '-0.008em' }}
              >
                {formatRelativeTime(article.pubDate)}
              </span>
              {readingTime && (
                <>
                  <span className="text-[var(--color-label-tertiary)]">·</span>
                  <span
                    className="text-[13px] text-[var(--color-label-tertiary)]"
                    style={{ letterSpacing: '-0.008em' }}
                  >
                    {readingTime}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-[28px] md:text-[34px] font-bold text-[var(--color-label)] leading-[1.1] mb-4"
              style={{ letterSpacing: '-0.032em' }}
            >
              {article.title}
            </h1>

            {/* Author */}
            {article.author && (
              <p
                className="text-[15px] text-[var(--color-label-secondary)]"
                style={{ letterSpacing: '-0.016em' }}
              >
                By {article.author}
              </p>
            )}
          </header>

          {/* AI Summary Section */}
          <section className="mb-10">
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
            />
          </section>

          {/* View toggle */}
          {hasSummary && (
            <div className="flex items-center justify-between mb-8 py-4 border-y border-[var(--color-separator)]">
              <span
                className="text-[15px] text-[var(--color-label-secondary)]"
                style={{ letterSpacing: '-0.016em' }}
              >
                View
              </span>
              <div className="flex gap-1">
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowOriginal(false);
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`px-4 py-2 text-[15px] font-medium rounded-lg transition-colors ${
                    !showOriginal
                      ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                      : 'text-[var(--color-label-secondary)] hover:text-[var(--color-label)]'
                  }`}
                  style={{ letterSpacing: '-0.016em' }}
                >
                  Summary
                </motion.button>
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowOriginal(true);
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`px-4 py-2 text-[15px] font-medium rounded-lg transition-colors ${
                    showOriginal
                      ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                      : 'text-[var(--color-label-secondary)] hover:text-[var(--color-label)]'
                  }`}
                  style={{ letterSpacing: '-0.016em' }}
                >
                  Full Article
                </motion.button>
              </div>
            </div>
          )}

          {/* Hero Image - Prominent Apple-style presentation */}
          {showOriginal && article.thumbnail && (
            <motion.figure
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-10 -mx-5 sm:mx-0"
            >
              <div
                className="relative overflow-hidden sm:rounded-2xl"
                style={{
                  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Subtle gradient overlay for depth */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.15) 100%)',
                  }}
                />
                <motion.img
                  src={getArticleImageUrl(article.thumbnail)}
                  alt={article.title}
                  className="w-full h-auto"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
              {/* Optional caption styling */}
              {article.imageCaption && (
                <figcaption
                  className="mt-3 text-center text-[13px] text-[var(--color-label-tertiary)] px-5"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    letterSpacing: '-0.008em',
                  }}
                >
                  {article.imageCaption}
                </figcaption>
              )}
            </motion.figure>
          )}

          {/* Article content */}
          {showOriginal && (
            <div
              className="reading-content"
              dangerouslySetInnerHTML={{
                __html: getCleanContent() || '<p class="text-[var(--color-label-secondary)]">No content available. Open the original article to read more.</p>'
              }}
            />
          )}

          {/* Read more */}
          <div className="mt-12 pt-8 border-t border-[var(--color-separator)]">
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                handleOpenOriginal();
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-full py-4 text-[17px] font-medium text-[var(--color-tint)] border border-[var(--color-separator)] rounded-xl hover:bg-[var(--color-fill)] transition-colors"
              style={{ letterSpacing: '-0.022em' }}
            >
              Read Original Article
            </motion.button>
          </div>
        </article>
      </div>

      {/* Bottom action bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-[var(--color-background)] border-t border-[var(--color-separator)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around py-3 px-6 max-w-md mx-auto">
          <motion.button
            onClick={() => {
              triggerHaptic(isSaved ? 'light' : 'success');
              handleSave();
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
              isSaved ? 'text-[var(--color-label)]' : 'text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)]'
            }`}
          >
            {Icons.bookmark(isSaved)}
            <span className="text-[11px] font-medium" style={{ letterSpacing: '0.01em' }}>
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              triggerHaptic('medium');
              handleSummarize();
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)] transition-colors"
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                {Icons.loading}
              </motion.span>
            ) : (
              Icons.summarize
            )}
            <span className="text-[11px] font-medium" style={{ letterSpacing: '0.01em' }}>
              {hasSummary ? 'Resummarize' : 'Summarize'}
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              triggerHaptic('light');
              handleShare();
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)] transition-colors"
          >
            {Icons.share}
            <span className="text-[11px] font-medium" style={{ letterSpacing: '0.01em' }}>
              Share
            </span>
          </motion.button>

          <motion.button
            onClick={() => {
              triggerHaptic('light');
              handleOpenOriginal();
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)] transition-colors"
          >
            {Icons.external}
            <span className="text-[11px] font-medium" style={{ letterSpacing: '0.01em' }}>
              Open
            </span>
          </motion.button>
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/40"
              onClick={() => {
                triggerHaptic('light');
                setShowActions(false);
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[var(--color-background-elevated)] rounded-t-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="w-9 h-1 bg-[var(--color-fill-secondary)] rounded-full mx-auto mt-2" />
              <div className="p-4">
                <motion.button
                  className="w-full py-4 text-left text-[17px] text-[var(--color-label)] hover:bg-[var(--color-fill)] rounded-lg px-4 transition-colors"
                  style={{ letterSpacing: '-0.022em' }}
                  whileTap={{ scale: 0.98, backgroundColor: 'var(--color-fill)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowActions(false);
                  }}
                >
                  Mark as Unread
                </motion.button>
                <motion.button
                  className="w-full py-4 text-left text-[17px] text-[var(--color-label)] hover:bg-[var(--color-fill)] rounded-lg px-4 transition-colors"
                  style={{ letterSpacing: '-0.022em' }}
                  whileTap={{ scale: 0.98, backgroundColor: 'var(--color-fill)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={async () => {
                    triggerHaptic('success');
                    await navigator.clipboard.writeText(article.link);
                    setShowActions(false);
                  }}
                >
                  Copy Link
                </motion.button>
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    setShowActions(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-full mt-2 py-4 text-center text-[17px] font-medium text-[var(--color-label-secondary)] border border-[var(--color-separator)] rounded-xl hover:bg-[var(--color-fill)] transition-colors"
                  style={{ letterSpacing: '-0.022em' }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
