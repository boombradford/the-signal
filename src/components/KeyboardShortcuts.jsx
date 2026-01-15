import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { springQuick, easeApple, triggerHaptic } from '../utils/animations';

const shortcuts = [
  // Navigation
  { keys: ['J'], description: 'Next article', category: 'Navigation' },
  { keys: ['K'], description: 'Previous article' },
  { keys: ['O'], description: 'Open selected article' },
  { keys: ['Esc'], description: 'Clear selection / Close' },
  // Actions
  { keys: ['S'], description: 'Save article', category: 'Actions' },
  { keys: ['M'], description: 'Mark as read' },
  { keys: ['⌘', 'O'], description: 'Open original link' },
  // General
  { keys: ['?'], description: 'Toggle this help', category: 'General' },
  { keys: ['⌘', 'K'], description: 'Focus search' },
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
  const focusTrapRef = useFocusTrap(isOpen);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={easeApple}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            tabIndex={-1}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(28, 28, 30, 0.92)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
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
                <ul className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <li key={index}>
                      {shortcut.category && (
                        <p className="text-[11px] font-medium text-label-tertiary uppercase tracking-wider mb-2 mt-2 first:mt-0">
                          {shortcut.category}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[15px] text-label">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, keyIndex) => (
                            <motion.kbd
                              key={keyIndex}
                              className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[12px] font-medium rounded"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                color: 'var(--color-label-secondary)',
                              }}
                              whileHover={{
                                background: 'rgba(10, 132, 255, 0.15)',
                                borderColor: 'rgba(10, 132, 255, 0.3)',
                                color: '#0A84FF',
                                boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                              }}
                              transition={{ duration: 0.15 }}
                            >
                              {key}
                            </motion.kbd>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 pt-3 border-t border-[var(--color-separator)] text-[12px] text-label-tertiary text-center">
                  Swipe cards to save or mark as read
                </p>
              </div>

              {/* Close button */}
              <div className="px-5 pb-5 pt-2">
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={springQuick}
                  className="w-full py-3 text-[17px] font-semibold text-white rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--color-tint)',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                  }}
                >
                  Done
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
