import { motion } from 'framer-motion';
import { springGentle } from '../utils/animations';

/**
 * Loading Screen - Premium launch experience
 *
 * Design principles:
 * - Clean, centered layout with ambient glow
 * - Breathing animation creates life
 * - SF Pro typography
 * - Apple-level launch screen quality
 */

// Kevin Logo - Modern K with friendly wink
export function KevinLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Kevin logo"
    >
      <path
        d="M14 8v32M14 24l16-16M14 24l16 16"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="14" r="4" fill="white" />
    </svg>
  );
}

// Kevin App Icon
export function KevinAppIcon({ size = 80, className = '' }) {
  const iconSize = size * 0.5;
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: '#0A84FF'
      }}
    >
      <KevinLogo size={iconSize} />
    </div>
  );
}

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden"
      role="status"
    >
      {/* Ambient glow effect - subtle radial gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(10, 132, 255, 0.15) 0%, rgba(10, 132, 255, 0.05) 40%, transparent 70%)',
            filter: 'blur(60px)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springGentle}
        className="flex flex-col items-center relative z-10"
      >
        {/* App icon with breathing animation */}
        <motion.div
          initial={{ y: -8 }}
          animate={{ y: 0 }}
          transition={springGentle}
          className="relative"
        >
          {/* Icon glow */}
          <motion.div
            className="absolute inset-0 rounded-[18px]"
            style={{
              background: '#0A84FF',
              filter: 'blur(20px)',
              opacity: 0.4
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <KevinAppIcon size={80} className="mb-6 relative z-10" />
          </motion.div>
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springGentle }}
          className="text-[22px] text-[#F5F5F7] mb-1"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontWeight: 600,
            letterSpacing: '-0.024em'
          }}
        >
          kevin<span style={{ color: '#0A84FF' }}>.</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-[13px] text-[#86868B] mb-6"
          style={{ letterSpacing: '-0.008em' }}
        >
          Your intelligent reader
        </motion.p>

        {/* Premium loading indicator - smooth wave */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#0A84FF',
                boxShadow: '0 0 8px rgba(10, 132, 255, 0.5)'
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: [0.4, 0, 0.2, 1]
              }}
            />
          ))}
        </div>

        <span className="sr-only">Loading...</span>
      </motion.div>
    </div>
  );
}
