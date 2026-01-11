import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import ArticleCard from './ArticleCard';
import FeedSidebar from './FeedSidebar';
import { useFeeds, useArticles } from '../hooks/useDatabase';
import { useFeedSync } from '../hooks/useFeedSync';

// Icons
const Icons = {
  menu: (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
      <path d="M1 1H21M1 9H21M1 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  add: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 1V21M1 11H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  ),
  rss: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="2" fill="currentColor" />
    </svg>
  )
};

export default function FeedView({ onSelectArticle, onAddFeed }) {
  const scrollRef = useRef(null);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { feeds } = useFeeds();
  const { articles, markRead } = useArticles({
    feedId: selectedFeedId,
    filter: 'all'
  });
  const { syncing, syncAllFeeds, syncFeed } = useFeedSync();

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedFeedId) {
      await syncFeed(selectedFeedId);
    } else {
      await syncAllFeeds();
    }
    setRefreshing(false);
  }, [selectedFeedId, syncFeed, syncAllFeeds]);

  const handleArticleClick = async (article) => {
    await markRead(article.id);
    onSelectArticle(article);
  };

  const selectedFeed = feeds.find(f => f.id === selectedFeedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      role="tabpanel"
      id="feed-panel"
      aria-labelledby="feed-tab"
    >
      <Header
        title={selectedFeed?.title || 'All Articles'}
        subtitle={feeds.length > 0 ? `${feeds.length} feeds` : 'Add your first feed'}
        scrollRef={scrollRef}
        leftAction={
          <button
            onClick={() => setShowSidebar(true)}
            className="ios-button -ml-2"
            aria-label="Open feed menu"
          >
            {Icons.menu}
          </button>
        }
        rightAction={
          <button
            onClick={onAddFeed}
            className="ios-button -mr-2"
            aria-label="Add new feed"
          >
            {Icons.add}
          </button>
        }
      />

      {/* Main scroll container */}
      <div
        ref={scrollRef}
        className="overflow-y-auto hide-scrollbar"
        style={{ height: 'calc(100vh - 49px - env(safe-area-inset-bottom))' }}
        role="main"
        aria-label="Article feed"
      >
        {/* Refresh indicator */}
        <AnimatePresence>
          {(refreshing || syncing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 50, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center"
              role="status"
              aria-label="Updating feeds"
            >
              <div className="flex items-center gap-2 text-label-secondary">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                >
                  {Icons.refresh}
                </motion.span>
                <span className="text-sm">Updating...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {feeds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center px-8 py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--color-fill)] flex items-center justify-center mb-6 text-label-tertiary">
              {Icons.rss}
            </div>
            <h2 className="font-display font-semibold text-xl text-label mb-2">
              Welcome to The Signal
            </h2>
            <p className="text-label-secondary text-[15px] mb-6 max-w-[280px]">
              Add your favorite RSS feeds to get started. Stay updated with news, blogs, and more.
            </p>
            <button
              onClick={onAddFeed}
              className="ios-button ios-button-filled px-6"
            >
              Add Your First Feed
            </button>
          </motion.div>
        )}

        {/* Articles list */}
        {feeds.length > 0 && (
          <div className="px-4 pb-4">
            {articles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-label-secondary">No articles yet</p>
                <button
                  onClick={handleRefresh}
                  className="ios-button mt-2"
                >
                  Refresh feeds
                </button>
              </motion.div>
            ) : (
              <ul
                className="space-y-3"
                aria-label="Articles"
              >
                {articles.map((article, index) => (
                  <motion.li
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  >
                    <ArticleCard
                      article={article}
                      feedTitle={feeds.find(f => f.id === article.feedId)?.title}
                      onClick={() => handleArticleClick(article)}
                    />
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Feed Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <FeedSidebar
            feeds={feeds}
            selectedFeedId={selectedFeedId}
            onSelectFeed={(id) => {
              setSelectedFeedId(id);
              setShowSidebar(false);
            }}
            onClose={() => setShowSidebar(false)}
            onAddFeed={onAddFeed}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
