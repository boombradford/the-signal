import { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import AuthModal from './AuthModal';
import { useSettings, useFeeds, useCounts } from '../hooks/useDatabase';
import { getCurrentUser, signOut, isAuthenticated, onAuthStateChange } from '../utils/supabase';
import { springTactile, triggerHaptic } from '../utils/animations';

// Premium animated count-up hook
function useAnimatedCount(targetValue, duration = 800) {
  const [count, setCount] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    if (targetValue === prevValue.current) return;

    const startValue = prevValue.current;
    const startTime = performance.now();
    const difference = targetValue - startValue;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.round(startValue + difference * easeOut);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = targetValue;
  }, [targetValue, duration]);

  return count;
}

// Animated stat display component
function AnimatedStat({ value, color }) {
  const animatedValue = useAnimatedCount(value, 600);

  return (
    <motion.p
      className="text-[28px] font-bold leading-none"
      style={{
        color: value > 0 ? color : 'var(--color-label-tertiary)',
        fontFeatureSettings: '"tnum" 1',
        letterSpacing: '-0.02em',
      }}
    >
      {animatedValue}
    </motion.p>
  );
}

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
                  <div className="flex items-center gap-4">
                    {/* Premium Avatar */}
                    <div
                      className="relative w-14 h-14 rounded-full p-[2px]"
                      style={{
                        background: 'var(--color-tint)',
                        boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{
                          background: 'var(--color-tint)',
                        }}
                      >
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {/* Online indicator */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[var(--color-background)]"
                        style={{
                          background: '#30D158',
                          boxShadow: '0 2px 6px rgba(48, 209, 88, 0.5)',
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-label truncate" style={{ letterSpacing: '-0.01em' }}>{user?.email}</p>
                      <p className="text-[13px] text-[var(--color-success)] flex items-center gap-1.5 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                    whileHover="hover"
                    initial="rest"
                    transition={springTactile}
                    className="relative w-full p-4 text-left disabled:opacity-50 overflow-hidden hover:bg-[rgba(255,69,58,0.1)] transition-colors"
                  >
                    <span className="relative z-10 text-[var(--color-error)]">
                      {signingOut ? 'Signing out...' : 'Sign Out'}
                    </span>
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-4 mb-5">
                  {/* Guest Avatar */}
                  <div
                    className="relative w-14 h-14 rounded-full p-[2px]"
                    style={{
                      background: 'var(--color-fill-secondary)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center bg-[var(--color-fill)]"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-label-secondary)" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-label" style={{ letterSpacing: '-0.01em' }}>Guest Mode</p>
                    <p className="text-[13px] text-label-secondary mt-0.5">Sign in to sync your data</p>
                  </div>
                </div>
                <div className="relative">
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      setShowAuthModal(true);
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="relative w-full h-12 rounded-xl text-[15px] font-semibold text-white overflow-hidden"
                    style={{
                      background: 'var(--color-tint)',
                      boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <span className="relative z-10">Sign In or Create Account</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section - Premium Dashboard */}
        <section className="px-4 mt-6" aria-labelledby="stats-heading">
          <p className="ios-list-header" id="stats-heading">Statistics</p>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-fill)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {/* Stats Grid - Premium with icons and individual cells */}
            <div className="grid grid-cols-2 relative">
              {[
                {
                  value: feeds.length,
                  label: 'Feeds',
                  color: '#30D158',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
                      <circle cx="5" cy="19" r="2" fill="currentColor" stroke="none" />
                    </svg>
                  )
                },
                {
                  value: total,
                  label: 'Articles',
                  color: '#BF5AF2',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                  )
                },
                {
                  value: unread,
                  label: 'Unread',
                  color: '#0A84FF',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                    </svg>
                  )
                },
                {
                  value: saved,
                  label: 'Saved',
                  color: '#FF9F0A',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  )
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="relative p-5"
                  style={{
                    borderRight: index % 2 === 0 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                    borderBottom: index < 2 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                    background: 'transparent',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Icon + Value row */}
                  <div className="flex items-center justify-between mb-2">
                    <motion.div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        color: stat.color,
                        background: `rgba(${stat.color === '#30D158' ? '48, 209, 88' : stat.color === '#BF5AF2' ? '191, 90, 242' : stat.color === '#0A84FF' ? '10, 132, 255' : '255, 159, 10'}, 0.15)`,
                      }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {stat.icon}
                    </motion.div>
                    <AnimatedStat value={stat.value} color={stat.color} />
                  </div>
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ color: 'var(--color-label-secondary)' }}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Reading Stats Button */}
            <div className="relative" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  onShowStats();
                }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                transition={springTactile}
                className="relative w-full p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{
                        background: '#FF9500',
                        boxShadow: '0 2px 8px rgba(255, 149, 0, 0.3)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C10.5 5.5 6 8 6 13C6 17.5 9.5 21 14 21C18.5 21 21 17 21 13C21 9 18 6 18 6C18 10 16 12 14 12C12 12 11.5 10 12 8C12.5 6 12 2 12 2Z" />
                      </svg>
                    </div>
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
          </div>
        </section>

        {/* AI Features - Premium Cards */}
        <section className="px-4 mt-6" aria-labelledby="ai-heading">
          <p className="ios-list-header" id="ai-heading">AI Features</p>
          <div className="space-y-3">
            {/* AI Summaries Card */}
            <div
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{
                background: 'rgba(10, 132, 255, 0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: '#0A84FF',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-label text-[16px]" style={{ letterSpacing: '-0.01em' }}>AI Summaries</p>
                  <p className="text-[13px] text-[var(--color-tint)] font-medium">Powered by Claude</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Audio Summaries Card */}
            <div
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: '#8B5CF6',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-label text-[16px]" style={{ letterSpacing: '-0.01em' }}>Audio Summaries</p>
                  <p className="text-[13px] text-[#8B5CF6] font-medium">Powered by ElevenLabs</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[13px] text-label-tertiary mt-3 px-1">
            AI features are included — no API keys needed.
          </p>
        </section>

        {/* Appearance - Premium Theme Selector */}
        <section className="px-4 mt-6" aria-labelledby="appearance-heading">
          <p className="ios-list-header" id="appearance-heading">Appearance</p>
          <div className="glass-card rounded-2xl overflow-hidden p-4">
            <p className="text-[13px] text-label-secondary mb-3" style={{ letterSpacing: '-0.01em' }}>Theme</p>
            <div
              className="flex gap-2 p-1 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              role="radiogroup"
              aria-label="Theme selection"
            >
              {[
                {
                  value: 'system',
                  label: 'Auto',
                  color: '#0A84FF',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  )
                },
                {
                  value: 'light',
                  label: 'Light',
                  color: '#FF9F0A',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="5" />
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" fill="none" />
                    </svg>
                  )
                },
                {
                  value: 'dark',
                  label: 'Dark',
                  color: '#5E5CE6',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )
                }
              ].map((theme) => {
                const isSelected = (settings.theme || 'system') === theme.value;
                return (
                  <motion.button
                    key={theme.value}
                    onClick={() => {
                      triggerHaptic('selection');
                      updateSetting('theme', theme.value);
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={springTactile}
                    className="relative flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg transition-all duration-200 overflow-hidden"
                    style={{
                      background: isSelected
                        ? `${theme.color}20`
                        : 'transparent',
                      boxShadow: isSelected
                        ? `0 0 0 1px ${theme.color}30`
                        : 'none',
                      color: isSelected ? theme.color : 'var(--color-label-secondary)',
                    }}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <motion.span
                      className="relative z-10"
                    >
                      {theme.icon}
                    </motion.span>
                    <span
                      className="relative z-10 text-[12px] font-semibold"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {theme.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* About - Premium */}
        <section className="px-4 mt-6" aria-labelledby="about-heading">
          <p className="ios-list-header" id="about-heading">About</p>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Version with premium badge */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-separator)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(10, 132, 255, 0.1)',
                    border: '1px solid rgba(10, 132, 255, 0.2)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <span className="text-label font-medium block">Kevin</span>
                  <span className="text-[12px] text-label-tertiary">AI News Reader</span>
                </div>
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold"
                style={{
                  background: 'rgba(48, 209, 88, 0.1)',
                  color: '#30D158',
                  border: '1px solid rgba(48, 209, 88, 0.2)',
                  letterSpacing: '-0.01em',
                }}
              >
                v1.0.0
              </div>
            </div>
            {/* Source code link */}
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-[var(--color-fill)] transition-colors"
              aria-label="View source code on GitHub (opens in new tab)"
              whileTap={{ scale: 0.98 }}
              transition={springTactile}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'var(--color-fill)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-label-secondary)">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-label font-medium block">Source Code</span>
                  <span className="text-[12px] text-label-tertiary">View on GitHub</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-label-tertiary" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.a>
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
              whileHover="hover"
              initial="rest"
              transition={springTactile}
              className="relative w-full p-4 text-left transition-colors hover:bg-[rgba(255,69,58,0.1)]"
              aria-describedby="clear-data-warning"
            >
              <span
                className="relative z-10 flex items-center gap-3 text-[var(--color-error)]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.016em'
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                </svg>
                <span>Clear All Data</span>
              </span>
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
