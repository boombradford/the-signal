import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import ArticleCard from './ArticleCard';
import FeedSidebar from './FeedSidebar';
import SearchBar from './SearchBar';
import { useFeeds, useArticles } from '../hooks/useDatabase';
import { useFeedSync } from '../hooks/useFeedSync';
import { useSearch } from '../hooks/useSearch';

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
  ),
  noResults: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 8l6 6M14 8l-6 6" />
    </svg>
  )
};

export default function FeedView({ onSelectArticle, onAddFeed }) {
  const scrollRef = useRef(null);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { feeds, loading: feedsLoading, deleteFeed } = useFeeds();
  const { articles, loading: articlesLoading, markRead } = useArticles({
    feedId: selectedFeedId,
    filter: 'all'
  });
  const { syncing, syncAllFeeds, syncFeed } = useFeedSync();

  // Add feed titles to articles for search
  const articlesWithFeedTitles = articles.map(article => ({
    ...article,
    feedTitle: feeds.find(f => f.id === article.feedId)?.title
  }));

  // Search functionality with debouncing
  const { query, setQuery, clearSearch, filteredArticles, isSearching, isDebouncing } = useSearch(articlesWithFeedTitles);

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
        {/* Search bar - only show when we have articles */}
        {feeds.length > 0 && articles.length > 0 && (
          <div className="px-4 pt-2 pb-3">
            <SearchBar
              value={query}
              onChange={setQuery}
              onClear={clearSearch}
              placeholder="Search articles..."
            />
          </div>
        )}

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

        {/* Loading skeleton */}
        {(feedsLoading || articlesLoading) && articles.length === 0 && feeds.length === 0 && (
          <div className="px-4 py-4 space-y-4" aria-busy="true" aria-label="Loading articles">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[var(--color-fill)] rounded-[var(--radius-md)] p-4">
                <div className="flex gap-3">
                  <div className="ios-skeleton w-16 h-16 rounded-[var(--radius-sm)]" />
                  <div className="flex-1 space-y-2">
                    <div className="ios-skeleton h-4 w-3/4" />
                    <div className="ios-skeleton h-3 w-full" />
                    <div className="ios-skeleton h-3 w-5/6" />
                    <div className="ios-skeleton h-3 w-1/3 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state - no feeds */}
        {!feedsLoading && feeds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center px-8 py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--color-fill)] flex items-center justify-center mb-6 text-label-tertiary">
              {Icons.rss}
            </div>
            <h2 className="font-display font-semibold text-xl text-label mb-2">
              Welcome to The Vessl
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

        {/* No search results */}
        {feeds.length > 0 && isSearching && filteredArticles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center px-8 py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--color-fill)] flex items-center justify-center mb-4 text-label-tertiary">
              {Icons.noResults}
            </div>
            <h3 className="font-display font-semibold text-lg text-label mb-1">
              No results found
            </h3>
            <p className="text-label-secondary text-[14px]">
              Try a different search term
            </p>
          </motion.div>
        )}

        {/* Loading articles for selected feed */}
        {articlesLoading && feeds.length > 0 && articles.length === 0 && (
          <div className="px-4 py-4 space-y-4" aria-busy="true" aria-label="Loading articles">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--color-fill)] rounded-[var(--radius-md)] p-4">
                <div className="flex gap-3">
                  <div className="ios-skeleton w-16 h-16 rounded-[var(--radius-sm)]" />
                  <div className="flex-1 space-y-2">
                    <div className="ios-skeleton h-4 w-3/4" />
                    <div className="ios-skeleton h-3 w-full" />
                    <div className="ios-skeleton h-3 w-5/6" />
                    <div className="ios-skeleton h-3 w-1/3 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No articles state */}
        {!articlesLoading && feeds.length > 0 && !isSearching && articles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <p className="text-label-secondary">No articles yet</p>
            <button
              onClick={handleRefresh}
              className="ios-button mt-2"
            >
              Refresh feeds
            </button>
          </motion.div>
        )}

        {/* Screen reader announcements */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isSearching && !isDebouncing && (
            `${filteredArticles.length} result${filteredArticles.length !== 1 ? 's' : ''} found`
          )}
          {refreshing && 'Updating feeds'}
          {syncing && 'Syncing feeds'}
        </div>

        {feeds.length > 0 && filteredArticles.length > 0 && (
          <div className="px-4 pb-4">
            {/* Search result count */}
            {isSearching && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[13px] text-label-secondary">
                  {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "{query}"
                </p>
                {isDebouncing && (
                  <span className="text-[12px] text-label-tertiary animate-pulse">searching...</span>
                )}
              </div>
            )}

            <ul className="space-y-3" aria-label="Articles">
              {filteredArticles.map((article, index) => (
                <motion.li
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                >
                  <ArticleCard
                    article={article}
                    feedTitle={article.feedTitle}
                    onClick={() => handleArticleClick(article)}
                    searchQuery={isSearching ? query : null}
                  />
                </motion.li>
              ))}
            </ul>
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
              clearSearch(); // Clear search when changing feeds
            }}
            onClose={() => setShowSidebar(false)}
            onAddFeed={onAddFeed}
            onDeleteFeed={async (id) => {
              await deleteFeed(id);
              if (selectedFeedId === id) {
                setSelectedFeedId(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
