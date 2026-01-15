import { Component } from 'react';
import { motion } from 'framer-motion';
import { springGentle, springTactile, triggerHaptic } from '../utils/animations';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    triggerHaptic('medium');
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    triggerHaptic('medium');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-black flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={springGentle}
            className="max-w-md w-full text-center"
          >
            {/* Premium glass card */}
            <div
              className="rounded-3xl p-8"
              style={{
                background: 'rgba(28, 28, 30, 0.92)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Error icon with glow */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, ...springGentle }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255, 59, 48, 0.15)',
                  boxShadow: '0 8px 32px rgba(255, 59, 48, 0.2)'
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF3B30"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </motion.div>

              <h1
                className="text-[24px] text-label mb-2"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.025em'
                }}
              >
                Something went wrong
              </h1>
              <p
                className="text-[15px] text-label-secondary mb-6"
                style={{ letterSpacing: '-0.016em' }}
              >
                The app encountered an unexpected error. You can try again or reload the page.
              </p>

              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details
                  className="mb-6 text-left rounded-xl p-4"
                  style={{
                    background: 'rgba(255, 59, 48, 0.08)',
                    border: '1px solid rgba(255, 59, 48, 0.2)'
                  }}
                >
                  <summary className="cursor-pointer text-sm font-medium text-label-secondary">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-[#FF3B30] overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={this.handleRetry}
                  whileTap={{ scale: 0.98 }}
                  transition={springTactile}
                  className="relative px-6 py-3 text-[15px] font-semibold text-white rounded-xl overflow-hidden"
                  style={{
                    letterSpacing: '-0.016em',
                    background: 'var(--color-tint)',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)'
                  }}
                >
                  <span className="relative z-10">Try Again</span>
                </motion.button>
                <motion.button
                  onClick={this.handleReload}
                  whileTap={{ scale: 0.98 }}
                  whileHover="hover"
                  initial="rest"
                  transition={springTactile}
                  className="relative px-6 py-3 text-[15px] font-semibold rounded-xl overflow-hidden"
                  style={{
                    letterSpacing: '-0.016em',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-label)'
                  }}
                >
                  Reload Page
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
