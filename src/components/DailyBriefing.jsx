/**
 * DailyBriefing - AI-powered news catch up
 *
 * Refined experience for quickly understanding your feeds.
 * - Auto-generates on open
 * - Time period filtering
 * - Persistent audio playback
 * - Copy/share functionality
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyBriefing } from '../hooks/useAI';
import { useAudio } from '../contexts/AudioContext';
import { springQuick, easeApple, easeOut, triggerHaptic } from '../utils/animations';

// Icons
const Icons = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  loading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  play: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  pause: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  ),
  copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// Audio Equalizer - Simple animated bars
function AudioEqualizer({ isPlaying }) {
  const bars = [
    { delay: 0, minH: 4, maxH: 12 },
    { delay: 0.1, minH: 4, maxH: 16 },
    { delay: 0.15, minH: 4, maxH: 10 },
    { delay: 0.05, minH: 4, maxH: 14 },
  ];

  return (
    <div className="flex items-center gap-[2px] h-4">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full bg-current"
          animate={isPlaying ? {
            height: [bar.minH, bar.maxH, bar.minH],
            opacity: [0.7, 1, 0.7],
          } : { height: 4, opacity: 0.5 }}
          transition={isPlaying ? {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar.delay,
          } : { duration: 0.2 }}
          style={{ height: 4 }}
        />
      ))}
    </div>
  );
}

// Time period options
const TIME_PERIODS = [
  { id: 'today', label: 'Today', hours: 24 },
  { id: 'recent', label: 'Last 12h', hours: 12 },
  { id: 'week', label: 'This Week', hours: 168 },
];

const STYLES = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'topics', label: 'Insights' },
];

// Format briefing text into React elements
function formatBriefingText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2.5 my-4">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    // Headers with ** wrapping
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList();
      const headerText = trimmed.slice(2, -2);
      elements.push(
        <h3
          key={index}
          className="text-[15px] font-semibold text-label mt-6 mb-2 first:mt-0"
          style={{ letterSpacing: '-0.01em' }}
        >
          {headerText}
        </h3>
      );
      return;
    }

    // Headers with ** at start
    if (trimmed.match(/^\*\*[^*]+\*\*/)) {
      flushList();
      const headerText = trimmed.match(/^\*\*([^*]+)\*\*/)[1];
      const rest = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '');
      elements.push(
        <div key={index} className="mt-6 mb-2 first:mt-0">
          <span className="text-[15px] font-semibold text-label" style={{ letterSpacing: '-0.01em' }}>
            {headerText}
          </span>
          {rest && (
            <span className="text-[14px] text-label-secondary"> {rest}</span>
          )}
        </div>
      );
      return;
    }

    // Bullets
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
      listItems.push(
        <li
          key={index}
          className="text-[14px] text-label-secondary leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-label-tertiary"
        >
          {bulletText}
        </li>
      );
      return;
    }

    // Paragraphs
    flushList();
    elements.push(
      <p key={index} className="text-[14px] text-label-secondary leading-relaxed my-3">
        {trimmed}
      </p>
    );
  });

  flushList();
  return elements;
}

// Get greeting based on time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function DailyBriefing({ articles, isOpen, onClose }) {
  const { briefing, loading, error, generateBriefing, clearBriefing } = useDailyBriefing();
  const { isPlaying, isLoading: audioLoading, hasAudio, play, togglePlayPause, stop } = useAudio();
  const [timePeriod, setTimePeriod] = useState('today');
  const [style, setStyle] = useState('briefing');
  const [copied, setCopied] = useState(false);

  // Filter articles by time period
  const filteredArticles = useMemo(() => {
    const period = TIME_PERIODS.find(p => p.id === timePeriod);
    const cutoff = new Date(Date.now() - period.hours * 60 * 60 * 1000);
    return articles.filter(a => {
      const pubDate = new Date(a.pubDate);
      return pubDate >= cutoff && !a.isRead;
    });
  }, [articles, timePeriod]);

  // Auto-generate when opening or style changes
  useEffect(() => {
    if (isOpen && filteredArticles.length > 0 && (!briefing || briefing.style !== style) && !loading) {
      generateBriefing(filteredArticles, style);
    }
  }, [isOpen, filteredArticles, style]);

  const getCleanText = useCallback((text) => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')
      .replace(/^[•\-*]\s*/gm, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!briefing?.briefing) return;

    if (hasAudio) {
      togglePlayPause();
      return;
    }

    const text = getCleanText(briefing.briefing);
    await play(text, { title: 'Daily Briefing', type: 'briefing' });
  }, [briefing, hasAudio, togglePlayPause, play, getCleanText]);

  const handleRegenerate = async () => {
    stop();
    clearBriefing();
    await generateBriefing(filteredArticles, style);
  };

  const handleCopy = async () => {
    if (!briefing?.briefing) return;
    await navigator.clipboard.writeText(briefing.briefing);
    setCopied(true);
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!briefing?.briefing) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${getGreeting()} Briefing`,
          text: briefing.briefing,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleClose = () => {
    clearBriefing();
    onClose();
  };

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    clearBriefing();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={easeApple}
            className="fixed inset-x-4 top-[10%] bottom-auto max-h-[80vh] z-[201] rounded-2xl overflow-hidden flex flex-col max-w-lg mx-auto"
            style={{
              background: 'rgba(22, 22, 24, 0.95)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex-1 min-w-0">
                <h2
                  className="text-[18px] font-semibold text-label"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {getGreeting()}
                </h2>
                <p className="text-[13px] text-label-tertiary mt-0.5">
                  {filteredArticles.length} unread article{filteredArticles.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio controls */}
                {briefing && (
                  <motion.button
                    onClick={() => {
                      triggerHaptic('light');
                      handleSpeak();
                    }}
                    disabled={audioLoading}
                    whileTap={{ scale: 0.95 }}
                    transition={springQuick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: isPlaying ? 'var(--color-tint)' : 'transparent',
                      color: isPlaying ? 'white' : 'var(--color-label-secondary)',
                    }}
                  >
                    {audioLoading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        {Icons.loading}
                      </motion.span>
                    ) : isPlaying ? (
                      <>
                        <AudioEqualizer isPlaying={true} />
                        <span className="text-[13px] font-medium">Playing</span>
                      </>
                    ) : (
                      <>
                        {Icons.play}
                        <span className="text-[13px] font-medium">Listen</span>
                      </>
                    )}
                  </motion.button>
                )}

                {/* Close */}
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    handleClose();
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={springQuick}
                  className="p-2 rounded-lg text-label-tertiary hover:text-label-secondary hover:bg-white/5 transition-colors"
                >
                  {Icons.close}
                </motion.button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-5 py-3 border-b border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {/* Time Periods */}
                <div className="flex gap-2">
                  {TIME_PERIODS.map(period => {
                    const isSelected = timePeriod === period.id;
                    return (
                      <motion.button
                        key={period.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          handleTimePeriodChange(period.id);
                        }}
                        whileTap={{ scale: 0.97 }}
                        transition={springQuick}
                        className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                        style={{
                          background: isSelected ? 'var(--color-tint)' : 'transparent',
                          color: isSelected ? 'white' : 'var(--color-label-secondary)',
                        }}
                      >
                        {period.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Style Toggle */}
                <div className="flex bg-white/5 rounded-lg p-0.5">
                  {STYLES.map(s => {
                    const isSelected = style === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          clearBriefing();
                          setStyle(s.id);
                        }}
                        className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all duration-200 ${
                          isSelected 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-label-tertiary hover:text-label-secondary'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {loading && (
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-[var(--color-tint)]"
                    >
                      {Icons.loading}
                    </motion.div>
                    <p className="text-[14px] text-[var(--color-tint)]">
                      Analyzing {filteredArticles.length} articles...
                    </p>
                  </div>

                  {/* Skeleton */}
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 w-32 rounded bg-white/5" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-white/5" />
                      <div className="h-3 w-[90%] rounded bg-white/5" />
                      <div className="h-3 w-[75%] rounded bg-white/5" />
                    </div>
                    <div className="h-4 w-24 rounded bg-white/5 mt-6" />
                    <div className="space-y-2 pl-4">
                      <div className="h-3 w-full rounded bg-white/5" />
                      <div className="h-3 w-[85%] rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-5 text-center">
                  <p className="text-[14px] text-label-secondary mb-4">{error}</p>
                  <motion.button
                    onClick={handleRegenerate}
                    whileTap={{ scale: 0.98 }}
                    transition={springQuick}
                    className="text-[14px] font-medium text-[var(--color-tint)]"
                  >
                    Try Again
                  </motion.button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && filteredArticles.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-label-secondary mb-2">
                    You're all caught up!
                  </p>
                  <p className="text-[13px] text-label-tertiary">
                    No unread articles in this time period.
                  </p>
                </div>
              )}

              {/* Briefing content */}
              {briefing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={easeApple}
                  className="p-5"
                >
                  <p className="text-[12px] text-label-tertiary mb-4">
                    Based on {briefing.articleCount} articles
                  </p>
                  {formatBriefingText(briefing.briefing)}
                </motion.div>
              )}
            </div>

            {/* Footer actions */}
            {briefing && (
              <div className="px-5 py-4 border-t border-white/5 flex items-center gap-2">
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    handleRegenerate();
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={springQuick}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-label-secondary rounded-lg hover:bg-white/5 hover:text-label transition-colors"
                >
                  {Icons.refresh}
                  <span>Regenerate</span>
                </motion.button>

                <div className="flex-1" />

                {/* Copy button */}
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    handleCopy();
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={springQuick}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors"
                  style={{
                    color: copied ? 'white' : 'var(--color-label-secondary)',
                    background: copied ? '#30D158' : 'transparent',
                  }}
                >
                  {copied ? Icons.check : Icons.copy}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    handleShare();
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={springQuick}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-label-secondary rounded-lg hover:bg-white/5 hover:text-label transition-colors"
                >
                  {Icons.share}
                  <span>Share</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
