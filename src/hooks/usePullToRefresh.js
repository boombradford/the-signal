import { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../utils/animations';

const THRESHOLD = 80;
const RESISTANCE = 0.5;
const MAX_PULL = 150;

export function usePullToRefresh({ onRefresh, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollRef = useRef(null);
  const startY = useRef(0);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep refs in sync
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      if (disabled || isRefreshingRef.current) return;
      if (element.scrollTop > 5) return;

      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hasTriggeredHaptic.current = false;
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || disabled || isRefreshingRef.current) return;
      if (element.scrollTop > 5) {
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      if (delta > 0) {
        const resistedDelta = Math.min(
          delta * RESISTANCE * (1 - delta / (MAX_PULL * 4)),
          MAX_PULL
        );

        setPullDistance(resistedDelta);

        if (resistedDelta >= THRESHOLD && !hasTriggeredHaptic.current) {
          triggerHaptic('medium');
          hasTriggeredHaptic.current = true;
        }

        if (delta > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || disabled) return;

      isPullingRef.current = false;
      const currentPull = pullDistanceRef.current;

      if (currentPull >= THRESHOLD && onRefreshRef.current) {
        setIsRefreshing(true);
        triggerHaptic('success');

        try {
          await onRefreshRef.current();
        } finally {
          await new Promise(r => setTimeout(r, 300));
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
  }, [disabled]);

  return {
    scrollRef,
    pullDistance,
    isRefreshing,
    isPulling: isPullingRef.current,
    progress: Math.min(pullDistance / THRESHOLD, 1),
    isReady: pullDistance >= THRESHOLD,
  };
}

export default usePullToRefresh;
