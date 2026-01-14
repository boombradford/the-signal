import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyBriefing } from '../hooks/useAI';
import { springGentle, springSnappy, springTactile, easeOut, triggerHaptic } from '../utils/animations';

// Icons - minimal
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  pause: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  ),
  stop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
};

// Audio Equalizer Animation - dancing bars
function AudioEqualizer({ isPlaying }) {
  const bars = [
    { delay: 0, minHeight: 3, maxHeight: 16 },
    { delay: 0.1, minHeight: 4, maxHeight: 20 },
    { delay: 0.15, minHeight: 3, maxHeight: 14 },
    { delay: 0.05, minHeight: 5, maxHeight: 18 },
    { delay: 0.2, minHeight: 3, maxHeight: 12 },
  ];

  return (
    <div className="flex items-end gap-[3px] h-5">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-[var(--color-tint)]"
          animate={isPlaying ? {
            height: [bar.minHeight, bar.maxHeight, bar.minHeight],
            opacity: [0.6, 1, 0.6],
          } : {
            height: bar.minHeight,
            opacity: 0.4,
          }}
          transition={isPlaying ? {
            duration: 0.4 + Math.random() * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar.delay,
          } : {
            duration: 0.2
          }}
          style={{ height: bar.minHeight }}
        />
      ))}
    </div>
  );
}

// Removed - using imported animations

function formatBriefingText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 my-3 ml-4">
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

    // Headers - SF Pro Display
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList();
      const headerText = trimmed.slice(2, -2);
      elements.push(
        <h3
          key={index}
          className="text-[16px] text-label mt-5 mb-2 first:mt-0"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontWeight: 500,
            letterSpacing: '-0.01em'
          }}
        >
          {headerText}
        </h3>
      );
      return;
    }

    if (trimmed.match(/^\*\*[^*]+\*\*/)) {
      flushList();
      const headerText = trimmed.match(/^\*\*([^*]+)\*\*/)[1];
      const rest = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '');
      elements.push(
        <div key={index} className="mt-5 mb-2 first:mt-0">
          <span
            className="text-[16px] text-label"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            {headerText}
          </span>
          <span className="text-label-secondary text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
            {rest && ` ${rest}`}
          </span>
        </div>
      );
      return;
    }

    // Bullets
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
      listItems.push(
        <li key={index} className="text-[15px] text-label-secondary leading-relaxed">
          {bulletText}
        </li>
      );
      return;
    }

    // Paragraphs
    flushList();
    elements.push(
      <p key={index} className="text-[15px] text-label-secondary leading-relaxed my-2">
        {trimmed}
      </p>
    );
  });

  flushList();
  return elements;
}

export default function DailyBriefing({ articles, isOpen, onClose }) {
  const { briefing, loading, error, generateBriefing, clearBriefing } = useDailyBriefing();
  const [style, setStyle] = useState('briefing');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, [isOpen]);

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

    // If already playing, toggle pause/play
    if (audioRef.current) {
      if (isSpeaking) {
        audioRef.current.pause();
        setIsSpeaking(false);
      } else {
        audioRef.current.play();
        setIsSpeaking(true);
      }
      return;
    }

    // Generate new audio with ElevenLabs
    setAudioLoading(true);

    try {
      const text = getCleanText(briefing.briefing);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onpause = () => setIsSpeaking(false);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    } finally {
      setAudioLoading(false);
    }
  }, [briefing, isSpeaking, getCleanText]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const handleGenerate = async () => {
    handleStop();
    await generateBriefing(articles, style);
  };

  const handleClose = () => {
    handleStop();
    clearBriefing();
    onClose();
  };

  const unreadCount = articles.filter(a => !a.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={easeOut}
            className="fixed inset-0 z-[200] bg-black/40"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={springGentle}
            className="fixed inset-x-4 top-[12%] bottom-auto max-h-[76vh] z-[201] rounded-3xl overflow-hidden flex flex-col max-w-md mx-auto"
            style={{
              background: 'rgba(15, 15, 18, 0.85)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 -1px 0 rgba(255, 255, 255, 0.05) inset'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-separator)]">
              <div>
                <h2
                  className="text-[20px] text-label"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.015em'
                  }}
                >
                  Daily Briefing
                </h2>
                <p
                  className="text-[12px] text-label-tertiary mt-0.5"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                >
                  {unreadCount} unread articles
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Audio Equalizer - shows when playing */}
                {briefing && isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={springTactile}
                  >
                    <AudioEqualizer isPlaying={isSpeaking} />
                  </motion.div>
                )}

                {briefing && (
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => {
                        triggerHaptic('light');
                        handleSpeak();
                      }}
                      disabled={audioLoading}
                      whileTap={{ scale: 0.9 }}
                      transition={springTactile}
                      className={`relative p-2.5 rounded-full transition-colors duration-150 ${
                        isSpeaking
                          ? 'bg-[var(--color-tint)] text-white'
                          : 'text-label-secondary hover:text-label hover:bg-[var(--color-fill)]'
                      }`}
                    >
                      {/* Pulsing glow when playing */}
                      {isSpeaking && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-[var(--color-tint)]"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.4, 0, 0.4],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                      <span className="relative z-10">
                        {audioLoading ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            {Icons.loading}
                          </motion.span>
                        ) : isSpeaking ? Icons.pause : Icons.play}
                      </span>
                    </motion.button>
                    <AnimatePresence>
                      {(isSpeaking || audioRef.current) && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: 'auto' }}
                          exit={{ opacity: 0, scale: 0.8, width: 0 }}
                          onClick={() => {
                            triggerHaptic('light');
                            handleStop();
                          }}
                          whileTap={{ scale: 0.9 }}
                          transition={springTactile}
                          className="p-2 text-label-secondary hover:text-label hover:bg-[var(--color-fill)] rounded-full transition-colors duration-150"
                        >
                          {Icons.stop}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    handleClose();
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={springTactile}
                  className="p-2 text-label-secondary hover:text-label transition-colors duration-150"
                >
                  {Icons.close}
                </motion.button>
              </div>
            </div>


            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 relative">
              {/* Animated waveform background when speaking */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                  >
                    {/* Multiple wave layers */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-x-0 h-32"
                        style={{
                          top: `${20 + i * 30}%`,
                          background: `linear-gradient(90deg, transparent 0%, rgba(10, 132, 255, ${0.03 - i * 0.008}) 50%, transparent 100%)`,
                        }}
                        animate={{
                          scaleY: [1, 1.5, 1],
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2 + i * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {!briefing && !loading && (
                <div className="text-center py-8">
                  <h3
                    className="text-[22px] text-label mb-3"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.015em'
                    }}
                  >
                    Catch Up Quickly
                  </h3>
                  <p
                    className="text-[14px] text-label-secondary mb-6 max-w-[260px] mx-auto leading-relaxed"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                  >
                    Get an AI summary of your {unreadCount} unread articles.
                  </p>

                  <div className="flex gap-2 justify-center mb-6">
                    {[
                      { id: 'briefing', label: 'Full' },
                      { id: 'bullets', label: 'Key Points' },
                      { id: 'topics', label: 'By Topic' }
                    ].map(s => (
                      <motion.button
                        key={s.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          setStyle(s.id);
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={springTactile}
                        className={`px-3 py-1.5 text-[14px] rounded-md transition-colors duration-150 ${
                          style === s.id
                            ? 'bg-[var(--color-label)] text-[var(--color-background)]'
                            : 'text-label-secondary hover:text-label'
                        }`}
                      >
                        {s.label}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleGenerate();
                    }}
                    disabled={unreadCount === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTactile}
                    className="h-10 px-6 text-[15px] font-medium text-[var(--color-background)] bg-[var(--color-label)] rounded-lg hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
                  >
                    Generate
                  </motion.button>
                </div>
              )}

              {loading && (
                <div className="py-4">
                  {/* Anticipatory loading - premium styling */}
                  <div className="flex items-center gap-2 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-[var(--color-tint)]"
                    >
                      {Icons.loading}
                    </motion.div>
                    <p
                      className="text-[14px] text-[var(--color-tint)]"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      Analyzing {unreadCount} articles...
                    </p>
                  </div>

                  {/* Premium shimmer skeleton */}
                  <div className="space-y-4">
                    {/* Header skeleton */}
                    <motion.div
                      className="h-4 w-24 rounded-md"
                      style={{
                        background: 'linear-gradient(90deg, rgba(10, 132, 255, 0.1) 0%, rgba(10, 132, 255, 0.2) 50%, rgba(10, 132, 255, 0.1) 100%)',
                        backgroundSize: '200% 100%'
                      }}
                      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Content skeleton */}
                    <div className="space-y-2.5">
                      {[1, 0.85, 0.7].map((width, i) => (
                        <motion.div
                          key={i}
                          className="h-4 rounded-md"
                          style={{
                            width: `${width * 100}%`,
                            background: 'linear-gradient(90deg, rgba(10, 132, 255, 0.08) 0%, rgba(10, 132, 255, 0.16) 50%, rgba(10, 132, 255, 0.08) 100%)',
                            backgroundSize: '200% 100%'
                          }}
                          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    {/* Second section */}
                    <motion.div
                      className="h-4 w-28 rounded-md mt-6"
                      style={{
                        background: 'linear-gradient(90deg, rgba(10, 132, 255, 0.1) 0%, rgba(10, 132, 255, 0.2) 50%, rgba(10, 132, 255, 0.1) 100%)',
                        backgroundSize: '200% 100%'
                      }}
                      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.3 }}
                    />
                    <div className="space-y-2 ml-4">
                      {[1, 0.85, 0.8].map((width, i) => (
                        <motion.div
                          key={i}
                          className="h-3 rounded-md"
                          style={{
                            width: `${width * 100}%`,
                            background: 'linear-gradient(90deg, rgba(10, 132, 255, 0.06) 0%, rgba(10, 132, 255, 0.12) 50%, rgba(10, 132, 255, 0.06) 100%)',
                            backgroundSize: '200% 100%'
                          }}
                          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.4 + i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-label-secondary mb-4">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="text-[14px] font-medium text-label hover:opacity-70 transition-opacity duration-150"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {briefing && (
                <div>
                  <p className="text-[12px] text-label-tertiary mb-4">
                    Based on {briefing.articleCount} articles
                  </p>
                  {formatBriefingText(briefing.briefing)}
                </div>
              )}
            </div>

            {/* Footer */}
            {briefing && (
              <div className="p-4 border-t border-[var(--color-separator)]">
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    clearBriefing();
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTactile}
                  className="w-full py-2.5 text-[14px] text-label-secondary border border-[var(--color-separator)] rounded-lg hover:bg-[var(--color-fill)] transition-colors duration-150"
                >
                  Generate New
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
