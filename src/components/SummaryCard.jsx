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
  )
};

const summaryStyles = [
  { id: 'concise', label: 'Concise', description: '2-3 sentences' },
  { id: 'detailed', label: 'Detailed', description: '4-5 sentences' },
  { id: 'bullets', label: 'Key Points', description: 'Bullet list' }
];

export default function SummaryCard({
  summary,
  loading,
  error,
  hasSummary,
  onGenerate,
  summaryStyle = 'concise',
  onStyleChange,
  onRegenerateWithStyle
}) {
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
          className="p-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-info)]/10 to-[var(--color-info)]/5 border border-[var(--color-info)]/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-info)]" aria-hidden="true">
                {Icons.ai}
              </span>
              <h3 id="summary-heading" className="font-display font-semibold text-[14px] text-[var(--color-info)]">
                AI Summary
              </h3>
            </div>
            <span className="text-[12px] text-label-tertiary">
              The Signal
            </span>
          </div>

          <div className="text-[15px] leading-relaxed text-label">
            {summary.includes('•') || summary.includes('-') ? (
              // Render as list if it contains bullet points
              <ul className="space-y-2 list-none">
                {summary.split(/[•\-]\s*/).filter(Boolean).map((point, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--color-info)] mt-1.5 flex-shrink-0" aria-hidden="true">
                      <svg width="6" height="6" viewBox="0 0 6 6">
                        <circle cx="3" cy="3" r="3" fill="currentColor" />
                      </svg>
                    </span>
                    <span>{point.trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{summary}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--color-info)]/20">
            {/* Style selector for regeneration */}
            <div className="flex gap-1" role="radiogroup" aria-label="Summary style">
              {summaryStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    if (style.id !== summaryStyle) {
                      onStyleChange?.(style.id);
                      // Auto-regenerate with new style
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

            <button
              onClick={onGenerate}
              className="ml-auto text-[13px] text-label-secondary hover:text-label flex items-center gap-1"
              disabled={loading}
              aria-busy={loading}
            >
              {Icons.refresh}
              {loading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
