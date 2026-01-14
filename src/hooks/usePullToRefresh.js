import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/animations';

/**
 * usePullToRefresh - Premium iOS-style pull-to-refresh
 *
 * Design philosophy:
 * - Rubber-band physics feel
 * - Haptic feedback at threshold
 * - Smooth spring-based animations
 * - Subtle, refined indicator
 */

const THRESHOLD = 80; // Distance to trigger refresh
const RESISTANCE = 0.4; // Pull resistance factor (0-1)
const MAX_PULL = 140; // Maximum pull distance

export function usePullToRefresh({
  onRefresh,
  disabled = false,
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const scrollRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return; // Only trigger at top
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
    setHasTriggeredHaptic(false);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    
    if (delta > 0) {
      // Apply resistance for rubber-band feel
      const resistedDelta = Math.min(
        delta * RESISTANCE * (1 - delta / (MAX_PULL * 3)),
        MAX_PULL
      );
      
      setPullDistance(resistedDelta);
      
      // Haptic feedback when crossing threshold
      if (resistedDelta >= THRESHOLD && !hasTriggeredHaptic) {
        triggerHaptic('medium');
        setHasTriggeredHaptic(true);
      }
      
      // Prevent default scroll
      if (delta > 5) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, hasTriggeredHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } finally {
        // Smooth return animation
        await new Promise(resolve => setTimeout(resolve, 400));
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Spring back
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, onRefresh, disabled]);

  // Attach touch listeners
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const isReady = pullDistance >= THRESHOLD;

  return {
    scrollRef,
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
    isReady,
  };
}

export default usePullToRefresh;
