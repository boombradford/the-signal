/**
 * MiniAudioPlayer - Persistent audio controls
 *
 * Shows when audio is playing and user navigates away.
 * - Minimal, non-intrusive design
 * - Play/pause and stop controls
 * - Progress visualization
 * - Swipe down to dismiss (stop)
 */

import { memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAudio } from '../contexts/AudioContext';
import { springQuick, triggerHaptic } from '../utils/animations';

const Icons = {
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
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  waveform: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2" />
    </svg>
  ),
};

// Audio waveform animation
function AudioWaveform({ isPlaying }) {
  const bars = [
    { delay: 0, minH: 3, maxH: 10, color: '#FFFFFF' },
    { delay: 0.1, minH: 3, maxH: 14, color: '#E8F4FF' },
    { delay: 0.15, minH: 3, maxH: 8, color: '#D4EAFF' },
    { delay: 0.05, minH: 3, maxH: 12, color: '#E8F4FF' },
  ];

  return (
    <div className="flex items-center gap-[2px] h-4 relative">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full relative z-10"
          animate={isPlaying ? {
            height: [bar.minH, bar.maxH, bar.minH],
            opacity: [0.7, 1, 0.7],
          } : {
            height: 3,
            opacity: 0.5,
          }}
          transition={isPlaying ? {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar.delay,
          } : {
            duration: 0.2
          }}
          style={{
            height: 3,
            background: 'rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </div>
  );
}

const MiniAudioPlayer = memo(function MiniAudioPlayer() {
  const { isPlaying, isLoading, currentTrack, progress, duration, togglePlayPause, stop } = useAudio();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 60], [1, 0]);

  // Don't show if no track
  if (!currentTrack && !isLoading) return null;

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 40) {
      // Swiped down - stop playback
      triggerHaptic('light');
      stop();
    } else {
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={springQuick}
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y, opacity }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-4 right-4 z-[80] mx-auto max-w-md"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10, 132, 255, 0.95)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(10, 132, 255, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          }}
        >
          {/* Progress bar */}
          <div className="h-[2px] bg-white/20">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Play/Pause button */}
            <div className="relative">
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  togglePlayPause();
                }}
                whileTap={{ scale: 0.9 }}
                transition={springQuick}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden"
                style={{
                  background: isPlaying
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="relative z-10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </motion.div>
                ) : (
                  <span className="relative z-10">{isPlaying ? Icons.pause : Icons.play}</span>
                )}
              </motion.button>
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <AudioWaveform isPlaying={isPlaying} />
                <p className="text-[14px] font-medium text-white truncate">
                  {currentTrack?.title || 'Daily Briefing'}
                </p>
              </div>
              <p className="text-[12px] text-white/70 mt-0.5">
                {formatTime(progress)} / {formatTime(duration)}
              </p>
            </div>

            {/* Close button */}
            <motion.button
              onClick={() => {
                triggerHaptic('light');
                stop();
              }}
              whileTap={{ scale: 0.9 }}
              whileHover="hover"
              initial="rest"
              transition={springQuick}
              className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 transition-colors hover:bg-white/20"
            >
              <span className="relative z-10 text-white">
                {Icons.close}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center mt-1.5">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default MiniAudioPlayer;
