import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/rss';
import { AVAILABLE_TAGS } from '../hooks/useAI';
import { springQuick, easeApple, triggerHaptic } from '../utils/animations';
import { getThumbnailUrl } from '../utils/imageProxy';

/**
 * ArticleCard - Premium editorial card with Apple-style typography
 *
 * Design principles:
 * - SF Pro system font with precise letter-spacing
 * - Clean hierarchy through weight and size
 * - Generous whitespace
 * - Subtle, purposeful interactions
 *
 * Density modes:
 * - comfortable: Full card with description, thumbnail, generous spacing
 * - compact: Tighter layout, no description, smaller thumbnail
 */

// Icons
const Icons = {
  unread: (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  ),
  saved: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
};

function estimateReadTime(content) {
  if (!content) return null;
  const words = content.split(/\\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes < 1 ? '1 min' : `${minutes} min`;
}

// Detect if content is HN-style metadata
function isHNContent(content) {
  return content && (
    content.includes('Article URL:') ||
    content.includes('Comments URL:') ||
    (content.includes('Points:') && content.includes('# Comments:'))
  );
}

// Parse HN metadata from content
function parseHNMetadata(content) {
  const pointsMatch = content.match(/Points:\s*(\d+)/);
  const commentsMatch = content.match(/#\s*Comments:\s*(\d+)/);
  return {
    points: pointsMatch ? parseInt(pointsMatch[1], 10) : null,
    comments: commentsMatch ? parseInt(commentsMatch[1], 10) : null
  };
}

// HN engagement badge icons
const HNIcons = {
  points: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  comments: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
};

const ArticleCard = memo(function ArticleCard({
  article,
  feedTitle,
  onClick,
  searchQuery,
  density = 'comfortable' // 'comfortable' | 'compact'
}) {
  const isRead = article.isRead;
  const readTime = estimateReadTime(article.content || article.description);
  const tag = article.primaryTag ? AVAILABLE_TAGS.find(t => t.id === article.primaryTag) : null;
  const isCompact = density === 'compact';

  // Detect and parse HN content
  const descriptionContent = article.content || article.description || '';
  const hasHNMetadata = isHNContent(descriptionContent);
  const hnMetadata = hasHNMetadata ? parseHNMetadata(descriptionContent) : null;

  // Premium tap handler with haptic feedback
  const handleTap = useCallback(() => {
    triggerHaptic('selection');
    onClick();
  }, [onClick]);

  return (
    <motion.article
      onClick={handleTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={easeApple}
      whileTap={{ scale: 0.99 }}
      className={`group cursor-pointer rounded-2xl relative ${isRead ? 'opacity-50' : ''} ${
        isCompact ? 'py-2.5 px-2.5 -mx-2.5' : 'py-4 px-3 -mx-3'
      } transition-all duration-200`}
      style={{
        background: 'transparent',
      }}
      whileHover={{
        backgroundColor: 'rgba(10, 132, 255, 0.04)',
        boxShadow: '0 0 0 1px rgba(10, 132, 255, 0.1), 0 4px 20px rgba(10, 132, 255, 0.08)',
      }}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTap();
        }
      }}
    >
      <div className={`flex ${isCompact ? 'gap-3' : 'gap-4'}`}>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            {!isRead && (
              <span className="text-[var(--color-tint)]">
                {Icons.unread}
              </span>
            )}
            <span
              className={`text-[var(--color-label-secondary)] truncate max-w-[140px] ${
                isCompact ? 'text-[12px]' : 'text-[13px]'
              }`}
              style={{ letterSpacing: '-0.008em' }}
            >
              {feedTitle}
            </span>
            <span className="text-[var(--color-label-tertiary)]">·</span>
            <span
              className={`text-[var(--color-label-tertiary)] ${isCompact ? 'text-[12px]' : 'text-[13px]'}`}
              style={{ letterSpacing: '-0.008em' }}
            >
              {formatRelativeTime(article.pubDate)}
            </span>
            {readTime && !isCompact && (
              <>
                <span className="text-[var(--color-label-tertiary)]">·</span>
                <span
                  className="text-[13px] text-[var(--color-label-tertiary)]"
                  style={{ letterSpacing: '-0.008em' }}
                >
                  {readTime}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-semibold leading-[1.24] ${
              isRead ? 'text-[var(--color-label-secondary)]' : 'text-[var(--color-label)]'
            } ${isCompact ? 'text-[15px] line-clamp-1 mb-0.5' : 'text-[17px] line-clamp-2 mb-1.5'}`}
            style={{ letterSpacing: '-0.022em' }}
          >
            {article.title}
          </h3>

          {/* Description or HN engagement badges */}
          {!isCompact && (
            hasHNMetadata && hnMetadata ? (
              // HN content: show elegant engagement badges
              <div className="flex items-center gap-2 mb-2">
                {hnMetadata.points !== null && hnMetadata.points > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold"
                    style={{
                      background: hnMetadata.points >= 100 ? '#FF9500' : 'rgba(255, 149, 0, 0.12)',
                      color: hnMetadata.points >= 100 ? 'white' : '#FF9500',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {HNIcons.points}
                    {hnMetadata.points}
                  </span>
                )}
                {hnMetadata.comments !== null && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold"
                    style={{
                      background: hnMetadata.comments >= 50 ? 'var(--color-tint)' : 'rgba(10, 132, 255, 0.12)',
                      color: hnMetadata.comments >= 50 ? 'white' : '#0A84FF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {HNIcons.comments}
                    {hnMetadata.comments}
                  </span>
                )}
              </div>
            ) : article.description ? (
              // Regular content: show description
              <p
                className="text-[15px] text-[var(--color-label-secondary)] leading-[1.4] line-clamp-2 mb-2"
                style={{ letterSpacing: '-0.016em' }}
              >
                {article.description}
              </p>
            ) : null
          )}

          {/* Footer */}
          <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
            {tag && (
              <span
                className={`font-medium text-[var(--color-label-tertiary)] uppercase ${
                  isCompact ? 'text-[10px]' : 'text-[11px]'
                }`}
                style={{ letterSpacing: '0.06em' }}
              >
                {tag.label}
              </span>
            )}

            {article.isSaved && (
              <motion.span
                className="ml-auto text-[var(--color-tint)]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    fill="currentColor"
                  />
                </svg>
              </motion.span>
            )}
          </div>
        </div>

        {/* Thumbnail - different sizes based on density */}
        {article.thumbnail && (
          <div
            className={`flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-fill)] ${
              isCompact ? 'w-[60px] h-[60px]' : 'w-[88px] h-[88px]'
            }`}
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 0.5px rgba(255, 255, 255, 0.06)'
            }}
          >
            <img
              src={getThumbnailUrl(article.thumbnail)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </motion.article>
  );
});

export default ArticleCard;

// Simple skeleton - no shimmer animation
export function ArticleSkeleton({ density = 'comfortable' }) {
  const isCompact = density === 'compact';

  return (
    <div className={isCompact ? 'py-2.5' : 'py-4'}>
      <div className={`flex ${isCompact ? 'gap-3' : 'gap-4'}`}>
        <div className="flex-1 min-w-0">
          {/* Meta skeleton */}
          <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <div className="h-1.5 w-1.5 bg-[var(--color-fill-secondary)] rounded-full" />
            <div className={`rounded bg-[var(--color-fill)] ${isCompact ? 'h-3 w-16' : 'h-3.5 w-20'}`} />
            <div className={`rounded bg-[var(--color-fill)] ${isCompact ? 'h-3 w-10' : 'h-3.5 w-12'}`} />
          </div>

          {/* Title skeleton */}
          <div className={`space-y-1.5 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <div className={`w-full rounded bg-[var(--color-fill)] ${isCompact ? 'h-4' : 'h-5'}`} />
            {!isCompact && (
              <div className="h-5 w-4/5 rounded bg-[var(--color-fill)]" />
            )}
          </div>

          {/* Description skeleton - only comfortable mode */}
          {!isCompact && (
            <div className="space-y-1">
              <div className="h-4 w-full rounded bg-[var(--color-fill-secondary)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--color-fill-secondary)]" />
            </div>
          )}
        </div>

        {/* Thumbnail skeleton */}
        <div
          className={`flex-shrink-0 rounded-xl bg-[var(--color-fill)] ${isCompact ? 'w-[60px] h-[60px]' : 'w-[88px] h-[88px]'}`}
        />
      </div>
    </div>
  );
}
