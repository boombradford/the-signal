import { useRef } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import { useSettings, useFeeds, useCounts } from '../hooks/useDatabase';

export default function SettingsView() {
  const scrollRef = useRef(null);
  const { settings, updateSetting, loading } = useSettings();
  const { feeds } = useFeeds();
  const { total, unread, saved } = useCounts();

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // Clear localStorage settings
      localStorage.clear();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading settings">
        <div className="ios-skeleton w-8 h-8 rounded-full" aria-hidden="true" />
        <span className="sr-only">Loading settings...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      role="tabpanel"
      id="settings-panel"
      aria-labelledby="settings-tab"
    >
      <Header title="Settings" scrollRef={scrollRef} />

      <main
        ref={scrollRef}
        className="overflow-y-auto pb-8"
        style={{ height: 'calc(100vh - 49px - env(safe-area-inset-bottom))' }}
      >
        {/* Stats Section */}
        <section className="px-4" aria-labelledby="stats-heading">
          <p className="ios-list-header" id="stats-heading">Statistics</p>
          <dl className="ios-list-group">
            <div className="ios-list-item justify-between">
              <dt className="text-label">Feeds</dt>
              <dd className="text-label-secondary">{feeds.length}</dd>
            </div>
            <div className="ios-list-item justify-between">
              <dt className="text-label">Total Articles</dt>
              <dd className="text-label-secondary">{total}</dd>
            </div>
            <div className="ios-list-item justify-between">
              <dt className="text-label">Unread</dt>
              <dd className="text-label-secondary">{unread}</dd>
            </div>
            <div className="ios-list-item justify-between">
              <dt className="text-label">Saved</dt>
              <dd className="text-label-secondary">{saved}</dd>
            </div>
          </dl>
        </section>

        {/* AI Features */}
        <section className="px-4 mt-6" aria-labelledby="ai-heading">
          <p className="ios-list-header" id="ai-heading">AI Features</p>
          <div className="ios-list-group">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-info)] to-[var(--color-tint)] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-label">AI Summaries</p>
                  <p className="text-[13px] text-[var(--color-success)]">Powered by Claude</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-label">Audio Summaries</p>
                  <p className="text-[13px] text-[var(--color-success)]">Powered by ElevenLabs</p>
                </div>
              </div>
              <p className="text-[13px] text-label-tertiary mt-4">
                AI features are included — no API keys needed.
              </p>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="px-4 mt-6" aria-labelledby="appearance-heading">
          <p className="ios-list-header" id="appearance-heading">Appearance</p>
          <div className="ios-list-group">
            <div className="ios-list-item justify-between">
              <label htmlFor="theme-select" className="text-label">Theme</label>
              <select
                id="theme-select"
                value={settings.theme || 'system'}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="bg-transparent text-label-secondary text-right appearance-none cursor-pointer"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="px-4 mt-6" aria-labelledby="about-heading">
          <p className="ios-list-header" id="about-heading">About</p>
          <div className="ios-list-group">
            <div className="ios-list-item justify-between">
              <span className="text-label">Version</span>
              <span className="text-label-secondary">1.0.0</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ios-list-item justify-between"
              aria-label="View source code on GitHub (opens in new tab)"
            >
              <span className="text-label">Source Code</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-label-tertiary" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="px-4 mt-6" aria-labelledby="data-heading">
          <p className="ios-list-header" id="data-heading">Data</p>
          <div className="ios-list-group">
            <button
              onClick={handleClearData}
              className="ios-list-item w-full text-left text-[var(--color-error)]"
              aria-describedby="clear-data-warning"
            >
              Clear All Data
            </button>
          </div>
          <p id="clear-data-warning" className="text-[13px] text-label-tertiary mt-2 px-4">
            This will delete all feeds, articles, and settings.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center mt-8 text-[13px] text-label-tertiary">
          <p>The Vessl</p>
          <p className="mt-1">AI-Powered News Reader</p>
        </footer>
      </main>
    </motion.div>
  );
}
