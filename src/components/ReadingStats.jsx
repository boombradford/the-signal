import { motion, AnimatePresence } from 'framer-motion';
import { useReadingStats } from '../hooks/useReadingStats';
import { springQuick, easeApple, triggerHaptic } from '../utils/animations';

/**
 * ReadingStats - Premium reading statistics
 * Clean Apple-inspired design without gradients or decorative elements.
 */

// Icons - minimal line style
const Icons = {
  flame: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.5 5.5 6 8 6 13C6 17.5 9.5 21 14 21C18.5 21 21 17 21 13C21 9 18 6 18 6C18 10 16 12 14 12C12 12 11.5 10 12 8C12.5 6 12 2 12 2Z" />
    </svg>
  ),
  book: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  trophy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  target: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  )
};

// Using imported spring animations from utils/animations.js

// Achievement definitions
const ACHIEVEMENTS = {
  first_read: { name: 'First Steps', description: 'Read your first article' },
  read_10: { name: 'Getting Started', description: 'Read 10 articles' },
  read_50: { name: 'Avid Reader', description: 'Read 50 articles' },
  read_100: { name: 'Centurion', description: 'Read 100 articles' },
  read_500: { name: 'Bookworm', description: 'Read 500 articles' },
  streak_3: { name: '3-Day Streak', description: 'Read for 3 days in a row' },
  streak_7: { name: 'Week Warrior', description: 'Read for 7 days in a row' },
  streak_30: { name: 'Monthly Master', description: 'Read for 30 days in a row' },
  streak_100: { name: 'Legendary', description: 'Read for 100 days in a row' },
  diverse_5: { name: 'Diverse Reader', description: 'Read from 5+ topics' }
};

// Activity bar component
function ActivityBar({ count, maxCount, dayName, isToday }) {
  const height = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-8 h-24 rounded-lg bg-[var(--color-fill)] relative overflow-hidden">
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-lg"
          style={{
            background: isToday
              ? 'var(--color-tint)'
              : 'var(--color-fill-secondary)',
          }}
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        />
        {count > 0 && (
          <span className="absolute inset-0 flex items-end justify-center pb-1 text-[10px] font-semibold text-white z-10">
            {count}
          </span>
        )}
      </div>
      <span
        className="text-[11px] font-medium"
        style={{
          color: isToday ? '#0A84FF' : 'var(--color-label-tertiary)',
          textShadow: isToday ? '0 0 8px rgba(10, 132, 255, 0.4)' : 'none',
        }}
      >
        {dayName}
      </span>
    </div>
  );
}

// Stat card component
function StatCard({ icon, value, label, accent }) {
  return (
    <motion.div
      className="p-4 rounded-2xl flex items-center gap-3"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springQuick}
      onTap={() => triggerHaptic('light')}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          accent
            ? 'bg-[var(--color-tint)] text-white'
            : 'bg-[var(--color-fill)] text-label-secondary'
        }`}
        style={accent ? {
          boxShadow: '0 2px 8px rgba(10, 132, 255, 0.25)'
        } : {}}
      >
        <span>{icon}</span>
      </div>
      <div>
        <p
          className="text-xl text-label"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </p>
        <p
          className="text-xs text-label-secondary"
          style={{ letterSpacing: '-0.01em' }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export default function ReadingStats({ isOpen, onClose }) {
  const {
    stats,
    getWeeklyProgress,
    getWeeklyActivity,
    formatTime,
    newAchievement,
    dismissAchievement
  } = useReadingStats();

  const weeklyProgress = getWeeklyProgress();
  const weeklyActivity = getWeeklyActivity();
  const maxActivity = Math.max(...weeklyActivity.map(d => d.count), 1);
  const today = new Date().toISOString().split('T')[0];

  // Get top tags
  const topTags = Object.entries(stats.tagBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const unlockedAchievements = (stats.achievements || [])
    .map(id => ({ id, ...ACHIEVEMENTS[id] }))
    .filter(a => a.name);

  return (
    <>
      {/* New achievement toast - Premium glass */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            transition={easeApple}
            className="fixed top-20 left-1/2 z-[300] px-6 py-4 rounded-2xl flex items-center gap-3 cursor-pointer"
            style={{
              background: 'rgba(15, 15, 18, 0.95)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(10, 132, 255, 0.2)'
            }}
            onClick={() => {
              triggerHaptic('success');
              dismissAchievement();
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-10 h-10 rounded-xl bg-[var(--color-tint)] flex items-center justify-center text-white"
              style={{ boxShadow: '0 4px 16px rgba(10, 132, 255, 0.4)' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              {Icons.trophy}
            </motion.div>
            <div>
              <p
                className="text-label"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                {newAchievement.name}
              </p>
              <p className="text-xs text-label-secondary">Achievement unlocked</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal - Premium glass styling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={easeApple}
              className="fixed inset-4 top-[5%] bottom-auto max-h-[90vh] z-[201] rounded-3xl overflow-hidden flex flex-col max-w-lg mx-auto"
              style={{
                background: 'rgba(15, 15, 18, 0.92)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Header - Premium styling */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-separator)]">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-[var(--color-tint)] flex items-center justify-center text-white"
                    style={{ boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {Icons.chart}
                  </motion.div>
                  <div>
                    <h2
                      className="text-lg text-label"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Reading Stats
                    </h2>
                    <p
                      className="text-xs text-label-secondary"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      Your reading journey
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={springQuick}
                  className="p-2 rounded-full text-label-secondary hover:text-[var(--color-tint)] hover:bg-[var(--color-fill)] transition-colors"
                >
                  {Icons.close}
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Streak banner */}
                <motion.div
                  className="relative overflow-hidden rounded-2xl p-5"
                  style={{
                    background: 'var(--color-tint)',
                    boxShadow: '0 4px 16px rgba(10, 132, 255, 0.25)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={easeApple}
                  whileTap={{ scale: 0.98 }}
                  onTap={() => triggerHaptic('light')}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p
                        className="text-white/80 text-sm"
                        style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
                      >
                        Current Streak
                      </p>
                      <p
                        className="text-white mt-1"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontSize: '36px',
                          fontWeight: 700,
                          letterSpacing: '-0.03em'
                        }}
                      >
                        {stats.currentStreak} <span style={{ fontSize: '20px', fontWeight: 500 }}>days</span>
                      </p>
                      {stats.longestStreak > 0 && (
                        <p className="text-white/70 text-xs mt-1" style={{ letterSpacing: '-0.01em' }}>
                          Best: {stats.longestStreak} days
                        </p>
                      )}
                    </div>
                    <motion.div
                      className="text-white opacity-90"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {Icons.flame}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={Icons.book}
                    value={stats.totalArticlesRead}
                    label="Articles read"
                    accent
                  />
                  <StatCard
                    icon={Icons.clock}
                    value={formatTime(stats.totalTimeSpent)}
                    label="Time reading"
                  />
                </div>

                {/* Weekly progress - Premium glass */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {Icons.target}
                      <span
                        className="text-label"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 600,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        Weekly Goal
                      </span>
                    </div>
                    <span className="text-sm text-label-secondary">
                      {weeklyProgress.current}/{weeklyProgress.goal}
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--color-fill)] rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        background: 'var(--color-tint)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyProgress.percentage}%` }}
                      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  {weeklyProgress.percentage >= 100 && (
                    <p className="text-xs text-[var(--color-success)] mt-2 font-medium">
                      Goal achieved this week
                    </p>
                  )}
                </div>

                {/* Weekly activity - Premium glass */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <h3
                    className="text-label mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    This Week
                  </h3>
                  <div className="flex justify-between">
                    {weeklyActivity.map((day, i) => (
                      <ActivityBar
                        key={day.date}
                        count={day.count}
                        maxCount={maxActivity}
                        dayName={day.dayName}
                        isToday={day.date === today}
                      />
                    ))}
                  </div>
                </div>

                {/* Top topics - Premium glass */}
                {topTags.length > 0 && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <h3
                      className="text-label mb-3"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Top Topics
                    </h3>
                    <div className="space-y-2">
                      {topTags.map(([tag, count], i) => (
                        <div key={tag} className="flex items-center gap-3">
                          <span className="w-6 text-center text-sm font-bold text-label-tertiary">
                            #{i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-label capitalize">{tag}</span>
                              <span className="text-xs text-label-secondary">{count} articles</span>
                            </div>
                            <div className="h-1.5 bg-[var(--color-fill)] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-[var(--color-tint)] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / topTags[0][1]) * 100}%` }}
                                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements - Premium glass */}
                {unlockedAchievements.length > 0 && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {Icons.trophy}
                      <h3
                        className="text-label"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          fontWeight: 600,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        Achievements
                      </h3>
                      <span className="text-xs text-label-tertiary">
                        {unlockedAchievements.length}/{Object.keys(ACHIEVEMENTS).length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {unlockedAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          className="p-3 rounded-xl bg-[var(--color-fill)] flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={springQuick}
                          onTap={() => triggerHaptic('light')}
                          title={achievement.description}
                        >
                          <div
                            className="w-8 h-8 rounded-lg bg-[var(--color-tint)] flex items-center justify-center text-white"
                            style={{ boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-label truncate">{achievement.name}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {stats.totalArticlesRead === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-fill)] flex items-center justify-center text-label-tertiary">
                      {Icons.book}
                    </div>
                    <h3 className="font-semibold text-lg text-label mb-2">Start Reading</h3>
                    <p className="text-sm text-label-secondary">
                      Read articles to build your streak and unlock achievements.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
