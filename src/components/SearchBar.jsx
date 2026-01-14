import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy, springTactile, triggerHaptic } from '../utils/animations';

const Icons = {
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  clear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

export default function SearchBar({ value, onChange, onClear, placeholder = "Search articles..." }) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to blur and clear
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        if (value) onClear?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, onClear]);

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={isFocused ? { scale: 1.005 } : { scale: 1 }}
      transition={springTactile}
    >
      <div
        className={`flex items-center gap-3 h-12 px-4 rounded-2xl transition-all duration-200`}
        style={{
          background: isFocused
            ? 'rgba(10, 132, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isFocused
            ? '1px solid rgba(10, 132, 255, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(10, 132, 255, 0.12), 0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 2px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        }}
      >
        <motion.span
          className="text-label-tertiary"
          animate={isFocused ? { scale: 1.05, color: 'var(--color-tint)' } : { scale: 1 }}
          transition={springTactile}
        >
          {Icons.search}
        </motion.span>

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            triggerHaptic('selection');
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[15px] text-label placeholder:text-label-tertiary/60 outline-none"
          style={{
            fontWeight: 500,
            letterSpacing: '-0.016em'
          }}
          aria-label="Search articles"
        />

        <AnimatePresence mode="popLayout">
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={springTactile}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                triggerHaptic('light');
                onClear();
              }}
              className="text-label-tertiary hover:text-label-secondary transition-colors"
              aria-label="Clear search"
            >
              {Icons.clear}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard hint - refined with better styling */}
      <AnimatePresence>
        {!isFocused && !value && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-label-tertiary rounded-md"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                letterSpacing: '0.02em'
              }}
            >
              <span>⌘</span>K
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
