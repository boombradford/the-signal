import { motion } from 'framer-motion';
import { springTactile, springMicro, triggerHaptic } from '../utils/animations';

/**
 * Kevin Logo - HEAVY. DENSE. ICONIC.
 *
 * Design inspiration: Marvel, LEGO, Netflix, ESPN
 * - Block letter weight
 * - Maximum visual density
 * - Fills the space with confidence
 * - Unmistakable at any size
 */

// The K - SOLID BLOCK FORM
const KGlyph = ({ size = 24, animated = false }) => {
  // HEAVY strokes - block letter weight
  const scale = size / 32;
  const stemWidth = 6 * scale;
  const armWidth = 5 * scale;
  const arcWidth = 4 * scale;
  
  const drawVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay = 0) => ({
      pathLength: 1,
      opacity: 1,
      transition: { 
        duration: 0.35, 
        delay,
        ease: [0.4, 0, 0.2, 1] 
      }
    })
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none"
      aria-hidden="true"
    >
      <g 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* K STEM - HEAVY BLOCK */}
        <motion.path 
          d="M5 3v26" 
          strokeWidth={stemWidth}
          variants={animated ? drawVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0}
        />
        
        {/* K UPPER - BOLD DIAGONAL */}
        <motion.path 
          d="M5 16L14 5" 
          strokeWidth={armWidth}
          variants={animated ? drawVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0.08}
        />
        
        {/* K LOWER - BOLD DIAGONAL */}
        <motion.path 
          d="M5 16L15 29" 
          strokeWidth={armWidth}
          variants={animated ? drawVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0.12}
        />
        
        {/* SIGNAL ARC - THICK, BOLD */}
        <motion.path 
          d="M18 7c2.5 2.2 4 5.5 4 9s-1.5 6.8-4 9"
          strokeWidth={arcWidth}
          variants={animated ? drawVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0.2}
        />
        
        {/* SIGNAL ARC 2 - STILL BOLD */}
        <motion.path 
          d="M24 3c3 3.2 5 8 5 13s-2 9.8-5 13"
          strokeWidth={arcWidth * 0.75}
          strokeOpacity={0.5}
          variants={animated ? drawVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0.28}
        />
      </g>
    </svg>
  );
};

/**
 * Hero Logo - MAXIMUM IMPACT
 */
export function KevinLogoHero({ onAnimationComplete }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* LARGE BOLD GLYPH */}
      <motion.div
        className="text-[var(--color-label)]"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          delay: 0.05 
        }}
      >
        <KGlyph size={160} animated />
      </motion.div>
      
      {/* HEAVY WORDMARK */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={onAnimationComplete}
      >
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-0.07em',
            color: 'var(--color-label)',
            lineHeight: 0.9,
            textTransform: 'lowercase',
          }}
        >
          kevin
        </span>
      </motion.div>
      
      {/* TAGLINE */}
      <motion.p
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: 'var(--color-label-tertiary)',
          textTransform: 'uppercase',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.3 }}
      >
        Your Signal
      </motion.p>
    </motion.div>
  );
}

/**
 * Navigation Logo - DENSE BLOCK
 */
export default function KevinLogo({ 
  onClick, 
  size = 'default', 
  variant = 'wordmark' 
}) {
  const sizes = {
    small: { icon: 22, fontSize: 18, gap: 4, weight: 900 },
    default: { icon: 28, fontSize: 22, gap: 5, weight: 900 },
    large: { icon: 36, fontSize: 28, gap: 6, weight: 900 }
  };

  const s = sizes[size];

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <motion.button
        onClick={() => {
          triggerHaptic('selection');
          onClick?.();
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        transition={springTactile}
        className="relative flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)]"
        style={{
          width: s.icon + 10,
          height: s.icon + 10,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
        }}
        aria-label="Kevin - Home"
      >
        <div className="text-[var(--color-label)]">
          <KGlyph size={s.icon - 4} />
        </div>
      </motion.button>
    );
  }

  // Wordmark - HEAVY BLOCK LETTERS
  return (
    <motion.button
      onClick={() => {
        triggerHaptic('selection');
        onClick?.();
      }}
      whileTap={{ scale: 0.97 }}
      transition={springTactile}
      className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)] rounded group"
      style={{ gap: s.gap }}
      aria-label="Kevin - Home"
    >
      {/* BOLD K */}
      <motion.div
        className="text-[var(--color-label)] transition-colors duration-100 group-hover:text-[var(--color-tint)]"
        whileHover={{ scale: 1.04 }}
        transition={springMicro}
      >
        <KGlyph size={s.icon - 6} />
      </motion.div>
      
      {/* HEAVY WORDMARK */}
      <span
        className="transition-colors duration-100"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          fontSize: s.fontSize,
          fontWeight: s.weight,
          letterSpacing: '-0.065em',
          color: 'var(--color-label)',
          lineHeight: 1,
        }}
      >
        kevin
      </span>
    </motion.button>
  );
}

/**
 * Favicon - BOLD AT TINY SIZES
 */
export function KevinFavicon({ size = 32 }) {
  const scale = size / 32;
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3v26" strokeWidth={6 * scale} />
        <path d="M5 16L14 5" strokeWidth={5 * scale} />
        <path d="M5 16L15 29" strokeWidth={5 * scale} />
        <path d="M18 7c2.5 2.2 4 5.5 4 9s-1.5 6.8-4 9" strokeWidth={4 * scale} />
        <path d="M24 3c3 3.2 5 8 5 13s-2 9.8-5 13" strokeWidth={3 * scale} strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

/**
 * Wordmark Only - BLOCK TYPOGRAPHY
 */
export function KevinWordmark({ size = 'default' }) {
  const sizes = {
    small: { fontSize: 28, weight: 900 },
    default: { fontSize: 40, weight: 900 },
    large: { fontSize: 56, weight: 900 },
    hero: { fontSize: 96, weight: 900 }
  };

  const s = sizes[size];

  return (
    <span
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        fontSize: s.fontSize,
        fontWeight: s.weight,
        letterSpacing: '-0.07em',
        color: 'var(--color-label)',
        lineHeight: 0.9,
      }}
    >
      kevin
    </span>
  );
}
