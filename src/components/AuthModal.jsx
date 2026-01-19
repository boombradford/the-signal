import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp, resetPassword, getCurrentUser, onAuthStateChange } from '../utils/supabase';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { springGentle, springTactile, triggerHaptic } from '../utils/animations';

const springTransition = {
  type: 'spring',
  damping: 30,
  stiffness: 350,
  mass: 0.9
};

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const focusTrapRef = useFocusTrap(isOpen);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    triggerHaptic('medium');
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onAuthSuccess?.();
        onClose();
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signUp(email, password);
        setSuccess('Account created! Check your email to confirm.');
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 2000);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
          />

          {/* Modal - Premium glass styling */}
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            {/* Premium glass card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(15, 15, 18, 0.95)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Header */}
              <div
                className="relative px-6 pt-8 pb-8 text-center"
                style={{
                  background: 'transparent'
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, ...springTransition }}
                  className="relative"
                >
                  {/* Icon */}
                  <div className="relative w-16 h-16 mx-auto mb-5">
                    <motion.div
                      className="relative w-full h-full rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{
                        background: 'var(--color-tint)',
                        boxShadow: '0 8px 32px rgba(10, 132, 255, 0.3)'
                      }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </motion.div>
                  </div>
                  <h2
                    id="auth-title"
                    className="text-[24px] text-label mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '-0.025em'
                    }}
                  >
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Reset Password'}
                  </h2>
                  <p
                    className="text-[15px] text-label-secondary"
                    style={{ letterSpacing: '-0.016em' }}
                  >
                    {mode === 'login' && 'Sign in to sync your feeds across devices'}
                    {mode === 'register' && 'Join to save your reading progress'}
                    {mode === 'forgot' && "We'll send you a reset link"}
                  </p>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
                {/* Email field */}
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-label-secondary mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="glass-input w-full"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                {/* Password field */}
                {mode !== 'forgot' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="auth-password" className="block text-xs font-medium text-label-secondary mb-1.5 uppercase tracking-wide">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="glass-input w-full"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      disabled={loading}
                      minLength={6}
                    />
                  </motion.div>
                )}

                {/* Confirm password for registration */}
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="auth-confirm-password" className="block text-xs font-medium text-label-secondary mb-1.5 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <input
                      id="auth-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="glass-input w-full"
                      required
                      autoComplete="new-password"
                      disabled={loading}
                      minLength={6}
                    />
                  </motion.div>
                )}

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm"
                      role="alert"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm flex items-center gap-2"
                      role="status"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="M22 4L12 14.01l-3-3" />
                      </svg>
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <div className="relative">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="relative w-full h-12 rounded-xl text-[15px] font-semibold text-white disabled:opacity-70 overflow-hidden"
                    style={{
                      background: 'var(--color-tint)',
                      boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)',
                      letterSpacing: '-0.01em',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block relative z-10"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      </motion.span>
                    ) : (
                      <span className="relative z-10">
                        {mode === 'login' && 'Sign In'}
                        {mode === 'register' && 'Create Account'}
                        {mode === 'forgot' && 'Send Reset Link'}
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Mode switchers - Premium gradient text links */}
                <div className="pt-4 text-center space-y-2">
                  {mode === 'login' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setMode('forgot');
                        }}
                        className="text-sm text-label-secondary hover:text-[var(--color-tint)] transition-colors"
                      >
                        Forgot password?
                      </button>
                      <div className="text-sm text-label-tertiary">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setMode('register');
                          }}
                          className="font-semibold transition-all hover:scale-105"
                          style={{
                            color: 'var(--color-tint)',
                          }}
                        >
                          Sign up
                        </button>
                      </div>
                    </>
                  )}
                  {mode === 'register' && (
                    <div className="text-sm text-label-tertiary">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setMode('login');
                        }}
                        className="font-semibold transition-all hover:scale-105"
                        style={{
                          color: 'var(--color-tint)',
                        }}
                      >
                        Sign in
                      </button>
                    </div>
                  )}
                  {mode === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setMode('login');
                      }}
                      className="text-sm font-semibold transition-all hover:scale-105"
                                                style={{
                                                  color: 'var(--color-tint)',
                                                }}                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              </form>

              {/* Close button */}
              <motion.button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1, backgroundColor: 'var(--color-fill-secondary)' }}
                initial="rest"
                transition={springTactile}
                className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-fill)] text-label-secondary transition-colors"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
