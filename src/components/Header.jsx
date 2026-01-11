import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Header({
  title,
  subtitle,
  scrollRef,
  rightAction,
  leftAction,
  showBackButton = false,
  onBack
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

  // Calculate transforms based on scroll
  const isCollapsed = scrollY > 40;
  const largeTitleOpacity = Math.max(0, 1 - scrollY / 40);
  const largeTitleScale = Math.max(0.8, 1 - scrollY / 200);
  const largeTitleY = Math.min(0, -scrollY * 0.5);

  return (
    <>
      {/* Fixed Navigation Bar */}
      <header
        className="ios-navbar"
        role="banner"
        style={{
          backgroundColor: isCollapsed
            ? 'var(--material-regular)'
            : 'transparent',
          borderBottomColor: isCollapsed
            ? 'var(--color-separator)'
            : 'transparent'
        }}
      >
        <div className="ios-navbar-content">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-[60px]">
            {showBackButton && (
              <button
                onClick={onBack}
                className="ios-button -ml-2 gap-0.5"
                aria-label="Go back"
              >
                <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 2L2 10L10 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Back</span>
              </button>
            )}
            {leftAction}
          </div>

          {/* Center - collapsed title */}
          <motion.span
            className="font-display font-semibold text-[17px] text-label absolute left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isCollapsed ? 1 : 0,
              y: isCollapsed ? 0 : 10
            }}
            transition={{ duration: 0.2 }}
            aria-hidden={!isCollapsed}
          >
            {title}
          </motion.span>

          {/* Right side */}
          <div className="flex items-center gap-2 min-w-[60px] justify-end">
            {rightAction}
          </div>
        </div>
      </header>

      {/* Large Title (scrolls away) */}
      <div
        className="pt-[calc(44px+env(safe-area-inset-top))] px-4 pb-2"
        style={{
          opacity: largeTitleOpacity,
          transform: `scale(${largeTitleScale}) translateY(${largeTitleY}px)`,
          transformOrigin: 'left center'
        }}
        aria-hidden={isCollapsed}
      >
        <h1 className="font-display font-bold text-[34px] tracking-tight text-label">
          {title}
        </h1>
        {subtitle && (
          <p className="text-label-secondary text-[15px] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
}

// Simplified header for article views
export function SimpleHeader({ title, onBack, rightAction }) {
  return (
    <header className="ios-navbar" role="banner">
      <div className="ios-navbar-content">
        <button
          onClick={onBack}
          className="ios-button -ml-2 gap-0.5"
          aria-label="Go back"
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
            <path
              d="M10 2L2 10L10 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </button>

        <span className="font-display font-medium text-[15px] text-label-secondary truncate max-w-[200px]">
          {title}
        </span>

        <div className="min-w-[60px] flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
