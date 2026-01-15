/**
 * useKeyboardNav - Premium keyboard navigation for power users
 *
 * Inspired by Gmail, Notion, Linear, and Vim.
 * - j/k: Navigate down/up through articles
 * - o/Enter: Open selected article
 * - s: Toggle save on selected article
 * - m: Mark selected article as read
 * - g then h: Go home (clear selection)
 * - ?: Toggle keyboard shortcuts help
 *
 * Design principles:
 * - Non-intrusive: Only active when not typing in inputs
 * - Visual feedback: Selected article is highlighted
 * - Haptic feedback: Selection changes trigger tactile response
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { triggerHaptic } from '../utils/animations';

export function useKeyboardNav({
  articles = [],
  onSelect,
  onOpen,
  onSave,
  onMarkRead,
  enabled = true
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);
  const pendingKey = useRef(null);
  const pendingTimeout = useRef(null);

  // Reset selection when articles change
  useEffect(() => {
    setSelectedIndex(-1);
    setIsActive(false);
  }, [articles.length]);

  // Get currently selected article
  const selectedArticle = selectedIndex >= 0 && selectedIndex < articles.length
    ? articles[selectedIndex]
    : null;

  // Scroll selected article into view
  useEffect(() => {
    if (selectedIndex >= 0 && isActive) {
      const element = document.querySelector(`[data-article-index="${selectedIndex}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex, isActive]);

  // Handle key combinations (g+h for go home)
  const handleKeyCombo = useCallback((key) => {
    if (pendingKey.current === 'g' && key === 'h') {
      // g+h: Go home
      setSelectedIndex(-1);
      setIsActive(false);
      triggerHaptic('light');
      clearTimeout(pendingTimeout.current);
      pendingKey.current = null;
      return true;
    }
    return false;
  }, []);

  // Main keyboard handler
  const handleKeyDown = useCallback((e) => {
    // Don't handle if typing in an input or disabled
    if (!enabled) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Check for key combinations first
    if (handleKeyCombo(e.key)) {
      e.preventDefault();
      return;
    }

    // Store pending key for combos (like 'g')
    if (e.key === 'g') {
      pendingKey.current = 'g';
      pendingTimeout.current = setTimeout(() => {
        pendingKey.current = null;
      }, 1000);
      return;
    }

    // Clear pending key on other keys
    if (pendingKey.current) {
      clearTimeout(pendingTimeout.current);
      pendingKey.current = null;
    }

    switch (e.key) {
      case 'j':
      case 'ArrowDown': {
        e.preventDefault();
        if (articles.length === 0) return;

        setIsActive(true);
        setSelectedIndex(prev => {
          const next = Math.min(prev + 1, articles.length - 1);
          if (next !== prev) {
            triggerHaptic('selection');
            onSelect?.(articles[next]);
          }
          return next;
        });
        break;
      }

      case 'k':
      case 'ArrowUp': {
        e.preventDefault();
        if (articles.length === 0) return;

        setIsActive(true);
        setSelectedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          if (next !== prev) {
            triggerHaptic('selection');
            onSelect?.(articles[next]);
          }
          return next;
        });
        break;
      }

      case 'o':
      case 'Enter': {
        if (selectedArticle && isActive) {
          e.preventDefault();
          triggerHaptic('medium');
          onOpen?.(selectedArticle);
        }
        break;
      }

      case 's': {
        if (selectedArticle && isActive) {
          e.preventDefault();
          triggerHaptic('success');
          onSave?.(selectedArticle.id);
        }
        break;
      }

      case 'm': {
        if (selectedArticle && isActive) {
          e.preventDefault();
          triggerHaptic('success');
          onMarkRead?.(selectedArticle.id);
        }
        break;
      }

      case 'Escape': {
        if (isActive) {
          e.preventDefault();
          setSelectedIndex(-1);
          setIsActive(false);
          triggerHaptic('light');
        }
        break;
      }
    }
  }, [enabled, articles, selectedArticle, isActive, onSelect, onOpen, onSave, onMarkRead, handleKeyCombo]);

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, []);

  return {
    selectedIndex,
    selectedArticle,
    isActive,
    setSelectedIndex,
    clearSelection: useCallback(() => {
      setSelectedIndex(-1);
      setIsActive(false);
    }, [])
  };
}
