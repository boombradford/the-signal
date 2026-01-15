/**
 * QuickActionsMenu - iOS-style context menu
 *
 * Inspired by iOS 13+ context menus and Things 3.
 * - Blur backdrop with smooth scale animation
 * - Haptic feedback on selection
 * - Accessible keyboard navigation
 */

import { memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springQuick, triggerHaptic } from '../utils/animations';
import { useFocusTrap } from '../hooks/useFocusTrap';

const Icons = {
  bookmark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  bookmarkFilled: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  external: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
};

const QuickActionsMenu = memo(function QuickActionsMenu({
  isOpen,
  onClose,
  article,
  onSave,
  onMarkRead,
  onOpen,
  position = { x: 0, y: 0 },
}) {
  const menuRef = useFocusTrap(isOpen);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAction = (action) => {
    triggerHaptic('selection');
    action();
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: article.link,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(article.link);
    }
    onClose();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(article.link);
    triggerHaptic('success');
    onClose();
  };

  const actions = [
    {
      label: article.isSaved ? 'Remove from Saved' : 'Save Article',
      icon: article.isSaved ? Icons.bookmarkFilled : Icons.bookmark,
      action: () => onSave?.(article.id),
      accent: article.isSaved,
    },
    {
      label: article.isRead ? 'Mark as Unread' : 'Mark as Read',
      icon: Icons.check,
      action: () => onMarkRead?.(article.id),
      accent: article.isRead,
    },
    {
      label: 'Open Original',
      icon: Icons.external,
      action: () => window.open(article.link, '_blank', 'noopener'),
    },
    {
      label: 'Share',
      icon: Icons.share,
      action: handleShare,
    },
    {
      label: 'Copy Link',
      icon: Icons.copy,
      action: handleCopyLink,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
          />

          {/* Menu */}
          <motion.div
            className="fixed z-[101]"
            style={{
              left: Math.min(position.x, window.innerWidth - 240),
              top: Math.min(position.y, window.innerHeight - 300),
            }}
          >
            <motion.div
              ref={menuRef}
              role="menu"
              aria-label="Article actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springQuick}
              className="relative min-w-[220px] max-w-[280px] overflow-hidden rounded-xl"
              style={{
                background: 'rgba(38, 38, 40, 0.98)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            >
            {/* Preview header */}
            <div className="px-4 py-3 border-b border-white/5">
              <p
                className="text-[13px] font-medium text-label line-clamp-2"
                style={{ letterSpacing: '-0.008em' }}
              >
                {article.title}
              </p>
              {article.feedTitle && (
                <p
                  className="text-[11px] text-label-tertiary mt-1"
                  style={{ letterSpacing: '-0.006em' }}
                >
                  {article.feedTitle}
                </p>
              )}
            </div>

            {/* Actions list */}
            <ul className="py-1">
              {actions.map((item, index) => (
                <li key={index}>
                  <motion.button
                    role="menuitem"
                    onClick={() => handleAction(item.action)}
                    whileTap={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  >
                    <span className={item.accent ? 'text-[var(--color-tint)]' : 'text-label-secondary'}>
                      {item.icon}
                    </span>
                    <span
                      className={`text-[15px] ${item.accent ? 'text-[var(--color-tint)]' : 'text-label'}`}
                      style={{ letterSpacing: '-0.016em' }}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                </li>
              ))}
            </ul>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default QuickActionsMenu;
