import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadCount, useCategories } from '../hooks/useDatabase';
import { springGentle, springTactile, triggerHaptic } from '../utils/animations';

function FeedItem({ feed, isSelected, onClick, onDelete }) {
  const unreadCount = useUnreadCount(feed.id);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (confirm(`Delete "${feed.title}"? This will also remove all its articles.`)) {
      onDelete(feed.id);
    }
    setShowDelete(false);
  };

  return (
    <div className="relative group">
      <motion.button
        onClick={() => {
          triggerHaptic('selection');
          onClick();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerHaptic('light');
          setShowDelete(!showDelete);
        }}
        whileTap={{ scale: 0.98 }}
        transition={springTactile}
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

        {/* Title - with proper truncation */}
        <span
          className="flex-1 truncate text-[15px] text-label"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.016em',
            minWidth: 0,
          }}
        >
          {feed.title}
        </span>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span
            className="ios-badge bg-[var(--color-tint)]"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Delete button (visible on hover) */}
        <motion.button
          onClick={handleDelete}
          whileTap={{ scale: 0.9 }}
          transition={springTactile}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-label-tertiary hover:text-[#FF453A] hover:bg-red-500/10 transition-all"
          aria-label={`Delete ${feed.title}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
          </svg>
        </motion.button>

        {/* Chevron */}
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-label-tertiary group-hover:hidden" aria-hidden="true">
          <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </div>
  );
}

export default function FeedSidebar({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onClose,
  onAddFeed,
  onDeleteFeed
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Sidebar - Premium glass styling */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={springGentle}
        className="fixed left-0 top-0 bottom-0 z-50 w-[300px] safe-top safe-bottom"
        style={{
          background: 'rgba(10, 10, 12, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '0.5px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '10px 0 40px rgba(0, 0, 0, 0.4)'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Feed navigation"
      >
        {/* Header - Premium styling */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <h2
            className="text-[22px] text-label"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.024em'
            }}
          >
            Feeds
          </h2>
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            whileTap={{ scale: 0.95 }}
            transition={springTactile}
            className="text-[17px] font-medium px-2 -mr-2 text-[var(--color-tint)]"
            style={{ letterSpacing: '-0.022em' }}
            aria-label="Close feed navigation"
          >
            Done
          </motion.button>
        </div>

        {/* Scroll area */}
        <nav className="overflow-y-auto h-[calc(100%-60px)]" aria-label="Feed list">
          {/* All Articles */}
          <div className="ios-list-group mt-4 mx-4">
            <motion.button
              onClick={() => {
                triggerHaptic('selection');
                onSelectFeed(null);
              }}
              whileTap={{ scale: 0.98 }}
              transition={springTactile}
              className={`ios-list-item w-full text-left gap-3 ${
                selectedFeedId === null ? 'bg-[var(--color-fill-tertiary)]' : ''
              }`}
              aria-current={selectedFeedId === null ? 'true' : undefined}
              aria-label={`All Articles${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
            >
              <div className="w-8 h-8 rounded-ios flex items-center justify-center bg-[var(--color-tint)]" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1.5" fill="white" />
                </svg>
              </div>
              <span
                className="flex-1 text-[15px] text-label"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  fontWeight: 500,
                  letterSpacing: '-0.016em',
                }}
              >
                All Articles
              </span>
              {totalUnread > 0 && (
                <span
                  className="ios-badge bg-[var(--color-tint)]"
                  aria-hidden="true"
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </motion.button>
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
                    onDelete={onDeleteFeed}
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
                    onDelete={onDeleteFeed}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Add feed button - Premium with animated gradient border */}
          <div className="p-4 mt-4">
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
                setTimeout(onAddFeed, 300);
              }}
              whileTap={{ scale: 0.98 }}
              transition={springTactile}
              className="w-full p-3 rounded-ios-lg flex items-center justify-center gap-2 text-label-secondary hover:text-[var(--color-tint)] hover:bg-white/5 transition-colors"
              style={{ border: '1px solid var(--color-separator)' }}
              aria-label="Add new feed"
            >
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M11 1V21M1 11H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="font-display font-medium">Add Feed</span>
            </motion.button>
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
