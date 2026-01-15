/**
 * Kevin Animation System - Premium Edition
 *
 * Calibrated for Apple, Stripe, Linear quality.
 *
 * Core principles:
 * - Critically damped or near-critically damped springs
 * - No visible bounce or overshoot
 * - Opacity leads, movement follows
 * - Subtle distances (4-8px max)
 * - Quick, precise timing
 * - Static after settling - no continuous animations
 */

// =============================================================================
// PREMIUM SPRINGS - Critically damped, no bounce
// =============================================================================

/**
 * Quick Spring - Primary interaction spring
 * Use for: buttons, toggles, immediate feedback
 * Damping ratio ~1.0 (critically damped)
 */
export const springQuick = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
  mass: 1
};

/**
 * Smooth Spring - General UI transitions
 * Use for: cards, reveals, state changes
 * Damping ratio ~0.95 (near-critical, minimal overshoot)
 */
export const springSmooth = {
  type: 'spring',
  stiffness: 300,
  damping: 34,
  mass: 1
};

/**
 * Sheet Spring - Bottom sheets and modals
 * Use for: sheets, modals, large surfaces
 * Slightly underdamped for satisfying settle
 */
export const springSheet = {
  type: 'spring',
  stiffness: 380,
  damping: 38,
  mass: 1
};

/**
 * Page Spring - Full page transitions
 * Use for: navigation, view changes
 */
export const springPage = {
  type: 'spring',
  stiffness: 260,
  damping: 32,
  mass: 1
};

/**
 * Micro Spring - Tiny elements
 * Use for: icons, badges, indicators
 */
export const springMicro = {
  type: 'spring',
  stiffness: 500,
  damping: 45,
  mass: 0.8
};

/**
 * Layout Spring - List reordering
 * Use for: list items, grid changes
 */
export const layoutSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
  mass: 1
};

/**
 * Rubber Band Spring - Overscroll physics
 * Use for: pull-to-refresh, elastic edges
 */
export const springRubberBand = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1
};

// Legacy aliases for backwards compatibility
export const springDefault = springSmooth;
export const springSnappy = springQuick;
export const springGentle = springPage;
export const springTactile = springQuick;
export const springHeavy = springPage;
export const springSlow = springPage;

// =============================================================================
// PREMIUM EASE CURVES - iOS/macOS calibrated
// =============================================================================

/**
 * Apple Ease - The signature iOS curve
 * Quick deceleration, smooth finish
 */
export const easeApple = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1.0]
};

/**
 * Apple Ease Out - Standard exit
 */
export const easeOut = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1.0]
};

/**
 * Apple Ease In Out - Symmetric
 */
export const easeInOut = {
  duration: 0.3,
  ease: [0.42, 0, 0.58, 1]
};

/**
 * Quick Ease - Fast micro-interactions
 */
export const easeQuick = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1.0]
};

/**
 * iOS Ease - Legacy alias
 */
export const easeIOS = easeApple;

// =============================================================================
// PRESET VARIANTS - Ready-to-use, premium quality
// =============================================================================

/**
 * Fade In Up - Subtle entrance (4px)
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: easeApple
};

/**
 * Fade In - Pure opacity
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: easeOut
};

/**
 * Scale In - Subtle scale (0.98)
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: easeApple
};

/**
 * Slide In From Right - Navigation push (8px)
 */
export const slideInFromRight = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: easeApple
};

/**
 * Slide In From Bottom - Sheet entrance
 */
export const slideInFromBottom = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: springSheet
};

/**
 * Slide In From Left - Back navigation
 */
export const slideInFromLeft = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: easeApple
};

// =============================================================================
// MODAL & SHEET ANIMATIONS - Premium quality
// =============================================================================

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: easeApple
};

export const sheetContent = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: springSheet
};

// =============================================================================
// INTERACTIVE STATES - Subtle, refined
// =============================================================================

/**
 * Tap Scale - Minimal feedback (0.98)
 */
export const tapScale = {
  whileTap: { scale: 0.98 },
  transition: springQuick
};

/**
 * Card Tap - Even more subtle (0.99)
 */
export const cardTap = {
  whileTap: { scale: 0.99 },
  transition: springQuick
};

/**
 * Hover Scale - Barely perceptible (1.01)
 */
export const hoverScale = {
  whileHover: { scale: 1.01 },
  transition: easeQuick
};

/**
 * Press Scale - Button press (0.97)
 */
export const pressScale = {
  whileTap: { scale: 0.97 },
  transition: springQuick
};

// Removed hoverLift - unnecessary visual noise

// =============================================================================
// STAGGER ANIMATIONS - Tight, quick cascade
// =============================================================================

export const staggerContainer = (staggerDelay = 0.03) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0
    }
  }
});

export const staggerItem = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: easeApple
};

export const staggerFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: easeQuick
};

// =============================================================================
// PAGE TRANSITIONS - iOS-style navigation
// =============================================================================

/**
 * Page Push - Enter from right
 */
export const pageTransition = {
  initial: { opacity: 0, x: 12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springPage
  },
  exit: {
    opacity: 0,
    transition: easeOut
  }
};

/**
 * Article View - Slide in from right edge
 */
export const articleTransition = {
  initial: { opacity: 0.9, x: '100%' },
  animate: {
    opacity: 1,
    x: 0,
    transition: springSheet
  },
  exit: {
    opacity: 0,
    x: '20%',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  }
};

// =============================================================================
// HAPTIC FEEDBACK - Refined patterns
// =============================================================================

/**
 * Trigger haptic feedback (mobile)
 * Calibrated for subtlety
 */
export const triggerHaptic = (style = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [6],
      medium: [10],
      heavy: [15],
      selection: [4],
      success: [6, 30, 6],
      error: [10, 20, 10, 20, 10],
      warning: [8, 15, 8]
    };
    navigator.vibrate(patterns[style] || patterns.light);
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create custom spring
 */
export const createSpring = (overrides = {}) => ({
  type: 'spring',
  stiffness: 300,
  damping: 34,
  mass: 1,
  ...overrides
});

/**
 * Create stagger config
 */
export const createStagger = (delay = 0.03, baseVariant = staggerItem) => ({
  container: staggerContainer(delay),
  item: baseVariant
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Core springs
  springQuick,
  springSmooth,
  springSheet,
  springPage,
  springMicro,
  layoutSpring,
  springRubberBand,

  // Legacy aliases
  springDefault,
  springSnappy,
  springGentle,
  springTactile,
  springHeavy,
  springSlow,

  // Ease curves
  easeApple,
  easeOut,
  easeInOut,
  easeQuick,
  easeIOS,

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
