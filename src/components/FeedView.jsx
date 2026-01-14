import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import ArticleCard, { ArticleSkeleton } from './ArticleCard';
import FeedSidebar from './FeedSidebar';
import SearchBar from './SearchBar';
import DailyBriefing from './DailyBriefing';
import ClipUrl, { ClipButton } from './ClipUrl';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import { KevinLogoHero } from './KevinLogo';
import { useFeeds, useArticles } from '../hooks/useDatabase';
import { useFeedSync } from '../hooks/useFeedSync';
import { useSearch } from '../hooks/useSearch';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { AVAILABLE_TAGS } from '../hooks/useAI';
import { springDefault, springGentle, springTactile, easeOut, triggerHaptic } from '../utils/animations';

// Icons - minimal, purposeful
const Icons = {
  filter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M7 12h10M10 18h4" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  rss: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  search: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  // View density icons
  viewComfortable: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="7" rx="1" />
      <rect x="3" y="14" width="18" height="7" rx="1" />
    </svg>
  ),
  viewCompact: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />
    </svg>
  )
};

// Using imported Apple-style animations

export default function FeedView({ onSelectArticle, onAddFeed, onLogoClick, onShowStats }) {
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewDensity, setViewDensity] = useState('comfortable'); // 'comfortable' | 'compact'

  const { feeds, deleteFeed, refetch: refetchFeeds } = useFeeds();
  const { articles, markRead, refetch: refetchArticles } = useArticles({
    feedId: selectedFeedId,
    filter: 'all'
  });
  const { syncing, syncAllFeeds, syncFeed } = useFeedSync();

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedFeedId) {
      await syncFeed(selectedFeedId);
    } else {
      await syncAllFeeds();
    }
    setRefreshing(false);
  }, [selectedFeedId, syncFeed, syncAllFeeds]);

  // Pull-to-refresh with premium iOS feel
  const {
    scrollRef,
    pullDistance,
    isRefreshing: isPullRefreshing,
    progress: pullProgress,
    isReady: pullIsReady,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: feeds.length === 0,
  });

  useEffect(() => {
    refetchFeeds();
    refetchArticles();
  }, [refetchFeeds, refetchArticles]);

  const articlesWithFeedTitles = articles.map(article => ({
    ...article,
    feedTitle: feeds.find(f => f.id === article.feedId)?.title
  }));

  const { query, setQuery, clearSearch, filteredArticles, isSearching, isDebouncing } = useSearch(articlesWithFeedTitles);

  const tagFilteredArticles = selectedTag
    ? filteredArticles.filter(a => a.primaryTag === selectedTag)
    : filteredArticles;

  const availableTags = [...new Set(articles.map(a => a.primaryTag).filter(Boolean))];

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
      transition={easeOut}
      className="min-h-screen"
      role="tabpanel"
      id="feed-panel"
      aria-labelledby="feed-tab"
    >
      <Header
        title={selectedFeed?.title || 'Today'}
        subtitle={feeds.length > 0 ? `${articles.length} articles` : null}
        scrollRef={scrollRef}
        onLogoClick={onLogoClick}
        rightAction={
          <div className="flex items-center gap-0.5">
            <ClipButton onClick={() => {
              triggerHaptic('light');
              setShowClip(true);
            }} />
            {/* View density toggle */}
            {feeds.length > 0 && articles.length > 0 && (
              <motion.button
                onClick={() => {
                  triggerHaptic('selection');
                  setViewDensity(d => d === 'comfortable' ? 'compact' : 'comfortable');
                }}
                whileTap={{ scale: 0.9 }}
                transition={springTactile}
                className={`p-2 transition-colors duration-150 ${
                  viewDensity === 'compact' 
                    ? 'text-[var(--color-tint)]' 
                    : 'text-label-secondary hover:text-label'
                }`}
                aria-label={`Switch to ${viewDensity === 'comfortable' ? 'compact' : 'comfortable'} view`}
                title={viewDensity === 'comfortable' ? 'Compact view' : 'Comfortable view'}
              >
                {viewDensity === 'comfortable' ? Icons.viewCompact : Icons.viewComfortable}
              </motion.button>
            )}
            {feeds.length > 0 && (
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  setShowSidebar(true);
                }}
                whileTap={{ scale: 0.92 }}
                transition={springTactile}
                className="p-2 text-label-secondary hover:text-label transition-colors duration-150"
                aria-label="Filter feeds"
              >
                {Icons.filter}
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                onAddFeed();
              }}
              whileTap={{ scale: 0.92 }}
              transition={springTactile}
              className="p-2 text-label-secondary hover:text-label transition-colors duration-150"
              aria-label="Add feed"
            >
              {Icons.plus}
            </motion.button>
          </div>
        }
      />

      <div
        ref={scrollRef}
        className="overflow-y-auto hide-scrollbar relative"
        style={{ height: 'calc(100vh - 49px - env(safe-area-inset-bottom))' }}
        role="main"
        aria-label="Article feed"
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(pullDistance > 0 || isPullRefreshing) && (
            <PullToRefreshIndicator
              pullDistance={pullDistance}
              isRefreshing={isPullRefreshing}
              progress={pullProgress}
              isReady={pullIsReady}
            />
          )}
        </AnimatePresence>

        {/* Content container - with pull transform */}
        <motion.div 
          className="px-4 max-w-2xl mx-auto"
          animate={{ 
            y: isPullRefreshing ? 60 : pullDistance > 0 ? pullDistance : 0 
          }}
          transition={isPullRefreshing ? { duration: 0.3 } : { duration: 0 }}
        >
          {/* Search and Catch up */}
          {feeds.length > 0 && articles.length > 0 && (
            <div className="pt-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    onClear={clearSearch}
                    placeholder="Search articles..."
                  />
                </div>
                <motion.button
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowBriefing(true);
                  }}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  transition={springTactile}
                  className="h-10 px-5 text-[14px] font-medium text-white bg-[var(--color-tint)] rounded-lg relative overflow-hidden"
                  aria-label="AI Catch Up"
                  style={{
                    boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)'
                  }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-lg"
                    animate={{
                      boxShadow: [
                        '0 0 16px 4px rgba(10, 132, 255, 0.2)',
                        '0 0 24px 8px rgba(10, 132, 255, 0.4)',
                        '0 0 16px 4px rgba(10, 132, 255, 0.2)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <span className="relative z-10">Catch up</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Tag filters */}
          {availableTags.length > 0 && (
            <div className="pb-3">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4">
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTag(null);
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={springTactile}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                    selectedTag === null
                      ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                      : 'text-label-secondary hover:text-label'
                  }`}
                >
                  All
                </motion.button>
                {AVAILABLE_TAGS.filter(t => availableTags.includes(t.id)).map(tag => (
                  <motion.button
                    key={tag.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedTag(selectedTag === tag.id ? null : tag.id);
                    }}
                    whileTap={{ scale: 0.96 }}
                    transition={springTactile}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${
                      selectedTag === tag.id
                        ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                        : 'text-label-secondary hover:text-label bg-[var(--color-fill-secondary)]'
                    }`}
                  >
                    {tag.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Anticipatory loading - show skeletons during sync */}
          <AnimatePresence>
            {(refreshing || syncing) && articles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={easeOut}
                role="status"
                aria-label="Loading articles"
              >
                {[...Array(4)].map((_, i) => (
                  <ArticleSkeleton key={i} density={viewDensity} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline refresh indicator when articles already exist */}
          <AnimatePresence>
            {(refreshing || syncing) && articles.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 44, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={easeOut}
                className="flex items-center justify-center"
                role="status"
              >
                <div className="flex items-center gap-2 text-label-secondary">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {Icons.refresh}
                  </motion.span>
                  <span className="text-sm">Updating...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - Apple-style welcome with Kevin logo */}
          {feeds.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center px-8"
            >
              {/* Kevin Logo Hero - the brand moment */}
              <motion.div
                className="mb-16"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1
                }}
              >
                <KevinLogoHero />
              </motion.div>

              {/* CTA - minimal, confident */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onAddFeed();
                }}
                className="h-14 px-10 text-[17px] font-semibold text-white rounded-full"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.022em',
                  background: 'var(--color-tint)',
                  boxShadow: '0 4px 20px rgba(10, 132, 255, 0.35)',
                }}
              >
                Get Started
              </motion.button>

              {/* Subtle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
                className="mt-5 text-[13px] text-label-tertiary"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.008em'
                }}
              >
                Add your first feed to begin
              </motion.p>
            </motion.div>
          )}

          {/* No search results - Gentle, helpful message with ambient animation */}
          {feeds.length > 0 && isSearching && filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springGentle}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <motion.div
                className="relative w-16 h-16 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
                animate={{
                  rotate: [0, -3, 3, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {/* Ambient glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 20px 8px rgba(142, 142, 147, 0.05)',
                      '0 0 30px 12px rgba(142, 142, 147, 0.1)',
                      '0 0 20px 8px rgba(142, 142, 147, 0.05)'
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                <span className="text-label-tertiary relative z-10">{Icons.search}</span>
              </motion.div>
              <h3
                className="text-[22px] text-label mb-2"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.022em'
                }}
              >
                No matches found
              </h3>
              <p
                className="text-label-secondary text-[15px] max-w-[260px]"
                style={{ letterSpacing: '-0.016em' }}
              >
                Try adjusting your search or check for typos
              </p>
            </motion.div>
          )}

          {/* Empty articles - with ambient animation */}
          {feeds.length > 0 && !isSearching && articles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springGentle}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              {/* Animated refresh icon */}
              <motion.div
                className="relative w-16 h-16 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {/* Ambient glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 20px 8px rgba(10, 132, 255, 0.05)',
                      '0 0 30px 12px rgba(10, 132, 255, 0.1)',
                      '0 0 20px 8px rgba(10, 132, 255, 0.05)'
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                <motion.span
                  className="text-[var(--color-tint)]"
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  {Icons.refresh}
                </motion.span>
              </motion.div>
              <p
                className="text-[17px] text-label-secondary mb-4"
                style={{ letterSpacing: '-0.022em' }}
              >
                No articles yet
              </p>
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  handleRefresh();
                }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                transition={springTactile}
                className="px-6 py-2.5 text-[15px] font-medium text-[var(--color-tint)] border border-[var(--color-tint)]/30 rounded-full hover:bg-[var(--color-tint)]/10 transition-colors duration-200"
              >
                Refresh feeds
              </motion.button>
            </motion.div>
          )}

          {/* Screen reader announcements */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {isSearching && !isDebouncing && (
              `${filteredArticles.length} result${filteredArticles.length !== 1 ? 's' : ''} found`
            )}
          </div>

          {/* Articles list - with staggered cascade animation */}
          {feeds.length > 0 && filteredArticles.length > 0 && (
            <motion.div
              className="pb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.04,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              {isSearching && (
                <div className="mb-4">
                  <p className="text-[13px] text-label-secondary">
                    {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                </div>
              )}

              <ul className="space-y-0" aria-label="Articles">
                {tagFilteredArticles.map((article, index) => (
                  <motion.li
                    key={article.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.98 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 30
                        }
                      }
                    }}
                  >
                    <ArticleCard
                      article={article}
                      feedTitle={article.feedTitle}
                      onClick={() => handleArticleClick(article)}
                      searchQuery={isSearching ? query : null}
                      density={viewDensity}
                    />
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
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
              clearSearch();
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

      {/* Daily Briefing */}
      <DailyBriefing
        articles={articlesWithFeedTitles}
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
      />

      {/* Clip URL */}
      <ClipUrl
        isOpen={showClip}
        onClose={() => setShowClip(false)}
        onClipSaved={() => {
          refetchArticles();
        }}
      />
    </motion.div>
  );
}
