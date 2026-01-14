import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/rss';
import { AVAILABLE_TAGS } from '../hooks/useAI';
import { springTactile, springMicro, triggerHaptic } from '../utils/animations';
import { getThumbnailUrl } from '../utils/imageProxy';

/**
 * ArticleCard - Premium editorial card with Apple-style typography
 *
 * Design principles:
 * - SF Pro system font with precise letter-spacing
 * - Clean hierarchy through weight and size
 * - Generous whitespace
 * - Subtle interactions
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

  // Premium tap handler with haptic feedback
  const handleTap = useCallback(() => {
    triggerHaptic('selection');
    onClick();
  }, [onClick]);

  return (
    <motion.article
      onClick={handleTap}
      initial={{ opacity: 0, y: isCompact ? 8 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springMicro}
      whileHover={{
        y: -2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{
        scale: 0.98,
        y: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }}
      className={`group cursor-pointer rounded-2xl ${isRead ? 'opacity-50' : ''} ${
        isCompact ? 'py-2.5 px-2.5 -mx-2.5' : 'py-4 px-3 -mx-3'
      }`}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTap();
        }
      }}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      <div className={`flex ${isCompact ? 'gap-3' : 'gap-4'}`}>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            {!isRead && (
              <motion.span
                className="text-[var(--color-tint)] relative"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <span
                  className="absolute inset-0 rounded-full blur-sm bg-[var(--color-tint)]"
                  style={{ opacity: 0.6 }}
                />
                {Icons.unread}
              </motion.span>
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

          {/* Description - only in comfortable mode */}
          {!isCompact && article.description && (
            <p
              className="text-[15px] text-[var(--color-label-secondary)] leading-[1.4] line-clamp-2 mb-2"
              style={{ letterSpacing: '-0.016em' }}
            >
              {article.description}
            </p>
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
              <span className="text-[var(--color-tint)] ml-auto">
                {Icons.saved}
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail - different sizes based on density */}
        {article.thumbnail && (
          <motion.div
            className={`flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-fill)] ${
              isCompact ? 'w-[60px] h-[60px]' : 'w-[88px] h-[88px]'
            }`}
            whileHover={{ scale: 1.02 }}
            transition={springTactile}
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 0.5px rgba(255, 255, 255, 0.06)'
            }}
          >
            <img
              src={getThumbnailUrl(article.thumbnail)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.article>
  );
});

export default ArticleCard;

// Premium shimmer skeleton with Apple-style gradient animation
export function ArticleSkeleton({ density = 'comfortable' }) {
  const isCompact = density === 'compact';
  
  return (
    <motion.div
      className={isCompact ? 'py-2.5' : 'py-4'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex ${isCompact ? 'gap-3' : 'gap-4'}`}>
        <div className="flex-1 min-w-0">
          {/* Meta skeleton */}
          <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <div className="h-1.5 w-1.5 bg-[var(--color-fill-secondary)] rounded-full" />
            <motion.div
              className={`rounded ${isCompact ? 'h-3 w-16' : 'h-3.5 w-20'}`}
              style={{ background: 'var(--color-fill)' }}
              animate={{
                background: [
                  'rgba(118, 118, 128, 0.12)',
                  'rgba(118, 118, 128, 0.24)',
                  'rgba(118, 118, 128, 0.12)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className={`rounded ${isCompact ? 'h-3 w-10' : 'h-3.5 w-12'}`}
              style={{ background: 'var(--color-fill)' }}
              animate={{
                background: [
                  'rgba(118, 118, 128, 0.12)',
                  'rgba(118, 118, 128, 0.24)',
                  'rgba(118, 118, 128, 0.12)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
            />
          </div>
          
          {/* Title skeleton */}
          <div className={`space-y-1.5 ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <motion.div
              className={`w-full rounded ${isCompact ? 'h-4' : 'h-5'}`}
              style={{ background: 'var(--color-fill)' }}
              animate={{
                background: [
                  'rgba(118, 118, 128, 0.12)',
                  'rgba(118, 118, 128, 0.24)',
                  'rgba(118, 118, 128, 0.12)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
            {!isCompact && (
              <motion.div
                className="h-5 w-4/5 rounded"
                style={{ background: 'var(--color-fill)' }}
                animate={{
                  background: [
                    'rgba(118, 118, 128, 0.12)',
                    'rgba(118, 118, 128, 0.24)',
                    'rgba(118, 118, 128, 0.12)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
            )}
          </div>
          
          {/* Description skeleton - only comfortable mode */}
          {!isCompact && (
            <div className="space-y-1">
              <motion.div
                className="h-4 w-full rounded"
                style={{ background: 'var(--color-fill)' }}
                animate={{
                  background: [
                    'rgba(118, 118, 128, 0.12)',
                    'rgba(118, 118, 128, 0.24)',
                    'rgba(118, 118, 128, 0.12)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
              <motion.div
                className="h-4 w-3/4 rounded"
                style={{ background: 'var(--color-fill)' }}
                animate={{
                  background: [
                    'rgba(118, 118, 128, 0.12)',
                    'rgba(118, 118, 128, 0.24)',
                    'rgba(118, 118, 128, 0.12)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            </div>
          )}
        </div>
        
        {/* Thumbnail skeleton */}
        <motion.div
          className={`flex-shrink-0 rounded-xl ${isCompact ? 'w-[60px] h-[60px]' : 'w-[88px] h-[88px]'}`}
          style={{ background: 'var(--color-fill)' }}
          animate={{
            background: [
              'rgba(118, 118, 128, 0.12)',
              'rgba(118, 118, 128, 0.24)',
              'rgba(118, 118, 128, 0.12)'
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
}
