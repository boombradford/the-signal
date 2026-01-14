import { motion, AnimatePresence } from 'framer-motion';
import { useCounts } from '../hooks/useDatabase';
import { springSnappy, springTactile, triggerHaptic } from '../utils/animations';
import { useCallback } from 'react';

/**
 * BottomNav - SF Symbols-style Tab Bar
 *
 * Design principles:
 * - Clean SF Symbols-inspired icons
 * - Subtle active states
 * - Compact, purposeful layout
 */

// Icons - SF Symbols style
const Icons = {
  feed: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  discover: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <polygon points="14.5 9.5 13 13 9.5 14.5 11 11 14.5 9.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  saved: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  ),
  settings: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
};

export default function BottomNav({ activeTab, onTabChange }) {
  const { unread, saved } = useCounts();

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Icons.feed, badge: unread > 0 ? unread : null },
    { id: 'discover', label: 'Discover', icon: Icons.discover, badge: null },
    { id: 'saved', label: 'Saved', icon: Icons.saved, badge: saved > 0 ? saved : null },
    { id: 'settings', label: 'Settings', icon: Icons.settings, badge: null }
  ];

  // Premium tab change with haptic feedback
  const handleTabChange = useCallback((tabId) => {
    if (tabId !== activeTab) {
      triggerHaptic('selection');
    }
    onTabChange(tabId);
  }, [activeTab, onTabChange]);

  // Get active tab index for indicator positioning
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="relative h-[50px] flex items-center justify-around max-w-[500px] mx-auto">
        {/* Active indicator - animated pill that slides */}
        <motion.div
          className="absolute top-1 h-[2px] rounded-full"
          style={{
            width: 'calc(25% - 24px)',
            background: 'var(--color-tint)',
            boxShadow: '0 0 8px rgba(10, 132, 255, 0.5)'
          }}
          animate={{
            left: `calc(${activeIndex * 25}% + 12px)`
          }}
          transition={springTactile}
        />

        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] transition-colors duration-150 ${
                isActive
                  ? 'text-[var(--color-tint)]'
                  : 'text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)]'
              }`}
              role="tab"
              aria-selected={isActive}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
            >
              {/* Icon with subtle scale on active */}
              <motion.div
                className="relative"
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={springTactile}
              >
                {tab.icon(isActive)}

                {/* Badge - with improved animation */}
                <AnimatePresence>
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={springTactile}
                      className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1
                                 text-[10px] font-semibold text-white bg-[#FF3B30]
                                 rounded-full flex items-center justify-center"
                      style={{
                        boxShadow: '0 2px 6px rgba(255, 59, 48, 0.4)'
                      }}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <span
                className="text-[10px] font-medium"
                style={{ letterSpacing: '0.01em' }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
