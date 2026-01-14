/**
 * Kevin Animation System
 *
 * Premium Apple-style spring animations inspired by iOS UIKit, 
 * SwiftUI, and the work of engineers like Kyle Bashour.
 * 
 * These springs are calibrated to feel natural, responsive, 
 * and refined - the hallmark of Apple's interface design.
 */

// =============================================================================
// CORE SPRINGS - The foundation of all motion
// =============================================================================

/**
 * Default Spring - The balanced, everyday spring
 * Use for: general transitions, state changes, reveals
 */
export const springDefault = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1
};

/**
 * Snappy Spring - Quick, responsive feedback
 * Use for: button presses, toggles, immediate interactions
 */
export const springSnappy = {
  type: 'spring',
  stiffness: 450,
  damping: 32,
  mass: 0.8
};

/**
 * Gentle Spring - Smooth, elegant movements
 * Use for: modals, sheets, larger UI movements
 */
export const springGentle = {
  type: 'spring',
  stiffness: 180,
  damping: 24,
  mass: 1
};

/**
 * Bouncy Spring - Subtle delight with slight overshoot
 * Use for: celebratory moments, attention-drawing animations
 */
export const springBouncy = {
  type: 'spring',
  stiffness: 400,
  damping: 18,
  mass: 0.9
};

/**
 * Slow Spring - Dramatic, purposeful reveals
 * Use for: hero animations, dramatic transitions
 */
export const springSlow = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
  mass: 1.4
};

/**
 * Tactile Spring - The satisfying "click" feel
 * Use for: buttons, cards, interactive elements
 * This is the most iOS-like spring for interactions
 */
export const springTactile = {
  type: 'spring',
  stiffness: 600,
  damping: 40,
  mass: 0.5
};

/**
 * Micro Spring - For tiny, delightful details
 * Use for: icons, badges, small UI elements
 */
export const springMicro = {
  type: 'spring',
  stiffness: 500,
  damping: 28,
  mass: 0.4
};

/**
 * Heavy Spring - Weighty, substantial movements
 * Use for: full-screen transitions, large content
 */
export const springHeavy = {
  type: 'spring',
  stiffness: 240,
  damping: 32,
  mass: 1.6
};

/**
 * Layout Spring - Optimized for layout animations
 * Use for: reordering, list animations, grid changes
 */
export const layoutSpring = {
  type: 'spring',
  stiffness: 500,
  damping: 38,
  mass: 1
};

/**
 * Rubber Band Spring - iOS-style overscroll feel
 * Use for: pull-to-refresh, elastic behaviors
 */
export const springRubberBand = {
  type: 'spring',
  stiffness: 150,
  damping: 15,
  mass: 0.8
};

// =============================================================================
// EASE CURVES - For non-spring animations
// =============================================================================

/**
 * Ease Out - Quick start, smooth finish
 * Use for: exits, dismissals
 */
export const easeOut = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1]
};

/**
 * Ease In Out - Smooth both ends
 * Use for: symmetric transitions
 */
export const easeInOut = {
  duration: 0.3,
  ease: [0.42, 0, 0.58, 1]
};

/**
 * iOS Ease - Apple's signature curve
 * Use for: matching native iOS feel
 */
export const easeIOS = {
  duration: 0.35,
  ease: [0.4, 0.0, 0.2, 1]
};

/**
 * Quick Ease - Fast, crisp
 * Use for: small UI changes
 */
export const easeQuick = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1]
};

// =============================================================================
// PRESET VARIANTS - Ready-to-use animation configs
// =============================================================================

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: springDefault
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: easeOut
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
  transition: springTactile
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: springDefault
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
  transition: springGentle
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: springDefault
};

// =============================================================================
// MODAL & SHEET ANIMATIONS
// =============================================================================

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 24, scale: 0.96 },
  transition: springGentle
};

export const sheetContent = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: {
    type: 'spring',
    stiffness: 300,
    damping: 35,
    mass: 1
  }
};

// =============================================================================
// INTERACTIVE STATES
// =============================================================================

export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: springSnappy
};

export const cardTap = {
  whileTap: { scale: 0.985 },
  transition: springTactile
};

export const hoverLift = {
  whileHover: { y: -2 },
  transition: springDefault
};

export const hoverScale = {
  whileHover: { scale: 1.02 },
  transition: springTactile
};

export const pressScale = {
  whileTap: { scale: 0.95 },
  transition: springTactile
};

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

export const staggerContainer = (staggerDelay = 0.05) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay
    }
  }
});

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: springDefault
};

export const staggerFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: easeOut
};

// =============================================================================
// COMPLEX ANIMATIONS
// =============================================================================

/**
 * Page transition - For full view changes
 */
export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 30,
      mass: 1
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

/**
 * Article transition - Optimized for reading view
 */
export const articleTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: springGentle
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// =============================================================================
// HAPTIC FEEDBACK
// =============================================================================

/**
 * Trigger haptic feedback (mobile)
 * Patterns calibrated for different interactions
 */
export const triggerHaptic = (style = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [8],
      medium: [12],
      heavy: [20],
      selection: [5],
      success: [8, 40, 8],
      error: [15, 30, 15, 30, 15],
      warning: [10, 20, 10]
    };
    navigator.vibrate(patterns[style] || patterns.light);
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create custom spring with overrides
 */
export const createSpring = (overrides = {}) => ({
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
  ...overrides
});

/**
 * Create stagger variants
 */
export const createStagger = (delay = 0.05, baseVariant = staggerItem) => ({
  container: staggerContainer(delay),
  item: baseVariant
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Core springs
  springDefault,
  springSnappy,
  springGentle,
  springBouncy,
  springSlow,
  springTactile,
  springMicro,
  springHeavy,
  layoutSpring,
  springRubberBand,
  
  // Ease curves
  easeOut,
  easeInOut,
  easeIOS,
  easeQuick,
  
  // Presets
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInFromRight,
  slideInFromBottom,
  slideInFromLeft,
  
  // Modal/Sheet
  modalOverlay,
  modalContent,
  sheetContent,
  
  // Interactive
  tapScale,
  cardTap,
  hoverLift,
  hoverScale,
  pressScale,
  
  // Stagger
  staggerContainer,
  staggerItem,
  staggerFadeIn,
  
  // Complex
  pageTransition,
  articleTransition,
  
  // Utilities
  triggerHaptic,
  createSpring,
  createStagger
};
