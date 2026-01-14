import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import AuthModal from './AuthModal';
import { useSettings, useFeeds, useCounts } from '../hooks/useDatabase';
import { getCurrentUser, signOut, isAuthenticated, onAuthStateChange } from '../utils/supabase';
import { springTactile, triggerHaptic } from '../utils/animations';

export default function SettingsView({ onLogoClick, onShowStats }) {
  const scrollRef = useRef(null);
  const { settings, updateSetting, loading } = useSettings();
  const { feeds } = useFeeds();
  const { total, unread, saved } = useCounts();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
    };

    loadUser();

    // Listen for auth changes
    const unsubscribe = onAuthStateChange(async (session) => {
      setUser(session?.user || null);
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
    });

    return unsubscribe;
  }, []);

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setUser(null);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
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
      <Header title="Settings" scrollRef={scrollRef} onLogoClick={onLogoClick} />

      <main
        ref={scrollRef}
        className="overflow-y-auto pb-8"
        style={{ height: 'calc(100vh - 49px - env(safe-area-inset-bottom))' }}
      >
        {/* Account Section */}
        <section className="px-4" aria-labelledby="account-heading">
          <p className="ios-list-header" id="account-heading">Account</p>
          <div className="glass-card rounded-2xl overflow-hidden">
            {isLoggedIn ? (
              <>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-tint)] flex items-center justify-center text-white font-bold text-lg">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-label truncate">{user?.email}</p>
                      <p className="text-sm text-[var(--color-success)] flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                        </svg>
                        Synced across devices
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[var(--color-separator)]">
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleSignOut();
                    }}
                    disabled={signingOut}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="w-full p-4 text-left text-[var(--color-error)] hover:bg-[var(--color-fill)] transition-colors disabled:opacity-50"
                  >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-fill)] flex items-center justify-center text-label-secondary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-label">Guest Mode</p>
                    <p className="text-sm text-label-secondary">Sign in to sync your data</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowAuthModal(true);
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTactile}
                  className="glass-button-primary w-full"
                >
                  Sign In or Create Account
                </motion.button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section - Premium Dashboard */}
        <section className="px-4 mt-6" aria-labelledby="stats-heading">
          <p className="ios-list-header" id="stats-heading">Statistics</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 2px 16px rgba(0,0,0,0.2)',
            }}
          >
            {/* Stats Grid - Premium with individual cells */}
            <div className="grid grid-cols-2">
              {[
                { value: feeds.length, label: 'Feeds', color: 'var(--color-label)' },
                { value: total, label: 'Articles', color: 'var(--color-label)' },
                { value: unread, label: 'Unread', color: 'var(--color-tint)' },
                { value: saved, label: 'Saved', color: 'var(--color-warning)' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="relative p-5 text-center"
                  style={{
                    borderRight: index % 2 === 0 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                    borderBottom: index < 2 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.p
                    className="text-[32px] font-bold leading-none mb-1"
                    style={{
                      color: stat.color,
                      fontFeatureSettings: '"tnum" 1',
                      letterSpacing: '-0.02em',
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ color: 'var(--color-label-tertiary)' }}
                  >
                    {stat.label}
                  </p>
                  {/* Subtle glow for colored stats */}
                  {stat.color !== 'var(--color-label)' && stat.value > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        background: `radial-gradient(circle at 50% 30%, ${stat.color} 0%, transparent 70%)`,
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Reading Stats Button - Premium */}
            <motion.button
              onClick={() => {
                triggerHaptic('light');
                onShowStats();
              }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              transition={springTactile}
              className="w-full p-4 flex items-center justify-between transition-colors"
              style={{
                borderTop: '0.5px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{
                    background: 'linear-gradient(135deg, #0A84FF 0%, #147CE5 100%)',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C10.5 5.5 6 8 6 13C6 17.5 9.5 21 14 21C18.5 21 21 17 21 13C21 9 18 6 18 6C18 10 16 12 14 12C12 12 11.5 10 12 8C12.5 6 12 2 12 2Z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-label" style={{ letterSpacing: '-0.01em' }}>Reading Stats & Streaks</p>
                  <p className="text-[12px] text-label-secondary">Track your reading journey</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-label-tertiary">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          </div>
        </section>

        {/* AI Features */}
        <section className="px-4 mt-6" aria-labelledby="ai-heading">
          <p className="ios-list-header" id="ai-heading">AI Features</p>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-tint)] flex items-center justify-center">
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
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center">
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
        </section>

        {/* Appearance */}
        <section className="px-4 mt-6" aria-labelledby="appearance-heading">
          <p className="ios-list-header" id="appearance-heading">Appearance</p>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <label htmlFor="theme-select" className="text-label">Theme</label>
              <select
                id="theme-select"
                value={settings.theme || 'system'}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="bg-[var(--color-fill)] text-label px-3 py-1.5 rounded-lg appearance-none cursor-pointer pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center'
                }}
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
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-separator)]">
              <span className="text-label">Version</span>
              <span className="text-label-secondary">1.0.0</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-[var(--color-fill)] transition-colors"
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
          <div className="glass-card rounded-2xl overflow-hidden">
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                handleClearData();
              }}
              whileTap={{ scale: 0.98 }}
              transition={springTactile}
              className="w-full p-4 text-left text-[var(--color-error)] hover:bg-[var(--color-fill)] transition-colors"
              aria-describedby="clear-data-warning"
            >
              Clear All Data
            </motion.button>
          </div>
          <p id="clear-data-warning" className="text-[13px] text-label-tertiary mt-2 px-4">
            This will delete all feeds, articles, and settings.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center mt-8 text-[13px] text-label-tertiary">
          <p className="font-display font-semibold">Kevin</p>
          <p className="mt-1">Your AI News Reader</p>
        </footer>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          // Reload to refresh user data
          window.location.reload();
        }}
      />
    </motion.div>
  );
}
