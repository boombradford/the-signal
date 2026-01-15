import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import KevinLogo from './KevinLogo';
import { springTactile, triggerHaptic } from '../utils/animations';

/**
 * Header - Premium navigation with Apple-style typography
 *
 * Design principles:
 * - SF Pro Display for large titles, SF Pro Text for body
 * - Jony Ive simplicity - every element earns its place
 * - Craig Federighi polish - delightful attention to detail
 * - Alan Dye clarity - information hierarchy that feels effortless
 */

// Format date like iOS: "Tuesday, January 14"
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
};

// Time-aware greeting - personal, not generic
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Tonight';
};

export default function Header({
  title,
  subtitle,
  scrollRef,
  rightAction,
  leftAction,
  showBackButton = false,
  onBack,
  onLogoClick,
  showLogo = true
}) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const container = scrollRef?.current || window;

    const handleScroll = () => {
      const y = scrollRef?.current?.scrollTop ?? window.scrollY;
      setScrollY(y);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  // Smooth transition: 0-80px scroll range
  const scrollProgress = Math.min(scrollY / 80, 1);
  const headerOpacity = scrollProgress;
  const titleOpacity = scrollProgress;

  return (
    <>
      {/* Fixed Navigation Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        role="banner"
      >
        {/* Glass background layer */}
        <div
          className="absolute inset-0"
          style={{
            background: `rgba(0, 0, 0, ${0.84 * headerOpacity})`,
            backdropFilter: scrollProgress > 0.1 ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrollProgress > 0.1 ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: `0.5px solid rgba(255, 255, 255, ${0.06 * headerOpacity})`
          }}
        />
        <div className="safe-top relative z-10" />
        <div className="h-11 flex items-center justify-between px-4 max-w-3xl mx-auto relative z-10">
          {/* Left side */}
          <div className="flex items-center gap-3 min-w-[100px]">
            {showBackButton ? (
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  onBack();
                }}
                whileTap={{ scale: 0.95, x: -2 }}
                transition={springTactile}
                className="flex items-center gap-1 -ml-1 text-[var(--color-tint)]"
                aria-label="Go back"
              >
                <svg
                  width="8"
                  height="14"
                  viewBox="0 0 8 14"
                  fill="none"
                >
                  <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[17px] font-normal" style={{ letterSpacing: '-0.022em' }}>
                  Back
                </span>
              </motion.button>
            ) : leftAction ? (
              leftAction
            ) : (
              showLogo && onLogoClick && (
                <KevinLogo onClick={onLogoClick} size="default" />
              )
            )}
          </div>

          {/* Center - title on scroll */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ opacity: titleOpacity }}
          >
            <span
              className="text-[var(--color-label)]"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.022em',
              }}
            >
              {title === 'Today' ? getGreeting() : title}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 min-w-[100px] justify-end">
            {rightAction}
          </div>
        </div>
      </header>

      {/* Large Title Area - Contextual greeting, no animation */}
      <div className="pt-[calc(44px+env(safe-area-inset-top))] px-5 pb-4 max-w-3xl mx-auto">
        {title === 'Today' ? (
          <>
            {/* Greeting - static, confident */}
            <h1
              className="text-[var(--color-label)] leading-[1.05]"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontSize: '34px',
                fontWeight: 700,
                letterSpacing: '-0.032em',
              }}
            >
              {getGreeting()}
            </h1>

            {/* Date + article count */}
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="text-[var(--color-label-secondary)] text-[15px]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.016em',
                }}
              >
                {formatDate()}
              </span>
              {subtitle && (
                <>
                  <span className="text-[var(--color-label-quaternary)]">·</span>
                  <span
                    className="text-[var(--color-label-tertiary)] text-[15px]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.016em',
                    }}
                  >
                    {subtitle}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Standard title for non-Today views */}
            <h1
              className="text-[var(--color-label)] leading-[1.05]"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontSize: '34px',
                fontWeight: 700,
                letterSpacing: '-0.032em',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-[var(--color-label-tertiary)] mt-2"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 400,
                  letterSpacing: '-0.016em',
                }}
              >
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

/**
 * SimpleHeader - For article views and detail screens
 * Premium with haptic feedback and spring transitions
 */
export function SimpleHeader({ title, onBack, rightAction, onLogoClick }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      role="banner"
      style={{
        background: 'rgba(0, 0, 0, 0.84)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div className="safe-top" />
      <div className="h-11 flex items-center justify-between px-4 max-w-3xl mx-auto">
        {/* Back button */}
        <div className="min-w-[80px]">
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              onBack();
            }}
            whileTap={{ scale: 0.95, x: -2 }}
            transition={springTactile}
            className="flex items-center gap-1 -ml-1 text-[var(--color-tint)]"
            aria-label="Go back"
          >
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
            >
              <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] font-normal" style={{ letterSpacing: '-0.022em' }}>
              Back
            </span>
          </motion.button>
        </div>

        {/* Center - logo or title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {onLogoClick ? (
            <KevinLogo onClick={onLogoClick} size="small" />
          ) : (
            <span
              className="text-[17px] font-semibold text-[var(--color-label)] truncate max-w-[180px]"
              style={{ letterSpacing: '-0.022em' }}
            >
              {title}
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="min-w-[80px] flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
