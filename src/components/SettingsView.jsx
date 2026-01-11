import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import { useSettings, useFeeds, useCounts } from '../hooks/useDatabase';
import { validateApiKey } from '../utils/ai';
import db from '../utils/db';

export default function SettingsView() {
  const scrollRef = useRef(null);
  const { settings, updateSetting, loading } = useSettings();
  const { feeds } = useFeeds();
  const { total, unread, saved } = useCounts();

  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState(null); // 'valid', 'invalid', 'checking'
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (settings.claudeApiKey) {
      setApiKey(settings.claudeApiKey);
      setApiKeyStatus('valid');
    }
  }, [settings.claudeApiKey]);

  const handleApiKeySave = async () => {
    if (!apiKey.trim()) {
      await updateSetting('claudeApiKey', '');
      setApiKeyStatus(null);
      return;
    }

    setApiKeyStatus('checking');

    const result = await validateApiKey(apiKey.trim());

    if (result.valid) {
      await updateSetting('claudeApiKey', apiKey.trim());
      setApiKeyStatus('valid');
    } else {
      setApiKeyStatus('invalid');
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      await db.delete();
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

        {/* AI Settings */}
        <section className="px-4 mt-6" aria-labelledby="ai-heading">
          <p className="ios-list-header" id="ai-heading">AI Summaries</p>
          <div className="ios-list-group">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="api-key-input" className="text-[15px] font-medium text-label">
                  AI API Key
                </label>
                {apiKeyStatus === 'valid' && (
                  <span className="text-[12px] text-[var(--color-success)] font-medium flex items-center gap-1" role="status">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Connected
                  </span>
                )}
                {apiKeyStatus === 'invalid' && (
                  <span className="text-[12px] text-[var(--color-error)] font-medium" role="alert">Invalid Key</span>
                )}
                {apiKeyStatus === 'checking' && (
                  <span className="text-[12px] text-label-secondary" role="status">Checking...</span>
                )}
              </div>

              <div className="relative">
                <input
                  id="api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeyStatus(null);
                  }}
                  onBlur={handleApiKeySave}
                  placeholder="sk-ant-..."
                  className="ios-textfield pr-20"
                  aria-describedby="api-key-help"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--color-tint)]"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <p id="api-key-help" className="text-[13px] text-label-tertiary mt-2">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-tint)] underline"
                >
                  console.anthropic.com
                </a>
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
          <p>The Signal</p>
          <p className="mt-1">AI-Powered News Reader</p>
        </footer>
      </main>
    </motion.div>
  );
}
