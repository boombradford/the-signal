/**
 * useLongPress - iOS-style long press detection
 *
 * Premium interaction pattern for contextual menus.
 * - 500ms threshold (iOS standard)
 * - Cancels on drag
 * - Haptic feedback on trigger
 */

import { useCallback, useRef, useState } from 'react';
import { triggerHaptic } from '../utils/animations';

const LONG_PRESS_DELAY = 500; // iOS standard
const DRAG_THRESHOLD = 10; // Pixels to cancel

export function useLongPress({
  onLongPress,
  onClick,
  disabled = false,
}) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleStart = useCallback((e) => {
    if (disabled) return;

    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    startPos.current = { x: clientX, y: clientY };
    isLongPressTriggered.current = false;
    setIsPressed(true);

    timeoutRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      triggerHaptic('medium');
      onLongPress?.(e);
    }, LONG_PRESS_DELAY);
  }, [disabled, onLongPress]);

  const handleMove = useCallback((e) => {
    if (!isPressed) return;

    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;

    const deltaX = Math.abs(clientX - startPos.current.x);
    const deltaY = Math.abs(clientY - startPos.current.y);

    // Cancel if user is dragging
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      clear();
      setIsPressed(false);
    }
  }, [isPressed, clear]);

  const handleEnd = useCallback((e) => {
    clear();
    setIsPressed(false);

    // Only trigger click if it wasn't a long press
    if (!isLongPressTriggered.current && onClick) {
      onClick(e);
    }
  }, [clear, onClick]);

  const handleContextMenu = useCallback((e) => {
    // Prevent browser context menu on long press
    if (isPressed || isLongPressTriggered.current) {
      e.preventDefault();
    }
  }, [isPressed]);

  return {
    handlers: {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      onMouseDown: handleStart,
      onMouseMove: handleMove,
      onMouseUp: handleEnd,
      onMouseLeave: () => {
        clear();
        setIsPressed(false);
      },
      onContextMenu: handleContextMenu,
    },
    isPressed,
  };
}

export default useLongPress;
