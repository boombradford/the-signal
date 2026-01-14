import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springTactile, triggerHaptic } from '../utils/animations';

// Icons - minimal
const Icons = {
  loading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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

function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const cleanText = (text) => {
    return text
      .replace(/[•\-*]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback(async (text) => {
    if (!text) return;

    // If audio already exists, toggle play/pause
    if (audioRef.current) {
      if (isPlaying && !isPaused) {
        audioRef.current.pause();
        setIsPaused(true);
        return;
      } else if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
        return;
      }
    }

    // Generate new audio with ElevenLabs
    setIsLoading(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText(text) })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => { setIsPlaying(true); setIsPaused(false); };
      audio.onpause = () => { if (!audio.ended) setIsPaused(true); };
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        audioRef.current = null;
      };

      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, isPaused]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { speak, pause, resume, stop, isPlaying, isPaused, isLoading };
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
  const { speak, pause, resume, stop, isPlaying, isPaused, isLoading: audioLoading } = useTextToSpeech();

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
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(summary);
    }
  };

  // Empty state - Premium CTA
  if (!hasSummary && !loading && !error) {
    return (
      <div
        className="py-5 px-4 -mx-4 rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(10, 132, 255, 0.08), rgba(10, 132, 255, 0.02))',
          border: '1px solid rgba(10, 132, 255, 0.15)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(10, 132, 255, 0.2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-tint)" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
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
        <motion.button
          onClick={() => {
            triggerHaptic('medium');
            onGenerate();
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 text-[15px] font-semibold text-white bg-[var(--color-tint)] rounded-xl hover:opacity-90 transition-opacity duration-150"
          style={{ letterSpacing: '-0.016em' }}
        >
          Generate Summary
        </motion.button>
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
            background: 'linear-gradient(145deg, rgba(10, 132, 255, 0.06), rgba(10, 132, 255, 0.02))',
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
                className="h-4 rounded-md"
                style={{
                  width: `${width * 100}%`,
                  background: 'linear-gradient(90deg, rgba(10, 132, 255, 0.1) 0%, rgba(10, 132, 255, 0.2) 50%, rgba(10, 132, 255, 0.1) 100%)',
                  backgroundSize: '200% 100%'
                }}
                animate={{
                  backgroundPosition: ['200% 0', '-200% 0']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="py-4 border-y border-[var(--color-separator)]"
        >
          <p className="text-[14px] text-label-secondary mb-2">{error}</p>
          <button
            onClick={onGenerate}
            className="text-[14px] text-label hover:opacity-70 transition-opacity duration-150"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Summary */}
      {summary && !loading && (
        <motion.div
          key="summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="py-4 border-y border-[var(--color-separator)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-medium text-label">AI Summary</h3>
            <div className="flex items-center gap-1">
              {/* Style buttons */}
              {summaryStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    if (style.id !== summaryStyle) {
                      onStyleChange?.(style.id);
                      onRegenerateWithStyle?.(style.id);
                    }
                  }}
                  className={`px-2 py-1 text-[11px] rounded transition-colors duration-150 ${
                    summaryStyle === style.id
                      ? 'text-label'
                      : 'text-label-tertiary hover:text-label-secondary'
                  }`}
                  disabled={loading}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            {formatSummaryText(summary)}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handlePlayPause}
              disabled={audioLoading}
              whileTap={{ scale: 0.9 }}
              transition={springTactile}
              className={`p-2 rounded transition-colors duration-150 ${
                isPlaying && !isPaused
                  ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                  : 'text-label-tertiary hover:text-label-secondary'
              } disabled:opacity-50`}
              aria-label={audioLoading ? 'Loading audio' : isPlaying && !isPaused ? 'Pause' : 'Listen'}
            >
              {audioLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  {Icons.loading}
                </motion.span>
              ) : isPlaying && !isPaused ? Icons.pause : Icons.play}
            </motion.button>

            {isPlaying && (
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  stop();
                }}
                whileTap={{ scale: 0.9 }}
                transition={springTactile}
                className="p-2 text-label-tertiary hover:text-label-secondary transition-colors duration-150"
                aria-label="Stop"
              >
                {Icons.stop}
              </motion.button>
            )}

            <motion.button
              onClick={handleCopy}
              whileTap={{ scale: 0.9 }}
              transition={springTactile}
              className="p-2 text-label-tertiary hover:text-label-secondary transition-colors duration-150"
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
              className="p-2 text-label-tertiary hover:text-label-secondary transition-colors duration-150"
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
