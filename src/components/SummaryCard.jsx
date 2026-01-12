import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
const Icons = {
  ai: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  loading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  pause: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  stop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
};

const summaryStyles = [
  { id: 'concise', label: 'Concise', description: '2-3 sentences' },
  { id: 'detailed', label: 'Detailed', description: '4-5 sentences' },
  { id: 'bullets', label: 'Key Points', description: 'Bullet list' }
];

// Format summary text with rich styling
function formatSummaryText(text) {
  if (!text) return null;

  // Check if it's a bullet list
  const isBulletList = text.includes('•') || /^[-*]\s/m.test(text) || /^\d+\.\s/m.test(text);

  if (isBulletList) {
    // Split by bullet points, dashes, or numbers
    const items = text
      .split(/(?:^|\n)[•\-*]\s*|(?:^|\n)\d+\.\s*/g)
      .filter(item => item.trim());

    return (
      <ul className="space-y-3 list-none">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-[var(--color-info)] mt-1.5 flex-shrink-0" aria-hidden="true">
              <svg width="6" height="6" viewBox="0 0 6 6">
                <circle cx="3" cy="3" r="3" fill="currentColor" />
              </svg>
            </span>
            <span className="flex-1">{formatInlineText(item.trim())}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Regular paragraphs - split by double newlines
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 1) {
    return <p className="leading-relaxed">{formatInlineText(paragraphs[0])}</p>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <p key={i} className="leading-relaxed">{formatInlineText(para.trim())}</p>
      ))}
    </div>
  );
}

// Format inline text (bold, emphasis, quotes)
function formatInlineText(text) {
  // Replace **bold** and *italic* patterns
  const parts = [];
  let remaining = text;
  let key = 0;

  // Simple regex-based replacement for bold (**text**) and emphasis (*text*)
  const boldRegex = /\*\*(.+?)\*\*/g;
  const emphasisRegex = /\*(.+?)\*/g;
  const quoteRegex = /"([^"]+)"/g;

  // First pass: bold
  remaining = remaining.replace(boldRegex, (_, content) => `<strong>${content}</strong>`);
  // Second pass: emphasis (only single asterisks now)
  remaining = remaining.replace(emphasisRegex, (_, content) => `<em>${content}</em>`);
  // Third pass: quotes
  remaining = remaining.replace(quoteRegex, (_, content) => `<q>${content}</q>`);

  // Convert to React elements
  const htmlRegex = /<(strong|em|q)>(.+?)<\/\1>/g;
  let lastIndex = 0;
  let match;

  while ((match = htmlRegex.exec(remaining)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    // Add styled element
    const [, tag, content] = match;
    if (tag === 'strong') {
      parts.push(<strong key={key++} className="font-semibold text-label">{content}</strong>);
    } else if (tag === 'em') {
      parts.push(<em key={key++} className="italic">{content}</em>);
    } else if (tag === 'q') {
      parts.push(<span key={key++} className="text-[var(--color-info)] italic">"{content}"</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Text-to-speech hook using serverless TTS API
function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  // Clean text for speech
  const cleanTextForSpeech = (text) => {
    return text
      .replace(/[•\-*]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Serverless TTS via /api/tts
  const speakWithServerless = useCallback(async (text) => {
    if (!text) return;

    setIsLoading(true);

    try {
      const cleanText = cleanTextForSpeech(text);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) {
        throw new Error('TTS API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
      };

      audio.onpause = () => {
        setIsPaused(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      // Fallback to browser TTS
      speakWithBrowser(text);
    }
  }, []);

  // Browser TTS fallback
  const speakWithBrowser = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Daniel') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text) => {
    speakWithServerless(text);
  }, [speakWithServerless]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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

  // Copy summary to clipboard
  const handleCopy = async () => {
    if (!summary) return;

    const textToCopy = articleTitle
      ? `Summary: ${articleTitle}\n\n${summary}\n\n— Generated by The Vessl`
      : `${summary}\n\n— Generated by The Vessl`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share summary
  const handleShare = async () => {
    if (!summary) return;

    const shareData = {
      title: articleTitle ? `Summary: ${articleTitle}` : 'AI Summary',
      text: summary,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error - fallback to copy
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Handle audio controls
  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(summary);
    }
  };

  // Empty state - prompt to generate
  if (!hasSummary && !loading && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-fill-tertiary)]">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-[var(--color-info)]" aria-hidden="true">
              {Icons.ai}
            </span>
            <div>
              <h3 id="summary-heading" className="font-display font-semibold text-[15px] text-label mb-1">
                AI Summary
              </h3>
              <p className="text-[13px] text-label-secondary">
                Get a quick AI-powered overview of this article
              </p>
            </div>
          </div>

          {/* Style selector */}
          <div className="mb-4">
            <p className="text-[12px] font-medium text-label-secondary mb-2">Summary style</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Summary style">
              {summaryStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => onStyleChange?.(style.id)}
                  className={`flex-1 py-2 px-3 rounded-[var(--radius-sm)] text-center transition-colors ${
                    summaryStyle === style.id
                      ? 'bg-[var(--color-tint)] text-white'
                      : 'bg-[var(--color-fill)] text-label-secondary hover:bg-[var(--color-fill-secondary)]'
                  }`}
                  role="radio"
                  aria-checked={summaryStyle === style.id}
                >
                  <span className="block text-[13px] font-medium">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onGenerate}
            className="ios-button ios-button-filled w-full"
          >
            Generate Summary
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* Loading state */}
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-info)]/10 to-[var(--color-info)]/5 border border-[var(--color-info)]/20"
          role="status"
          aria-label="Generating summary"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-[var(--color-info)]"
              aria-hidden="true"
            >
              {Icons.loading}
            </motion.span>
            <span className="font-display font-semibold text-[15px] text-[var(--color-info)]">
              Analyzing article...
            </span>
          </div>

          {/* Skeleton lines */}
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 ios-skeleton w-full" />
            <div className="h-4 ios-skeleton w-5/6" />
            <div className="h-4 ios-skeleton w-4/6" />
          </div>

          <span className="sr-only">Please wait while the AI generates a summary</span>
        </motion.div>
      )}

      {/* Error state */}
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="text-[var(--color-error)] flex-shrink-0 mt-0.5" aria-hidden="true">
              {Icons.error}
            </span>
            <div>
              <p className="font-display font-semibold text-[15px] text-[var(--color-error)] mb-1">
                Summary unavailable
              </p>
              <p className="text-[14px] text-label-secondary mb-3">{error}</p>
              <button
                onClick={onGenerate}
                className="text-[14px] font-medium text-[var(--color-tint)] hover:underline flex items-center gap-1"
              >
                {Icons.refresh}
                Try again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success state - show summary */}
      {summary && !loading && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-info)]/10 to-[var(--color-info)]/5 border border-[var(--color-info)]/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-info)]" aria-hidden="true">
                {Icons.ai}
              </span>
              <h3 id="summary-heading" className="font-display font-semibold text-[14px] text-[var(--color-info)]">
                AI Summary
              </h3>
            </div>
            <span className="text-[12px] text-label-tertiary">
              The Vessl
            </span>
          </div>

          {/* Summary content with rich formatting */}
          <div className="p-4 pt-3 text-[15px] text-label summary-content">
            {formatSummaryText(summary)}
          </div>

          {/* Audio controls */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--color-fill)]">
              <button
                onClick={handlePlayPause}
                disabled={audioLoading}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-info)] text-white transition-transform active:scale-95 disabled:opacity-50"
                aria-label={audioLoading ? 'Loading audio...' : isPlaying && !isPaused ? 'Pause' : 'Listen to summary'}
              >
                {audioLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {Icons.loading}
                  </motion.span>
                ) : isPlaying && !isPaused ? Icons.pause : Icons.play}
              </button>

              {isPlaying && (
                <button
                  onClick={stop}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-fill-secondary)] text-label-secondary"
                  aria-label="Stop"
                >
                  {Icons.stop}
                </button>
              )}

              <div className="flex-1">
                <span className="text-[13px] text-label-secondary block">
                  {audioLoading ? 'Loading audio...' : isPlaying && !isPaused ? 'Playing...' : isPaused ? 'Paused' : 'Listen to summary'}
                </span>
                <span className="text-[11px] text-[var(--color-info)]">
                  ElevenLabs AI Voice
                </span>
              </div>

              {(isPlaying || audioLoading) && (
                <div className="flex gap-0.5" aria-hidden="true">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-[var(--color-info)] rounded-full"
                      animate={{
                        height: isPaused ? 8 : [8, 16, 8, 12, 8],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: isPaused ? 0 : Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-info)]/20 bg-[var(--color-info)]/5">
            {/* Style selector for regeneration */}
            <div className="flex gap-1" role="radiogroup" aria-label="Summary style">
              {summaryStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    if (style.id !== summaryStyle) {
                      onStyleChange?.(style.id);
                      onRegenerateWithStyle?.(style.id);
                    }
                  }}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                    summaryStyle === style.id
                      ? 'bg-[var(--color-info)]/20 text-[var(--color-info)]'
                      : 'text-label-tertiary hover:text-label-secondary'
                  }`}
                  title={`${style.description} - click to regenerate`}
                  role="radio"
                  aria-checked={summaryStyle === style.id}
                  disabled={loading}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Share/Copy/Regenerate buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-[var(--radius-sm)] text-label-secondary hover:text-label hover:bg-[var(--color-fill)] transition-colors"
                aria-label={copied ? 'Copied!' : 'Copy summary'}
                title="Copy to clipboard"
              >
                {copied ? Icons.check : Icons.copy}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-[var(--radius-sm)] text-label-secondary hover:text-label hover:bg-[var(--color-fill)] transition-colors"
                aria-label="Share summary"
                title="Share"
              >
                {Icons.share}
              </button>

              <button
                onClick={onGenerate}
                className="p-2 rounded-[var(--radius-sm)] text-label-secondary hover:text-label hover:bg-[var(--color-fill)] transition-colors flex items-center gap-1"
                disabled={loading}
                aria-busy={loading}
                title="Regenerate"
              >
                {Icons.refresh}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
