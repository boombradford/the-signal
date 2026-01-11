import { motion } from 'framer-motion';
import { useUnreadCount, useCategories } from '../hooks/useDatabase';

function FeedItem({ feed, isSelected, onClick }) {
  const unreadCount = useUnreadCount(feed.id);

  return (
    <button
      onClick={onClick}
      className={`ios-list-item w-full text-left gap-3 ${
        isSelected ? 'bg-[var(--color-fill-tertiary)]' : ''
      }`}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`${feed.title}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      {/* Favicon */}
      <div className="w-8 h-8 rounded-ios bg-fill flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
        {feed.faviconUrl ? (
          <img
            src={feed.faviconUrl}
            alt=""
            className="w-5 h-5"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-label-tertiary">
            <path d="M4 11a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="5" cy="19" r="1.5" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span className="flex-1 truncate font-display text-[16px] text-label">
        {feed.title}
      </span>

      {/* Unread count */}
      {unreadCount > 0 && (
        <span className="ios-badge bg-[var(--color-tint)]" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Chevron */}
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-label-tertiary" aria-hidden="true">
        <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function FeedSidebar({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onClose,
  onAddFeed
}) {
  const totalUnread = useUnreadCount();
  const { categories } = useCategories();

  // Group feeds by category
  const uncategorizedFeeds = feeds.filter(f => !f.category);
  const categorizedFeeds = categories.map(cat => ({
    ...cat,
    feeds: feeds.filter(f => f.category === cat.id)
  })).filter(cat => cat.feeds.length > 0);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 z-50 w-[300px] bg-[var(--color-background-secondary)] safe-top safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-label="Feed navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-separator">
          <h2 className="font-display font-bold text-[22px] text-label">Feeds</h2>
          <button
            onClick={onClose}
            className="ios-button -mr-2"
            aria-label="Close feed navigation"
          >
            Done
          </button>
        </div>

        {/* Scroll area */}
        <nav className="overflow-y-auto h-[calc(100%-60px)]" aria-label="Feed list">
          {/* All Articles */}
          <div className="ios-list-group mt-4 mx-4">
            <button
              onClick={() => onSelectFeed(null)}
              className={`ios-list-item w-full text-left gap-3 ${
                selectedFeedId === null ? 'bg-[var(--color-fill-tertiary)]' : ''
              }`}
              aria-current={selectedFeedId === null ? 'true' : undefined}
              aria-label={`All Articles${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
            >
              <div className="w-8 h-8 rounded-ios bg-[var(--color-tint)] flex items-center justify-center" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1.5" fill="white" />
                </svg>
              </div>
              <span className="flex-1 font-display font-medium text-[16px] text-label">
                All Articles
              </span>
              {totalUnread > 0 && (
                <span className="ios-badge" aria-hidden="true">{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </button>
          </div>

          {/* Uncategorized feeds */}
          {uncategorizedFeeds.length > 0 && (
            <div className="mt-4 mx-4">
              <p className="ios-list-header" id="feeds-section">Feeds</p>
              <div className="ios-list-group" role="list" aria-labelledby="feeds-section">
                {uncategorizedFeeds.map(feed => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    isSelected={selectedFeedId === feed.id}
                    onClick={() => onSelectFeed(feed.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Categorized feeds */}
          {categorizedFeeds.map(category => (
            <div key={category.id} className="mt-4 mx-4">
              <p className="ios-list-header" id={`category-${category.id}`}>{category.name}</p>
              <div className="ios-list-group" role="list" aria-labelledby={`category-${category.id}`}>
                {category.feeds.map(feed => (
                  <FeedItem
                    key={feed.id}
                    feed={feed}
                    isSelected={selectedFeedId === feed.id}
                    onClick={() => onSelectFeed(feed.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Add feed button */}
          <div className="p-4 mt-4">
            <button
              onClick={() => {
                onClose();
                setTimeout(onAddFeed, 300);
              }}
              className="w-full p-3 rounded-ios-lg border-2 border-dashed border-separator
                         flex items-center justify-center gap-2 text-label-secondary
                         hover:border-[var(--color-tint)] hover:text-[var(--color-tint)]
                         transition-colors"
              aria-label="Add new feed"
            >
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M11 1V21M1 11H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="font-display font-medium">Add Feed</span>
            </button>
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
