import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useInitDatabase, useFeeds } from './hooks/useDatabase';

// Components
import BottomNav from './components/BottomNav';
import FeedView from './components/FeedView';
import ArticleView from './components/ArticleView';
import SettingsView from './components/SettingsView';
import SavedView from './components/SavedView';
import AddFeedSheet from './components/AddFeedSheet';
import LoadingScreen from './components/LoadingScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';

export default function App() {
  const { isReady, error } = useInitDatabase();
  const { refetch: refetchFeeds } = useFeeds();
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    window.history.back();
  };

  if (!isReady) {
    return <LoadingScreen />;
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
    <div className="min-h-screen bg-grouped">
      {/* Main Content Area */}
      <main className="pb-[calc(49px+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && !selectedArticle && (
            <FeedView
              key="feed"
              onSelectArticle={openArticle}
              onAddFeed={() => setShowAddFeed(true)}
            />
          )}

          {activeTab === 'saved' && !selectedArticle && (
            <SavedView
              key="saved"
              onSelectArticle={openArticle}
            />
          )}

          {activeTab === 'settings' && !selectedArticle && (
            <SettingsView key="settings" />
          )}
        </AnimatePresence>
      </main>

      {/* Article View (overlay) */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleView
            article={selectedArticle}
            onClose={closeArticle}
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

      {/* Add Feed Sheet */}
      <AnimatePresence>
        {showAddFeed && (
          <AddFeedSheet
            onClose={() => setShowAddFeed(false)}
            onSuccess={refetchFeeds}
          />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={closeShortcuts} />
    </div>
  );
}
