import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springTactile, triggerHaptic } from '../utils/animations';
import { useAudio } from '../contexts/AudioContext';



// Icons - minimal
const Icons = {
  loading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  summarize: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  pause: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  stop: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
};

const summaryStyles = [
  { id: 'concise', label: 'Concise' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'bullets', label: 'Key Points' }
];

const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] };

function formatSummaryText(text) {
  if (!text) return null;

  const isBulletList = text.includes('•') || /^[-*]\s/m.test(text) || /^\d+\.\s/m.test(text);

  if (isBulletList) {
    const items = text
      .split(/(?:^|\n)[•\-*]\s*|(?:^|\n)\d+\.\s*/g)
      .filter(item => item.trim());

    return (
      <ul className="space-y-2 ml-4 list-disc list-outside marker:text-label-tertiary">
        {items.map((item, i) => (
          <li key={i} className="text-[15px] text-label-secondary leading-relaxed pl-1">
            {item.trim()}
          </li>
        ))}
      </ul>
    );
  }

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 1) {
    return <p className="text-[15px] text-label-secondary leading-relaxed">{paragraphs[0]}</p>;
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-[15px] text-label-secondary leading-relaxed">{para.trim()}</p>
      ))}
    </div>
  );
}



export default function SummaryCard({
  summary,
  loading,
  error,
  hasSummary,
  onGenerate,
  summaryStyle = 'concise',
  onStyleChange,
  onRegenerateWithStyle,
  articleTitle = ''
}) {
  const [copied, setCopied] = useState(false);
  const { play, togglePlayPause, stop, isPlaying: globalIsPlaying, currentTrack, isLoading: globalLoading } = useAudio();

  const trackId = `summary-${articleTitle ? articleTitle.slice(0, 30) : 'unknown'}`;
  const isActiveTrack = currentTrack?.id === trackId;
  const isPlaying = globalIsPlaying && isActiveTrack;
  const isPaused = isActiveTrack && !globalIsPlaying;
  const audioLoading = globalLoading && isActiveTrack;

  const handleCopy = async () => {
    if (!summary) return;
    triggerHaptic('success');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePlayPause = () => {
    triggerHaptic('medium');
    if (isActiveTrack) {
      togglePlayPause();
    } else {
      const cleanText = summary
        .replace(/[•\-*]/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
        
      play(cleanText, { id: trackId, title: 'AI Summary', type: 'summary' });
    }
  };

  // Empty state - Premium CTA
  if (!hasSummary && !loading && !error) {
    return (
      <div
        className="py-5 px-4 -mx-4 rounded-2xl"
        style={{
          background: 'rgba(10, 132, 255, 0.06)',
          border: '1px solid rgba(10, 132, 255, 0.15)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-tint)]"
              style={{
                background: 'rgba(10, 132, 255, 0.1)',
                border: '1px solid rgba(10, 132, 255, 0.2)',
              }}
            >
              {Icons.summarize}
            </div>
            <h3
              className="text-[15px] text-label"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.016em'
              }}
            >
              AI Summary
            </h3>
          </div>
          <div className="flex gap-1">
            {summaryStyles.map((style) => (
              <motion.button
                key={style.id}
                onClick={() => {
                  triggerHaptic('selection');
                  onStyleChange?.(style.id);
                }}
                whileTap={{ scale: 0.95 }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  summaryStyle === style.id
                    ? 'bg-[var(--color-tint)] text-white'
                    : 'text-label-tertiary hover:text-label-secondary hover:bg-[var(--color-fill)]'
                }`}
                style={{ letterSpacing: '0.01em' }}
              >
                {style.label}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="relative">
          <motion.button
            onClick={() => {
              triggerHaptic('medium');
              onGenerate();
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 text-[15px] font-semibold text-white rounded-xl"
            style={{
              background: 'var(--color-tint)',
              letterSpacing: '-0.016em'
            }}
          >
            Generate Summary
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* Loading - Premium animated skeleton */}
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="py-5 px-4 -mx-4 rounded-2xl"
          style={{
            background: 'rgba(10, 132, 255, 0.05)',
            border: '1px solid rgba(10, 132, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-[var(--color-tint)]"
            >
              {Icons.loading}
            </motion.div>
            <span
              className="text-[14px] text-[var(--color-tint)]"
              style={{ letterSpacing: '-0.016em' }}
            >
              Generating summary...
            </span>
          </div>
          <div className="space-y-2.5">
            {[1, 0.85, 0.7, 0.55].map((width, i) => (
              <motion.div
                key={i}
                className="h-4 rounded-md skeleton"
                style={{ width: `${width * 100}%` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Error - Premium styled */}
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="py-5 px-4 -mx-4 rounded-2xl"
          style={{
            background: 'rgba(255, 59, 48, 0.06)',
            border: '1px solid rgba(255, 59, 48, 0.15)'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255, 59, 48, 0.2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="#FF3B30" />
              </svg>
            </div>
            <span
              className="text-[14px]"
              style={{ color: '#FF3B30', letterSpacing: '-0.016em' }}
            >
              Unable to generate
            </span>
          </div>
          <p className="text-[14px] text-label-secondary mb-4 leading-relaxed">{error}</p>
          <motion.button
            onClick={() => {
              triggerHaptic('medium');
              onGenerate();
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 text-[14px] font-medium rounded-xl transition-colors duration-150"
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              color: '#FF3B30',
              letterSpacing: '-0.016em'
            }}
          >
            Try again
          </motion.button>
        </motion.div>
      )}

      {/* Summary - Premium styled */}
      {summary && !loading && (
        <motion.div
          key="summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="py-5 px-4 -mx-4 rounded-2xl"
          style={{
            background: 'rgba(10, 132, 255, 0.05)',
            border: '1px solid rgba(10, 132, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-tint)]"
                style={{
                  background: 'rgba(10, 132, 255, 0.1)',
                  border: '1px solid rgba(10, 132, 255, 0.2)',
                }}
              >
                {Icons.summarize}
              </div>
              <h3
                className="text-[15px] text-label"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.016em'
                }}
              >
                AI Summary
              </h3>
            </div>
            <div className="flex gap-1">
              {/* Style buttons - Premium gradient on selected */}
              {summaryStyles.map((style) => (
                <motion.button
                  key={style.id}
                  onClick={() => {
                    if (style.id !== summaryStyle) {
                      triggerHaptic('selection');
                      onStyleChange?.(style.id);
                      onRegenerateWithStyle?.(style.id);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 overflow-hidden"
                  style={{
                    background: summaryStyle === style.id
                      ? 'var(--color-tint)'
                      : 'transparent',
                    color: summaryStyle === style.id ? 'white' : 'var(--color-label-tertiary)',
                    boxShadow: 'none',
                    letterSpacing: '0.01em',
                  }}
                  disabled={loading}
                >
                  <span className="relative z-10">{style.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            {formatSummaryText(summary)}
          </div>

          {/* Actions toolbar - Premium with gradient glow */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <motion.button
              onClick={handlePlayPause}
              disabled={audioLoading}
              whileTap={{ scale: 0.9 }}
              transition={springTactile}
              className="p-2 rounded-lg transition-colors duration-150 disabled:opacity-50"
              style={{
                background: isPlaying && !isPaused ? 'var(--color-tint)' : 'transparent',
                color: isPlaying && !isPaused ? 'white' : 'var(--color-label-tertiary)',
              }}
              aria-label={audioLoading ? 'Loading audio' : isPlaying && !isPaused ? 'Pause' : 'Listen'}
            >
              <span>
                {audioLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {Icons.loading}
                  </motion.span>
                ) : isPlaying && !isPaused ? Icons.pause : Icons.play}
              </span>
            </motion.button>

            {isPlaying && (
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  stop();
                }}
                whileTap={{ scale: 0.9 }}
                transition={springTactile}
                className="p-2 rounded-lg text-label-tertiary hover:text-label-secondary hover:bg-[var(--color-fill)] transition-colors duration-150"
                aria-label="Stop"
              >
                {Icons.stop}
              </motion.button>
            )}

            <div className="w-px h-5 bg-label-quaternary mx-0.5 opacity-30" />

            <motion.button
              onClick={handleCopy}
              whileTap={{ scale: 0.9 }}
              transition={springTactile}
              className={`p-2 rounded-lg transition-colors duration-150 ${
                copied
                  ? 'text-[#30D158]'
                  : 'text-label-tertiary hover:text-label-secondary hover:bg-[var(--color-fill)]'
              }`}
              aria-label={copied ? 'Copied' : 'Copy'}
            >
              {copied ? Icons.check : Icons.copy}
            </motion.button>

            <motion.button
              onClick={() => {
                triggerHaptic('light');
                onGenerate();
              }}
              whileTap={{ scale: 0.9 }}
              transition={springTactile}
              className="p-2 rounded-lg text-label-tertiary hover:text-label-secondary hover:bg-[var(--color-fill)] transition-colors duration-150"
              disabled={loading}
              aria-label="Regenerate"
            >
              {Icons.refresh}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
