import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SimpleHeader } from './Header';
import SummaryCard from './SummaryCard';
import { useArticles, useSettings } from '../hooks/useDatabase';
import { useSummary } from '../hooks/useSummary';
import { useHighlights } from '../hooks/useHighlights';
import { formatRelativeTime } from '../utils/rss';
import { estimateReadingTime } from '../utils/ai';
import { getArticleImageUrl } from '../utils/imageProxy';
import { triggerHaptic, springQuick, springSheet, easeApple, easeOut } from '../utils/animations';

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
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

// Premium iOS-style transition
const articleViewTransition = {
  initial: { x: '100%', opacity: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    transition: springSheet
  },
  exit: {
    x: '25%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
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
  const { highlights, addHighlight, deleteHighlight } = useHighlights(article.id);
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !contentRef.current?.contains(sel.anchorNode)) {
        setSelection(null);
        return;
      }
      
      const text = sel.toString().trim();
      if (text.length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({ 
          text, 
          top: rect.top,
          left: rect.left,
          width: rect.width
        });
      } else {
        setSelection(null);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('mouseup', handleSelectionChange);
      container.addEventListener('keyup', handleSelectionChange);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleSelectionChange);
        container.removeEventListener('keyup', handleSelectionChange);
      }
    };
  }, []);
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

    // Subtle haptic feedback when completing article
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

  // Detect if content is HN-style metadata
  const isHNContent = (content) => {
    return content && (
      content.includes('Article URL:') ||
      content.includes('Comments URL:') ||
      (content.includes('Points:') && content.includes('# Comments:'))
    );
  };

  // Parse HN metadata from content
  const parseHNMetadata = (content) => {
    const metadata = {};
    const articleUrlMatch = content.match(/Article URL:\s*(https?:\/\/[^\s]+)/);
    const commentsUrlMatch = content.match(/Comments URL:\s*(https?:\/\/[^\s]+)/);
    const pointsMatch = content.match(/Points:\s*(\d+)/);
    const commentsMatch = content.match(/#\s*Comments:\s*(\d+)/);

    if (articleUrlMatch) metadata.articleUrl = articleUrlMatch[1];
    if (commentsUrlMatch) metadata.commentsUrl = commentsUrlMatch[1];
    if (pointsMatch) metadata.points = parseInt(pointsMatch[1], 10);
    if (commentsMatch) metadata.comments = parseInt(commentsMatch[1], 10);

    // Get any text before the URLs (the actual content/description)
    const textContent = content
      .replace(/Article URL:.*$/m, '')
      .replace(/Comments URL:.*$/m, '')
      .replace(/Points:.*$/m, '')
      .replace(/#\s*Comments:.*$/m, '')
      .trim();

    if (textContent && textContent.length > 10) {
      metadata.description = textContent;
    }

    return metadata;
  };

  const getCleanContent = () => {
    const content = article.content || article.description || '';
    if (!content) return '';

    // Don't process HN content through this path
    if (isHNContent(content)) return '';

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

  // Get HN metadata if applicable
  const hnMetadata = isHNContent(article.content || article.description || '')
    ? parseHNMetadata(article.content || article.description || '')
    : null;

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
            whileTap={{ scale: 0.95 }}
            transition={springQuick}
            className="p-2 -mr-2 text-[var(--color-label-secondary)] hover:text-[var(--color-label)] transition-colors"
          >
            {Icons.more}
          </motion.button>
        }
      />

      {/* Reading Progress Indicator */}
      <div
        className="fixed left-0 right-0 z-[51] h-[2px] bg-transparent overflow-hidden"
        style={{ top: 'calc(44px + env(safe-area-inset-top))' }}
      >
        <motion.div
          className="h-full origin-left"
          style={{
            width: progressWidth,
            background: readingProgress >= 95 ? '#30D158' : 'var(--color-tint)',
          }}
        />
      </div>

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
                {/* Summary tab */}
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowOriginal(false);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={springQuick}
                  className="px-4 py-2 text-[15px] font-medium rounded-lg transition-colors"
                  style={{
                    letterSpacing: '-0.016em',
                    background: !showOriginal ? 'var(--color-tint)' : 'transparent',
                    color: !showOriginal ? 'white' : 'var(--color-label-secondary)',
                  }}
                >
                  Summary
                </motion.button>
                {/* Full Article tab */}
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowOriginal(true);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={springQuick}
                  className="px-4 py-2 text-[15px] font-medium rounded-lg transition-colors"
                  style={{
                    letterSpacing: '-0.016em',
                    background: showOriginal ? 'var(--color-tint)' : 'transparent',
                    color: showOriginal ? 'white' : 'var(--color-label-secondary)',
                  }}
                >
                  Full Article
                </motion.button>
              </div>
            </div>
          )}

          {/* Hero Image - Clean presentation */}
          {showOriginal && article.thumbnail && (
            <motion.figure
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={easeApple}
              className="mb-10 -mx-5 sm:mx-0"
            >
              <div
                className="relative overflow-hidden sm:rounded-2xl"
                style={{
                  boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.4)',
                }}
              >
                <img
                  src={getArticleImageUrl(article.thumbnail)}
                  alt={article.title}
                  className="w-full h-auto"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
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
            <>
              {/* HN-style content - elegant metadata display */}
              {hnMetadata && (
                <div className="space-y-6">
                  {/* Description if available */}
                  {hnMetadata.description && (
                    <p
                      className="text-[17px] text-[var(--color-label-secondary)] leading-relaxed"
                      style={{ letterSpacing: '-0.016em' }}
                    >
                      {hnMetadata.description}
                    </p>
                  )}

                  {/* Engagement metrics */}
                  {(hnMetadata.points !== undefined || hnMetadata.comments !== undefined) && (
                    <div className="flex items-center gap-3">
                      {hnMetadata.points !== undefined && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(255, 149, 0, 0.1)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-[14px] font-medium text-[#FF9500]">
                            {hnMetadata.points} points
                          </span>
                        </div>
                      )}
                      {hnMetadata.comments !== undefined && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(10, 132, 255, 0.1)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-tint)" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className="text-[14px] font-medium text-[var(--color-tint)]">
                            {hnMetadata.comments} comments
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div className="space-y-2">
                    {hnMetadata.commentsUrl && (
                      <motion.a
                        href={hnMetadata.commentsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--color-separator)] hover:bg-[var(--color-fill)] transition-colors"
                      >
                        <span className="text-[15px] text-[var(--color-label)]" style={{ letterSpacing: '-0.016em' }}>
                          View Discussion
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-label-tertiary)" strokeWidth="1.5">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </motion.a>
                    )}
                  </div>
                </div>
              )}

              {/* Regular content */}
              {!hnMetadata && (
                <div
                  className="reading-content"
                  dangerouslySetInnerHTML={{
                    __html: getCleanContent() || '<p class="text-[var(--color-label-secondary)]">No content available. Open the original article to read more.</p>'
                  }}
                />
              )}
            </>
          )}

          {/* Highlights */}
          {showOriginal && highlights.length > 0 && (
            <div className="mb-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-semibold text-label">Highlights</h3>
                <button
                  onClick={() => {
                    const md = highlights.map(h => `> ${h.text}`).join('\n\n');
                    navigator.clipboard.writeText(`# ${article.title}\nSource: ${article.link}\n\n${md}`);
                    triggerHaptic('success');
                  }}
                  className="text-[13px] text-[var(--color-tint)] font-medium hover:opacity-80 transition-opacity"
                >
                  Export Markdown
                </button>
              </div>
              {highlights.map(h => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-[rgba(255,214,10,0.1)] border border-[rgba(255,214,10,0.2)] relative group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD60A] rounded-l-xl opacity-50" />
                  <p className="text-[15px] leading-relaxed text-label-secondary pl-2">
                    {h.text}
                  </p>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      deleteHighlight(h.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 text-label-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Read more - Premium with animated gradient border */}
          <div className="mt-12 pt-8 border-t border-[var(--color-separator)]">
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                handleOpenOriginal();
              }}
              whileTap={{ scale: 0.98 }}
              transition={springQuick}
              className="w-full py-4 text-[17px] font-semibold text-white rounded-xl transition-colors"
              style={{
                letterSpacing: '-0.022em',
                background: 'var(--color-tint)',
              }}
            >
              Read Original Article
            </motion.button>
          </div>
        </article>
      </div>

      {/* Bottom action bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex items-center justify-around py-2.5 px-6 max-w-md mx-auto">
          {/* Save button */}
          <motion.button
            onClick={() => {
              triggerHaptic(isSaved ? 'light' : 'success');
              handleSave();
            }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            className="flex flex-col items-center gap-1 py-2 px-5 rounded-xl transition-colors"
            style={{
              background: isSaved ? 'var(--color-tint)' : 'transparent',
              color: isSaved ? 'white' : 'var(--color-label-tertiary)',
            }}
          >
            {Icons.bookmark(isSaved)}
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '0.02em'
              }}
            >
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </motion.button>

          {/* Summarize button */}
          <motion.button
            onClick={() => {
              triggerHaptic('medium');
              handleSummarize();
            }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            className="flex flex-col items-center gap-1 py-2 px-5 rounded-xl transition-colors"
            disabled={summaryLoading}
            style={{
              background: hasSummary ? 'rgba(191, 90, 242, 0.15)' : 'transparent',
              color: hasSummary ? '#BF5AF2' : 'var(--color-label-tertiary)',
            }}
          >
            {summaryLoading ? (
              <motion.span
                className="inline-block"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                {Icons.loading}
              </motion.span>
            ) : (
              Icons.summarize
            )}
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '0.02em'
              }}
            >
              {hasSummary ? 'Summarized' : 'Summarize'}
            </span>
          </motion.button>

          {/* Share button */}
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              handleShare();
            }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            className="flex flex-col items-center gap-1 py-2 px-5 rounded-xl text-label-tertiary hover:text-[var(--color-tint)] hover:bg-white/5 transition-colors"
          >
            {Icons.share}
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '0.02em'
              }}
            >
              Share
            </span>
          </motion.button>

          {/* Open Original button */}
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              handleOpenOriginal();
            }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            className="flex flex-col items-center gap-1 py-2 px-5 rounded-xl text-label-tertiary hover:text-[#30D158] hover:bg-white/5 transition-colors"
          >
            {Icons.external}
            <span
              className="text-[10px] font-semibold"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '0.02em'
              }}
            >
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
              transition={springSheet}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[var(--color-background-elevated)] rounded-t-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="w-9 h-1 bg-[var(--color-fill-secondary)] rounded-full mx-auto mt-2" />
              <div className="p-4 space-y-1">
                <motion.button
                  className="w-full py-4 text-left text-[17px] rounded-xl px-4 flex items-center gap-3 text-label hover:bg-white/5 transition-colors"
                  style={{ letterSpacing: '-0.022em' }}
                  whileTap={{ scale: 0.99 }}
                  transition={springQuick}
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowActions(false);
                  }}
                >
                  <span className="text-label-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                  </span>
                  <span>Mark as Unread</span>
                </motion.button>
                <motion.button
                  className="w-full py-4 text-left text-[17px] rounded-xl px-4 flex items-center gap-3 text-label hover:bg-white/5 transition-colors"
                  style={{ letterSpacing: '-0.022em' }}
                  whileTap={{ scale: 0.99 }}
                  transition={springQuick}
                  onClick={async () => {
                    triggerHaptic('success');
                    await navigator.clipboard.writeText(article.link);
                    setShowActions(false);
                  }}
                >
                  <span className="text-label-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </span>
                  <span>Copy Link</span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    setShowActions(false);
                  }}
                  whileTap={{ scale: 0.99 }}
                  transition={springQuick}
                  className="w-full mt-3 py-4 text-center text-[17px] font-medium rounded-xl text-label-secondary hover:text-label hover:bg-white/5 transition-colors"
                  style={{
                    letterSpacing: '-0.022em',
                    border: '1px solid var(--color-separator)'
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Text Selection Menu */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={springQuick}
            className="fixed z-[200] flex items-center gap-1 p-1 rounded-xl shadow-xl"
            style={{
              top: Math.max(10, selection.top - 50),
              left: Math.max(10, Math.min(window.innerWidth - 140, selection.left + (selection.width / 2) - 60)),
              background: 'rgba(30, 30, 32, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <button
              onClick={() => {
                triggerHaptic('success');
                addHighlight(selection.text);
                setSelection(null);
                window.getSelection().removeAllRanges();
              }}
              className="px-3 py-1.5 text-[13px] font-semibold text-white hover:text-[var(--color-tint)] transition-colors"
            >
              Highlight
            </button>
            <div className="w-px h-4 bg-white/20" />
             <button
              onClick={() => {
                triggerHaptic('light');
                setSelection(null);
                window.getSelection().removeAllRanges();
              }}
              className="px-2 py-1.5 text-[13px] font-medium text-label-tertiary hover:text-white transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
