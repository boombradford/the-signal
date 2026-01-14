import { motion } from 'framer-motion';
import { springTactile } from '../utils/animations';

/**
 * PullToRefreshIndicator - Premium iOS-style refresh indicator
 *
 * Design philosophy:
 * - Subtle, minimal visual feedback
 * - Apple-style activity indicator
 * - Smooth spring animations
 * - Elegant state transitions
 */

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  isReady,
}) {
  const opacity = Math.min(progress * 1.5, 1);
  const scale = 0.6 + progress * 0.4;
  const rotation = progress * 180;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
      style={{
        top: Math.max(pullDistance - 50, 8),
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isRefreshing ? 1 : opacity,
        scale: isRefreshing ? 1 : scale,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={springTactile}
    >
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        animate={isRefreshing ? {
          boxShadow: [
            '0 4px 16px rgba(10, 132, 255, 0.1)',
            '0 4px 24px rgba(10, 132, 255, 0.2)',
            '0 4px 16px rgba(10, 132, 255, 0.1)',
          ]
        } : {
          boxShadow: isReady 
            ? '0 4px 20px rgba(10, 132, 255, 0.2)' 
            : '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}
        transition={isRefreshing ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        } : springTactile}
      >
        {isRefreshing ? (
          // Apple-style spinning indicator
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-tint)"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.3" />
            <path d="M12 2v4" />
          </motion.svg>
        ) : (
          // Arrow indicator during pull
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isReady ? 'var(--color-tint)' : 'var(--color-label-secondary)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ rotate: rotation }}
            transition={springTactile}
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </motion.svg>
        )}
      </motion.div>
    </motion.div>
  );
}
