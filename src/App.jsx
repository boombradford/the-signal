import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useInitDatabase, useFeeds, useArticles } from './hooks/useDatabase';
import { useReadingStats } from './hooks/useReadingStats';
import { useFeedSync } from './hooks/useFeedSync';

// Components
import BottomNav from './components/BottomNav';
import FeedView from './components/FeedView';
import ArticleView from './components/ArticleView';
import SettingsView from './components/SettingsView';
import SavedView from './components/SavedView';
import DiscoverFeeds from './components/DiscoverFeeds';
import AddFeedSheet from './components/AddFeedSheet';
import LoadingScreen from './components/LoadingScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ReadingStats from './components/ReadingStats';
import Onboarding from './components/Onboarding';
import MiniAudioPlayer from './components/MiniAudioPlayer';
import { AudioProvider } from './contexts/AudioContext';

// Context for reading stats
const ReadingStatsContext = createContext(null);
export const useReadingStatsContext = () => useContext(ReadingStatsContext);

const ONBOARDING_KEY = 'kevin_onboarding_complete';

export default function App() {
  const { isReady, error } = useInitDatabase();
  const { feeds, refetch: refetchFeeds } = useFeeds();
  const { articles: allArticles } = useArticles({ filter: 'all' });
  const readHistory = allArticles.filter(a => a.isRead);
  const savedArticles = allArticles.filter(a => a.isSaved);
  const readingStats = useReadingStats();
  const { subscribeFeed } = useFeedSync();
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger FeedView refresh
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true';
    // Also check if user already has feeds (returning user or skip)
    if (!hasCompleted && feeds.length === 0) {
      setShowOnboarding(true);
    }
    setOnboardingChecked(true);
  }, [feeds.length]);

  // Handle onboarding completion with parallel subscription
  const handleOnboardingComplete = useCallback(async (feedsToAdd, selectedTopics, onProgress) => {
    // Mark onboarding as complete
    localStorage.setItem(ONBOARDING_KEY, 'true');

    // Store user interests
    if (selectedTopics.length > 0) {
      localStorage.setItem('kevin_interests', JSON.stringify(selectedTopics));
    }

    // Subscribe to feeds in parallel batches for speed
    const BATCH_SIZE = 5;
    let completed = 0;

    for (let i = 0; i < feedsToAdd.length; i += BATCH_SIZE) {
      const batch = feedsToAdd.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (feed) => {
          try {
            await subscribeFeed(feed.url);
          } catch (e) {
            console.error('Failed to subscribe to feed:', feed.url, e);
          }
          completed++;
          onProgress?.(completed, feedsToAdd.length);
        })
      );
    }

    // Refresh feeds list
    refetchFeeds();
    setRefreshKey(k => k + 1);
    setShowOnboarding(false);
  }, [subscribeFeed, refetchFeeds]);


  // Keyboard shortcut: ? to toggle help
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);

  // Handle back navigation
  useEffect(() => {
    const handlePopState = () => {
      if (selectedArticle) {
        setSelectedArticle(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedArticle]);

  // Push state when opening article
  const openArticle = (article) => {
    window.history.pushState({ article: article.id }, '');
    setSelectedArticle(article);
    // Track the article read for stats
    readingStats.trackArticleRead(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    window.history.back();
  };

  const goHome = useCallback(() => {
    setSelectedArticle(null);
    setActiveTab('feed');
  }, []);

  // Handle subscribing to a feed from Discover
  const handleDiscoverSubscribe = useCallback(async (feedUrl, category) => {
    // This will be handled by AddFeedSheet logic
    // For now, open the add feed sheet with the URL pre-filled
    setShowAddFeed(true);
  }, []);

  if (!isReady || !onboardingChecked) {
    return <LoadingScreen />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-grouped flex items-center justify-center p-6" role="alert">
        <div className="ios-card p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="font-display font-semibold text-lg text-label mb-2">Database Error</h2>
          <p className="text-label-secondary text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <AudioProvider>
      <ReadingStatsContext.Provider value={readingStats}>
        <div className="min-h-screen bg-grouped">
          <LayoutGroup>
          {/* Main Content Area */}
          <main className="pb-[calc(49px+env(safe-area-inset-bottom))]">
            <AnimatePresence mode="wait">
              {activeTab === 'feed' && !selectedArticle && (
                <FeedView
                  key={`feed-${refreshKey}`}
                  onSelectArticle={openArticle}
                  onAddFeed={() => setShowAddFeed(true)}
                  onLogoClick={goHome}
                />
              )}

              {activeTab === 'saved' && !selectedArticle && (
                <SavedView
                  key="saved"
                  onSelectArticle={openArticle}
                  onLogoClick={goHome}
                />
              )}

              {activeTab === 'settings' && !selectedArticle && (
                <SettingsView
                  key="settings"
                  onLogoClick={goHome}
                  onShowStats={() => setShowStats(true)}
                />
              )}

              {activeTab === 'discover' && !selectedArticle && (
                <DiscoverFeeds
                  key="discover"
                  currentFeeds={feeds}
                  readHistory={readHistory}
                  savedArticles={savedArticles}
                  onSubscribe={handleDiscoverSubscribe}
                  onClose={() => setActiveTab('feed')}
                />
              )}
            </AnimatePresence>
          </main>

          {/* Article View (overlay) */}
          <AnimatePresence>
            {selectedArticle && (
              <ArticleView
                article={selectedArticle}
                onClose={closeArticle}
                onLogoClick={goHome}
              />
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          {!selectedArticle && (
            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
        </LayoutGroup>

        {/* Add Feed Sheet */}
        <AnimatePresence>
          {showAddFeed && (
            <AddFeedSheet
              onClose={() => setShowAddFeed(false)}
              onSuccess={() => {
                // Refetch feeds and trigger FeedView refresh
                refetchFeeds();
                setRefreshKey(k => k + 1);
              }}
            />
          )}
        </AnimatePresence>

        {/* Reading Stats Modal */}
        <ReadingStats
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />

          {/* Keyboard Shortcuts Modal */}
          <KeyboardShortcuts isOpen={showShortcuts} onClose={closeShortcuts} />

          {/* Persistent Audio Player */}
          <MiniAudioPlayer />
        </div>
      </ReadingStatsContext.Provider>
    </AudioProvider>
  );
}
