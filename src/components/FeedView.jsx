import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import ArticleCard, { ArticleSkeleton } from './ArticleCard';
import SwipeableArticleCard from './SwipeableArticleCard';
import FeedSidebar from './FeedSidebar';
import SearchBar from './SearchBar';
import DailyBriefing from './DailyBriefing';
import ClipUrl, { ClipButton } from './ClipUrl';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import UndoToast from './UndoToast';
import { KevinLogoHero } from './KevinLogo';
import { useFeeds, useArticles } from '../hooks/useDatabase';
import { useFeedSync } from '../hooks/useFeedSync';
import { useSearch } from '../hooks/useSearch';
import { useSmartFeed } from '../hooks/useSmartFeed';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useUndoAction } from '../hooks/useUndoAction';
import { AVAILABLE_TAGS } from '../hooks/useAI';
import { springQuick, easeApple, easeOut, triggerHaptic } from '../utils/animations';

// Icons - minimal, purposeful
const Icons = {
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
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

export default function FeedView({ onSelectArticle, onAddFeed, onLogoClick }) {
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewDensity, setViewDensity] = useState('comfortable'); // 'comfortable' | 'compact'

  const { feeds, deleteFeed, refetch: refetchFeeds } = useFeeds();
  const { articles, markRead, toggleSaved, refetch: refetchArticles } = useArticles({
    feedId: selectedFeedId,
    filter: 'all'
  });
  const { syncing, syncAllFeeds, syncFeed } = useFeedSync();
  const { toast, showUndoToast, hideToast, handleUndo } = useUndoAction();

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

  const [timeFilter, setTimeFilter] = useState('24h'); // 'all' | '24h' | '12h'

  const articlesWithFeedTitles = useMemo(() => articles.map(article => ({
    ...article,
    feedTitle: feeds.find(f => f.id === article.feedId)?.title
  })), [articles, feeds]);

  // Time Filter - Applied first
  const timeFilteredArticles = useMemo(() => {
    if (timeFilter === 'all') return articlesWithFeedTitles;
    const hours = timeFilter === '24h' ? 24 : 12;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return articlesWithFeedTitles.filter(a => new Date(a.pubDate) >= cutoff);
  }, [articlesWithFeedTitles, timeFilter]);

  const smartFeedArticles = useSmartFeed(timeFilteredArticles);

  // Determine which set of articles to search/filter
  const sourceArticles = selectedTag === 'FOR_YOU' 
    ? smartFeedArticles 
    : timeFilteredArticles;

  const { query, setQuery, clearSearch, filteredArticles, isSearching, isDebouncing } = useSearch(sourceArticles);

  const finalArticles = (selectedTag && selectedTag !== 'FOR_YOU')
    ? filteredArticles.filter(a => a.primaryTag === selectedTag)
    : filteredArticles;

  const availableTags = [...new Set(articles.map(a => a.primaryTag).filter(Boolean))];

  const handleArticleClick = async (article) => {
    await markRead(article.id);
    onSelectArticle(article);
  };

  // Wrapped handlers with undo toast
  const handleSaveWithUndo = useCallback(async (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    const wasSaved = article.isSaved;
    await toggleSaved(articleId);

    showUndoToast(
      wasSaved ? 'Removed from saved' : 'Saved for later',
      'save',
      () => toggleSaved(articleId) // Undo by toggling again
    );
  }, [articles, toggleSaved, showUndoToast]);

  const handleMarkReadWithUndo = useCallback(async (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    await markRead(articleId);

    showUndoToast(
      'Marked as read',
      'read',
      () => markRead(articleId) // Toggle back
    );
  }, [articles, markRead, showUndoToast]);

  // Keyboard navigation for power users
  const { selectedIndex, isActive: keyboardActive } = useKeyboardNav({
    articles: finalArticles,
    onOpen: handleArticleClick,
    onSave: handleSaveWithUndo,
    onMarkRead: handleMarkReadWithUndo,
    enabled: feeds.length > 0 && !showSidebar && !showBriefing && !showClip
  });

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
            {/* Primary actions group */}
            <ClipButton onClick={() => {
              triggerHaptic('light');
              setShowClip(true);
            }} />
            {/* Time Filter Toggle - Premium */}
            {feeds.length > 0 && articles.length > 0 && (
              <motion.button
                onClick={() => {
                  triggerHaptic('selection');
                  setTimeFilter(prev => prev === '24h' ? '12h' : prev === '12h' ? 'all' : '24h');
                }}
                whileTap={{ scale: 0.95 }}
                transition={springQuick}
                className="relative p-2.5 -m-0.5 rounded-lg transition-colors duration-150"
                style={{
                  color: timeFilter !== 'all' ? '#0A84FF' : 'var(--color-label-secondary)',
                  background: timeFilter !== 'all'
                    ? 'rgba(10, 132, 255, 0.12)'
                    : 'transparent',
                  boxShadow: timeFilter !== 'all'
                    ? '0 0 12px rgba(10, 132, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : 'none',
                }}
                aria-label={`Time filter: ${timeFilter}`}
              >
                <motion.span
                  style={{
                    filter: timeFilter !== 'all' ? 'drop-shadow(0 0 4px rgba(10, 132, 255, 0.5))' : 'none',
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {Icons.clock}
                    {timeFilter !== 'all' && (
                      <span 
                        className="absolute -bottom-1.5 -right-2 text-[9px] font-bold px-1 rounded-full"
                        style={{ background: 'var(--color-background)', color: '#0A84FF', border: '1px solid rgba(10, 132, 255, 0.3)' }}
                      >
                        {timeFilter}
                      </span>
                    )}
                  </div>
                </motion.span>
              </motion.button>
            )}

            {/* View density toggle - Premium with gradient glow */}
            {feeds.length > 0 && articles.length > 0 && (
              <motion.button
                onClick={() => {
                  triggerHaptic('selection');
                  setViewDensity(d => d === 'comfortable' ? 'compact' : 'comfortable');
                }}
                whileTap={{ scale: 0.95 }}
                transition={springQuick}
                className="relative p-2.5 -m-0.5 rounded-lg transition-colors duration-150"
                style={{
                  color: viewDensity === 'compact' ? '#0A84FF' : 'var(--color-label-secondary)',
                  background: viewDensity === 'compact'
                    ? 'rgba(10, 132, 255, 0.12)'
                    : 'transparent',
                  boxShadow: viewDensity === 'compact'
                    ? '0 0 12px rgba(10, 132, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : 'none',
                }}
                aria-label={`Switch to ${viewDensity === 'comfortable' ? 'compact' : 'comfortable'} view`}
                title={viewDensity === 'comfortable' ? 'Compact view' : 'Comfortable view'}
              >
                <motion.span
                  style={{
                    filter: viewDensity === 'compact' ? 'drop-shadow(0 0 4px rgba(10, 132, 255, 0.5))' : 'none',
                  }}
                >
                  {viewDensity === 'comfortable' ? Icons.viewCompact : Icons.viewComfortable}
                </motion.span>
              </motion.button>
            )}

            {/* Visual separator */}
            {feeds.length > 0 && (
              <div className="w-px h-5 bg-label-quaternary mx-1.5 opacity-50" />
            )}

            {/* Navigation actions group */}
            {feeds.length > 0 && (
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  setShowSidebar(true);
                }}
                whileTap={{ scale: 0.95 }}
                transition={springQuick}
                className="p-2.5 -m-0.5 rounded-lg text-label-secondary hover:text-[var(--color-tint)] hover:bg-white/5 transition-colors"
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
              whileTap={{ scale: 0.95 }}
              transition={springQuick}
              className="p-2.5 -m-0.5 rounded-lg text-label-secondary hover:text-[#30D158] hover:bg-white/5 transition-colors"
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
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  transition={springQuick}
                  className="relative h-10 px-4 flex items-center gap-2 text-[14px] font-semibold text-white rounded-xl overflow-hidden"
                  aria-label="AI Catch Up"
                  style={{
                    background: 'var(--color-tint)',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span className="relative z-10">Catch up</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Tag filters - Apple Segmented Control Style */}
          {availableTags.length > 0 && (
            <div className="pb-3">
              <div
                className="inline-flex gap-1 p-1 rounded-xl overflow-x-auto hide-scrollbar"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTag(selectedTag === 'FOR_YOU' ? null : 'FOR_YOU');
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={springQuick}
                  className="relative flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
                  style={{
                    color: selectedTag === 'FOR_YOU' ? '#FFD60A' : 'var(--color-label-secondary)',
                    background: selectedTag === 'FOR_YOU'
                      ? 'rgba(255, 214, 10, 0.15)'
                      : 'transparent',
                    boxShadow: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span>For You</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTag(null);
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={springQuick}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200"
                  style={{
                    color: selectedTag === null ? 'var(--color-label)' : 'var(--color-label-secondary)',
                    background: selectedTag === null ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    letterSpacing: '-0.01em',
                  }}
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
                    whileTap={{ scale: 0.95 }}
                    transition={springQuick}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
                    style={{
                      color: selectedTag === tag.id ? 'white' : 'var(--color-label-secondary)',
                      background: selectedTag === tag.id ? 'var(--color-tint)' : 'transparent',
                      letterSpacing: '-0.01em',
                    }}
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
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(10, 132, 255, 0.1)',
                    border: '1px solid rgba(10, 132, 255, 0.2)',
                  }}
                >
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0A84FF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </motion.svg>
                  <span className="text-sm font-medium text-[#0A84FF]">
                    Updating...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - Apple-style welcome with Kevin logo */}
          {feeds.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center px-8"
            >
              {/* Kevin Logo Hero - the brand moment */}
              <div className="mb-16">
                <KevinLogoHero />
              </div>

              {/* CTA - minimal, confident */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
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
                  boxShadow: '0 2px 12px rgba(10, 132, 255, 0.3)',
                }}
              >
                Get Started
              </motion.button>

              {/* Subtle hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
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

          {/* No search results */}
          {feeds.length > 0 && isSearching && filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={easeApple}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div
                className="w-16 h-16 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <span className="text-label-tertiary">{Icons.search}</span>
              </div>
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

          {/* Filtered empty state */}
          {feeds.length > 0 && !isSearching && articles.length > 0 && finalArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={easeApple}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div
                className="w-16 h-16 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <span className="text-label-tertiary">{Icons.clock}</span>
              </div>
              <p
                className="text-[17px] text-label-secondary mb-4"
                style={{ letterSpacing: '-0.022em' }}
              >
                No articles in the last {timeFilter}
              </p>
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  setTimeFilter('all');
                }}
                whileTap={{ scale: 0.98 }}
                transition={springQuick}
                className="px-6 py-2.5 text-[15px] font-medium text-[var(--color-tint)] border border-[var(--color-tint)]/30 rounded-full hover:bg-[var(--color-tint)]/10 transition-colors duration-200"
              >
                Show all articles
              </motion.button>
            </motion.div>
          )}

          {/* Empty articles */}
          {feeds.length > 0 && !isSearching && articles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={easeApple}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div
                className="w-16 h-16 mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <motion.span
                  className="text-[var(--color-tint)]"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  {Icons.refresh}
                </motion.span>
              </div>
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
                transition={springQuick}
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

          {/* Articles list - subtle stagger */}
          {feeds.length > 0 && finalArticles.length > 0 && (
            <motion.div
              className="pb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.02,
                    delayChildren: 0
                  }
                }
              }}
            >
              {isSearching && (
                <div className="mb-4">
                  <p className="text-[13px] text-label-secondary">
                    {finalArticles.length} result{finalArticles.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                </div>
              )}

              <ul className="space-y-1" aria-label="Articles">
                {finalArticles.map((article, index) => (
                  <motion.li
                    key={article.id}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: easeApple
                      }
                    }}
                  >
                    <SwipeableArticleCard
                      article={article}
                      feedTitle={article.feedTitle}
                      onClick={() => handleArticleClick(article)}
                      onSave={handleSaveWithUndo}
                      onMarkRead={handleMarkReadWithUndo}
                      density={viewDensity}
                      isSelected={keyboardActive && selectedIndex === index}
                      index={index}
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

      {/* Undo Toast */}
      <UndoToast
        isVisible={toast.isVisible}
        message={toast.message}
        actionType={toast.actionType}
        onUndo={handleUndo}
        onDismiss={hideToast}
      />
    </motion.div>
  );
}
