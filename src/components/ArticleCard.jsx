import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/rss';

// Icons
const Icons = {
  unread: (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  ),
  saved: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  ai: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  chevron: (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
      <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
};

// Estimate reading time from content
function estimateReadTime(content) {
  if (!content) return null;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes < 1 ? '< 1 min' : `${minutes} min`;
}

export default function ArticleCard({ article, feedTitle, onClick }) {
  const isRead = article.isRead;
  const hasSummary = article.summaryStatus === 'completed';
  const readTime = estimateReadTime(article.content || article.description);

  return (
    <motion.article
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`ios-card cursor-pointer transition-opacity ${
        isRead ? 'opacity-70' : ''
      }`}
      role="article"
      aria-label={`${article.title}${isRead ? ', read' : ', unread'}${article.isSaved ? ', saved' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex gap-3 p-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Feed info & metadata */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[13px] text-label-secondary font-medium truncate max-w-[150px]">
              {feedTitle}
            </span>
            <span className="text-[13px] text-label-tertiary" aria-label={`Published ${formatRelativeTime(article.pubDate)}`}>
              {formatRelativeTime(article.pubDate)}
            </span>
            {readTime && (
              <span className="flex items-center gap-1 text-[12px] text-label-tertiary">
                {Icons.clock}
                <span>{readTime}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-display font-semibold text-[17px] leading-snug mb-1.5 line-clamp-2 ${
              isRead ? 'text-label-secondary' : 'text-label'
            }`}
          >
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-[15px] text-label-secondary leading-relaxed line-clamp-2">
              {article.description}
            </p>
          )}

          {/* Footer with status indicators */}
          <div className="flex items-center gap-3 mt-2.5">
            {/* Author */}
            {article.author && (
              <span className="text-[13px] text-label-tertiary">
                by {article.author}
              </span>
            )}

            {/* Status indicators */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Unread indicator */}
              {!isRead && (
                <span className="text-[var(--color-tint)]" aria-label="Unread">
                  {Icons.unread}
                </span>
              )}

              {/* Saved indicator */}
              {article.isSaved && (
                <span className="text-[var(--color-warning)]" aria-label="Saved">
                  {Icons.saved}
                </span>
              )}

              {/* Has AI summary indicator */}
              {hasSummary && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--color-info)] font-medium" aria-label="AI summary available">
                  {Icons.ai}
                  <span>AI</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="w-20 h-20 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-fill)]">
            <img
              src={article.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary" aria-hidden="true">
        {Icons.chevron}
      </div>
    </motion.article>
  );
}
