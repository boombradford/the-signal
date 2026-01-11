import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen bg-[var(--color-background)] flex items-center justify-center"
      role="status"
      aria-label="Loading The Signal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        {/* App icon */}
        <motion.div
          className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[var(--color-tint)] to-[#5856D6] flex items-center justify-center mb-6"
          style={{
            boxShadow: '0 4px 24px rgba(var(--color-tint-rgb), 0.3)'
          }}
          aria-hidden="true"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1.5" fill="white" />
          </svg>
        </motion.div>

        {/* App name */}
        <h1 className="font-display font-bold text-2xl text-label mb-2">
          The Signal
        </h1>

        {/* Loading indicator */}
        <div className="flex gap-1.5 mt-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--color-tint)]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        <span className="sr-only">Loading application...</span>
      </motion.div>
    </div>
  );
}
