import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] transition-all ${
          isFocused
            ? 'bg-[var(--color-background)] ring-2 ring-[var(--color-tint)]'
            : 'bg-[var(--color-fill)]'
        }`}
      >
        <span className={`transition-colors ${isFocused ? 'text-[var(--color-tint)]' : 'text-label-tertiary'}`}>
          {Icons.search}
        </span>

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[15px] text-label placeholder:text-label-tertiary outline-none"
          aria-label="Search articles"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClear}
              className="text-label-tertiary hover:text-label-secondary transition-colors"
              aria-label="Clear search"
            >
              {Icons.clear}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard hint */}
      {!isFocused && !value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-label-tertiary bg-[var(--color-fill-secondary)] rounded">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
      )}
    </div>
  );
}
