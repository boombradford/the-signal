import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/animations';

/**
 * usePullToRefresh - Premium iOS-style pull-to-refresh
 */

const THRESHOLD = 80;
const RESISTANCE = 0.5;
const MAX_PULL = 150;

export function usePullToRefresh({
  onRefresh,
  disabled = false,
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep onRefresh ref current
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      if (disabled || isRefreshing) return;

      const scrollTop = element.scrollTop;
      if (scrollTop > 5) return; // Only trigger near top

      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || disabled || isRefreshing) return;

      const scrollTop = element.scrollTop;
      if (scrollTop > 5) {
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      if (delta > 0) {
        // Apply resistance
        const resistedDelta = Math.min(
          delta * RESISTANCE * (1 - delta / (MAX_PULL * 4)),
          MAX_PULL
        );

        setPullDistance(resistedDelta);

        // Haptic at threshold
        if (resistedDelta >= THRESHOLD && !hasTriggeredHaptic.current) {
          triggerHaptic('medium');
          hasTriggeredHaptic.current = true;
        }

        // Prevent scroll when pulling
        if (delta > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || disabled) return;

      isPulling.current = false;
      const currentPullDistance = pullDistance;

      if (currentPullDistance >= THRESHOLD && onRefreshRef.current) {
        setIsRefreshing(true);
        triggerHaptic('success');

        try {
          await onRefreshRef.current();
        } finally {
          await new Promise(resolve => setTimeout(resolve, 300));
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const isReady = pullDistance >= THRESHOLD;

  return {
    scrollRef,
    pullDistance,
    isRefreshing,
    isPulling: isPulling.current,
    progress,
    isReady,
  };
}

export default usePullToRefresh;
