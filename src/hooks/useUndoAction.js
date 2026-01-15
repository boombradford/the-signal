/**
 * useUndoAction - Manages undoable actions with toast notifications
 *
 * Provides optimistic UI updates with rollback capability.
 * - Stores last action for undo
 * - Manages toast visibility
 * - Auto-clears after timeout
 */

import { useState, useCallback, useRef } from 'react';

export function useUndoAction() {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    actionType: 'default',
  });
  const pendingActionRef = useRef(null);

  const showUndoToast = useCallback((message, actionType, undoCallback) => {
    // Store the undo callback
    pendingActionRef.current = undoCallback;

    setToast({
      isVisible: true,
      message,
      actionType,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
    pendingActionRef.current = null;
  }, []);

  const handleUndo = useCallback(() => {
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  }, []);

  return {
    toast,
    showUndoToast,
    hideToast,
    handleUndo,
  };
}

export default useUndoAction;
