/**
 * SwipeableArticleCard - Premium gesture-driven article interactions
 *
 * Inspired by Things 3, Apple Mail, and Fantastical.
 * - Swipe right: Save/unsave article
 * - Swipe left: Mark as read
 * - Long press: Quick actions menu
 * - Threshold-based actions with haptic feedback
 * - Smooth spring physics with visual indicators
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import ArticleCard from './ArticleCard';
import QuickActionsMenu from './QuickActionsMenu';
import { springQuick, triggerHaptic } from '../utils/animations';

const HINT_KEY = 'kevin_swipe_hint_shown';

const SWIPE_THRESHOLD = 80; // pixels to trigger action
const MAX_SWIPE = 120; // max visual swipe distance

const Icons = {
  bookmark: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  bookmarkFilled: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  check: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  checkDouble: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L7 17l-5-5" />
      <path d="M22 10L11 21" />
    </svg>
  )
};

const LONG_PRESS_DELAY = 500;
const LONG_PRESS_THRESHOLD = 5;

const SwipeableArticleCard = memo(function SwipeableArticleCard({
  article,
  feedTitle,
  onClick,
  onSave,
  onMarkRead,
  density = 'comfortable',
  isSelected = false,
  index
}) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const hasTriggeredHaptic = useRef(false);
  const actionTriggered = useRef(null);
  const longPressTimeout = useRef(null);
  const longPressTriggered = useRef(false);
  const touchStart = useRef({ x: 0, y: 0 });

  // Show hint animation for first card on first visit
  useEffect(() => {
    if (index === 0) {
      const hintShown = localStorage.getItem(HINT_KEY);
      if (!hintShown) {
        const timer = setTimeout(() => {
          setShowHint(true);
          // Animate a subtle hint
          animate(x, 30, { type: 'spring', stiffness: 300, damping: 20 });
          setTimeout(() => {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
            localStorage.setItem(HINT_KEY, 'true');
            setShowHint(false);
          }, 600);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [index, x]);

  // Transform x position to background colors and icon opacities
  const leftBgOpacity = useTransform(x, [-MAX_SWIPE, -SWIPE_THRESHOLD, 0], [1, 0.8, 0]);
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD, MAX_SWIPE], [0, 0.8, 1]);

  // Icon scale based on threshold
  const leftIconScale = useTransform(x, [-MAX_SWIPE, -SWIPE_THRESHOLD, -40, 0], [1.1, 1, 0.8, 0.6]);
  const rightIconScale = useTransform(x, [0, 40, SWIPE_THRESHOLD, MAX_SWIPE], [0.6, 0.8, 1, 1.1]);

  // Handle drag updates for haptic feedback at threshold
  const handleDrag = useCallback((_, info) => {
    const offset = info.offset.x;

    // Trigger haptic when crossing threshold
    if (Math.abs(offset) >= SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
      triggerHaptic('medium');
      hasTriggeredHaptic.current = true;
      actionTriggered.current = offset > 0 ? 'save' : 'read';
    }

    // Reset haptic state if user pulls back below threshold
    if (Math.abs(offset) < SWIPE_THRESHOLD && hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = false;
      actionTriggered.current = null;
    }
  }, []);

  // Handle drag end - execute action if threshold met
  const handleDragEnd = useCallback((_, info) => {
    setIsDragging(false);
    const offset = info.offset.x;

    if (offset >= SWIPE_THRESHOLD) {
      // Swipe right - save
      triggerHaptic('success');
      onSave?.(article.id);
    } else if (offset <= -SWIPE_THRESHOLD) {
      // Swipe left - mark read
      triggerHaptic('success');
      onMarkRead?.(article.id);
    }

    // Animate back to center
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    hasTriggeredHaptic.current = false;
    actionTriggered.current = null;
  }, [x, article.id, onSave, onMarkRead]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hasTriggeredHaptic.current = false;
    // Cancel long press if dragging
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  // Long press handlers for quick actions menu
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggered.current = false;

    longPressTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      triggerHaptic('medium');
      setMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowQuickActions(true);
    }, LONG_PRESS_DELAY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!longPressTimeout.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.current.x);
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);

    // Cancel if user moves finger
    if (deltaX > LONG_PRESS_THRESHOLD || deltaY > LONG_PRESS_THRESHOLD) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    triggerHaptic('medium');
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowQuickActions(true);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-150 ${
        isSelected ? 'ring-2 ring-[var(--color-tint)] ring-offset-2 ring-offset-[var(--color-background)]' : ''
      }`}
      data-article-index={index}
    >
      {/* Background action indicators */}
      <div className="absolute inset-0 flex">
        {/* Left side - Mark as read */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-start pl-6"
          style={{
            opacity: leftBgOpacity,
            background: 'rgba(48, 209, 88, 0.15)'
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            style={{
              scale: leftIconScale,
              color: '#30D158',
            }}
          >
            {article.isRead ? Icons.checkDouble : Icons.check}
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {article.isRead ? 'Read' : 'Mark Read'}
            </span>
          </motion.div>
        </motion.div>

        {/* Right side - Save */}
        <motion.div
          className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end pr-6"
          style={{
            opacity: rightBgOpacity,
            background: 'rgba(10, 132, 255, 0.15)'
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            style={{
              scale: rightIconScale,
              color: '#0A84FF',
            }}
          >
            {article.isSaved ? Icons.bookmarkFilled : Icons.bookmark}
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {article.isSaved ? 'Saved' : 'Save'}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Draggable card layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        style={{ x }}
        className={`relative bg-[var(--color-background)] ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <ArticleCard
          article={article}
          feedTitle={feedTitle}
          onClick={onClick}
          density={density}
        />

        {/* First-use hint tooltip */}
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="px-4 py-2 rounded-full text-[11px] font-semibold text-white whitespace-nowrap"
              style={{
                background: 'var(--color-tint)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)',
              }}
            >
              <span className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Swipe to save or mark read
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        article={article}
        onSave={onSave}
        onMarkRead={onMarkRead}
        position={menuPosition}
      />
    </div>
  );
});

export default SwipeableArticleCard;
