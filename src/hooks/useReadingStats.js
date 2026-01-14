import { useState, useEffect, useCallback } from 'react';

const STATS_KEY = 'kevin_reading_stats';

// Helper to get date string in YYYY-MM-DD format
const getDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Get default stats structure
const getDefaultStats = () => ({
  totalArticlesRead: 0,
  totalTimeSpent: 0, // in seconds (estimated)
  readDates: {}, // { "2024-01-15": { count: 5, timeSpent: 300 } }
  tagBreakdown: {}, // { "tech": 10, "news": 5 }
  currentStreak: 0,
  longestStreak: 0,
  lastReadDate: null,
  weeklyGoal: 10, // articles per week
  achievements: []
});

// Calculate reading streak from readDates
const calculateStreak = (readDates) => {
  const dates = Object.keys(readDates).sort().reverse();
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = getDateString();
  const yesterday = getDateString(new Date(Date.now() - 86400000));

  // Check if user read today or yesterday to continue streak
  if (dates[0] !== today && dates[0] !== yesterday) {
    // Streak broken - calculate longest from history
    return { current: 0, longest: calculateLongestStreak(dates) };
  }

  // Count consecutive days
  let current = 0;
  let checkDate = dates[0] === today ? new Date() : new Date(Date.now() - 86400000);

  for (let i = 0; i < 365; i++) { // Max 1 year streak check
    const dateStr = getDateString(checkDate);
    if (readDates[dateStr]) {
      current++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return {
    current,
    longest: Math.max(current, calculateLongestStreak(dates))
  };
};

// Calculate longest historical streak
const calculateLongestStreak = (sortedDates) => {
  if (sortedDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((prevDate - currDate) / 86400000);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};

// Check for new achievements
const checkAchievements = (stats) => {
  const achievements = [...(stats.achievements || [])];
  const newAchievements = [];

  const allAchievements = [
    { id: 'first_read', name: 'First Steps', condition: () => stats.totalArticlesRead >= 1 },
    { id: 'read_10', name: 'Getting Started', condition: () => stats.totalArticlesRead >= 10 },
    { id: 'read_50', name: 'Avid Reader', condition: () => stats.totalArticlesRead >= 50 },
    { id: 'read_100', name: 'Centurion', condition: () => stats.totalArticlesRead >= 100 },
    { id: 'read_500', name: 'Bookworm', condition: () => stats.totalArticlesRead >= 500 },
    { id: 'streak_3', name: '3-Day Streak', condition: () => stats.currentStreak >= 3 },
    { id: 'streak_7', name: 'Week Warrior', condition: () => stats.currentStreak >= 7 },
    { id: 'streak_30', name: 'Monthly Master', condition: () => stats.currentStreak >= 30 },
    { id: 'streak_100', name: 'Legendary', condition: () => stats.currentStreak >= 100 },
    { id: 'diverse_5', name: 'Diverse Reader', condition: () => Object.keys(stats.tagBreakdown || {}).length >= 5 },
  ];

  for (const achievement of allAchievements) {
    if (!achievements.includes(achievement.id) && achievement.condition()) {
      achievements.push(achievement.id);
      newAchievements.push(achievement);
    }
  }

  return { achievements, newAchievements };
};

// Estimate reading time based on content length
export const estimateReadingTime = (article) => {
  const wordsPerMinute = 200;
  const content = article?.content || article?.description || '';
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes) * 60; // Return seconds, minimum 1 minute
};

export function useReadingStats() {
  const [stats, setStats] = useState(getDefaultStats);
  const [newAchievement, setNewAchievement] = useState(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Recalculate streak on load
        const { current, longest } = calculateStreak(parsed.readDates || {});
        setStats({
          ...getDefaultStats(),
          ...parsed,
          currentStreak: current,
          longestStreak: Math.max(longest, parsed.longestStreak || 0)
        });
      }
    } catch (e) {
      console.error('Failed to load reading stats:', e);
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.error('Failed to save reading stats:', e);
    }
  }, []);

  // Track an article read
  const trackArticleRead = useCallback((article) => {
    setStats(prev => {
      const today = getDateString();
      const timeSpent = estimateReadingTime(article);
      const tag = article?.primaryTag || 'uncategorized';

      // Update read dates
      const readDates = { ...prev.readDates };
      if (!readDates[today]) {
        readDates[today] = { count: 0, timeSpent: 0 };
      }
      readDates[today].count++;
      readDates[today].timeSpent += timeSpent;

      // Update tag breakdown
      const tagBreakdown = { ...prev.tagBreakdown };
      tagBreakdown[tag] = (tagBreakdown[tag] || 0) + 1;

      // Recalculate streak
      const { current, longest } = calculateStreak(readDates);

      const newStats = {
        ...prev,
        totalArticlesRead: prev.totalArticlesRead + 1,
        totalTimeSpent: prev.totalTimeSpent + timeSpent,
        readDates,
        tagBreakdown,
        currentStreak: current,
        longestStreak: Math.max(longest, prev.longestStreak),
        lastReadDate: today
      };

      // Check achievements
      const { achievements, newAchievements } = checkAchievements(newStats);
      newStats.achievements = achievements;

      // Show new achievement notification
      if (newAchievements.length > 0) {
        setNewAchievement(newAchievements[0]);
        setTimeout(() => setNewAchievement(null), 3000);
      }

      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  // Get weekly progress
  const getWeeklyProgress = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    let weeklyCount = 0;
    for (let i = 0; i <= today.getDay(); i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = getDateString(date);
      weeklyCount += stats.readDates[dateStr]?.count || 0;
    }

    return {
      current: weeklyCount,
      goal: stats.weeklyGoal,
      percentage: Math.min(100, (weeklyCount / stats.weeklyGoal) * 100)
    };
  }, [stats]);

  // Get last 7 days activity
  const getWeeklyActivity = useCallback(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = getDateString(date);
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: stats.readDates[dateStr]?.count || 0
      });
    }
    return days;
  }, [stats]);

  // Update weekly goal
  const setWeeklyGoal = useCallback((goal) => {
    setStats(prev => {
      const newStats = { ...prev, weeklyGoal: goal };
      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  // Format time for display
  const formatTime = (seconds) => {
    if (seconds < 60) return '< 1 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  return {
    stats,
    trackArticleRead,
    getWeeklyProgress,
    getWeeklyActivity,
    setWeeklyGoal,
    formatTime,
    newAchievement,
    dismissAchievement: () => setNewAchievement(null)
  };
}

export default useReadingStats;
