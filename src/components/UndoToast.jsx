/**
 * UndoToast - Elegant undo notification
 *
 * Inspired by Apple's undo patterns and Things 3.
 * - Slides up from bottom
 * - Auto-dismisses after timeout
 * - Swipe down to dismiss
 * - Haptic feedback on actions
 */

import { memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { springQuick, triggerHaptic } from '../utils/animations';

const Icons = {
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M3 13c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9c-2.5 0-4.76-1.02-6.4-2.67" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bookmark: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

const TOAST_DURATION = 4000; // 4 seconds

const UndoToast = memo(function UndoToast({
  isVisible,
  message,
  actionType = 'default', // 'save' | 'read' | 'default'
  onUndo,
  onDismiss,
}) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 50], [1, 0]);
  const timerRef = useRef(null);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (isVisible) {
      timerRef.current = setTimeout(() => {
        onDismiss?.();
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, onDismiss]);

  const handleUndo = () => {
    triggerHaptic('success');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onUndo?.();
    onDismiss?.();
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 30) {
      // Swiped down - dismiss
      triggerHaptic('light');
      onDismiss?.();
    } else {
      // Spring back
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  const getIcon = () => {
    switch (actionType) {
      case 'save':
        return Icons.bookmark;
      case 'read':
        return Icons.check;
      default:
        return Icons.check;
    }
  };

  const getAccentColor = () => {
    switch (actionType) {
      case 'save':
        return 'var(--color-tint)';
      case 'read':
        return '#30D158';
      default:
        return 'var(--color-tint)';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={springQuick}
          drag="y"
          dragConstraints={{ top: 0, bottom: 100 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ y, opacity }}
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 right-4 z-[90] mx-auto max-w-sm"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(38, 38, 40, 0.95)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Icon */}
            <div className="relative shrink-0">
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${getAccentColor()}20`,
                }}
              >
                <span style={{ color: getAccentColor() }}>
                  {getIcon()}
                </span>
              </div>
            </div>

            {/* Message */}
            <p
              className="flex-1 text-[14px] text-label font-medium line-clamp-1"
              style={{ letterSpacing: '-0.016em' }}
            >
              {message}
            </p>

            <motion.button
              onClick={handleUndo}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={springQuick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white overflow-hidden"
              style={{
                background: 'var(--color-tint)',
                boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                letterSpacing: '-0.008em'
              }}
            >
              <span>{Icons.undo}</span>
              <span>Undo</span>
            </motion.button>
          </div>

          {/* Swipe hint indicator */}
          <div className="flex justify-center mt-1">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default UndoToast;
