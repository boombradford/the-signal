import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const shortcuts = [
  { keys: ['Esc'], description: 'Close article view' },
  { keys: ['⌘', 'S'], description: 'Save article for later' },
  { keys: ['⌘', 'O'], description: 'Open original in new tab' },
  { keys: ['⌘', 'K'], description: 'Focus search' },
  { keys: ['Enter'], description: 'Open selected article' },
  { keys: ['?'], description: 'Toggle this help' },
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
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

  // Prevent scroll when modal is open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="bg-[var(--color-grouped-background)] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-5 pb-3 border-b border-[var(--color-separator)]">
                <h2
                  id="shortcuts-title"
                  className="font-display font-semibold text-lg text-label text-center"
                >
                  Keyboard Shortcuts
                </h2>
              </div>

              {/* Shortcuts list */}
              <div className="px-5 py-3">
                <ul className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-[15px] text-label">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-[13px] font-medium text-label-secondary bg-[var(--color-fill)] rounded-md border border-[var(--color-separator)] shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[13px] text-label-tertiary text-center">
                  Use Ctrl instead of ⌘ on Windows/Linux
                </p>
              </div>

              {/* Close button */}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 text-[17px] font-semibold text-[var(--color-tint)] bg-[var(--color-fill)] rounded-xl active:opacity-70 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
