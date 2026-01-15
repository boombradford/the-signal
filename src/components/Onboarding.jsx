/**
 * Onboarding Flow
 *
 * Premium 3-step onboarding experience:
 * 1. Welcome - Brand moment with value proposition
 * 2. Topics - Select interests to personalize experience
 * 3. Feeds - Choose from recommended feeds based on interests
 *
 * Design: Apple-inspired, minimal, confident
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KevinLogoHero } from './KevinLogo';
import { springQuick, easeApple, triggerHaptic } from '../utils/animations';

// Topic definitions with icons and starter feeds (expanded for better coverage)
const TOPICS = [
  {
    id: 'technology',
    label: 'Technology',
    description: 'Software, gadgets, startups',
    color: '#0A84FF',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    feeds: [
      { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
      { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica' },
      { url: 'https://hnrss.org/frontpage', name: 'Hacker News' },
      { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch' },
    ]
  },
  {
    id: 'ai',
    label: 'AI & ML',
    description: 'Artificial intelligence, research',
    color: '#5E5CE6',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M12 12v10M8 22h8" />
        <circle cx="6" cy="8" r="1" fill="currentColor" />
        <circle cx="18" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
    feeds: [
      { url: 'https://www.anthropic.com/rss.xml', name: 'Anthropic' },
      { url: 'https://openai.com/blog/rss/', name: 'OpenAI' },
      { url: 'https://deepmind.google/blog/rss.xml', name: 'DeepMind' },
      { url: 'https://huggingface.co/blog/feed.xml', name: 'Hugging Face' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Markets, business, crypto',
    color: '#30D158',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-6" />
      </svg>
    ),
    feeds: [
      { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' },
      { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
      { url: 'https://seekingalpha.com/feed.xml', name: 'Seeking Alpha' },
    ]
  },
  {
    id: 'science',
    label: 'Science',
    description: 'Research, space, environment',
    color: '#BF5AF2',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 3v6l-4 8h14l-4-8V3" />
        <path d="M9 3h6" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
    feeds: [
      { url: 'https://www.quantamagazine.org/feed/', name: 'Quanta Magazine' },
      { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', name: 'NASA' },
      { url: 'https://www.nature.com/nature.rss', name: 'Nature' },
      { url: 'https://phys.org/rss-feed/', name: 'Phys.org' },
    ]
  },
  {
    id: 'world',
    label: 'World News',
    description: 'Global events, international',
    color: '#FF9F0A',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    feeds: [
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times World' },
      { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters' },
      { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' },
    ]
  },
  {
    id: 'politics',
    label: 'Politics',
    description: 'Policy, elections, analysis',
    color: '#FF453A',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    feeds: [
      { url: 'https://fivethirtyeight.com/politics/feed/', name: 'FiveThirtyEight' },
      { url: 'https://www.politico.com/rss/politics08.xml', name: 'Politico' },
      { url: 'https://feeds.npr.org/1014/rss.xml', name: 'NPR Politics' },
    ]
  },
  {
    id: 'sports',
    label: 'Sports',
    description: 'News, scores, analysis',
    color: '#64D2FF',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 0 20" />
        <path d="M12 2c-2.4 2.4-3.8 5.5-4 9 .2 3.5 1.6 6.6 4 9" />
        <path d="M2 12h20" />
      </svg>
    ),
    feeds: [
      { url: 'https://theathletic.com/feeds/rss/news/', name: 'The Athletic' },
      { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN' },
      { url: 'https://www.si.com/rss/si_topstories.rss', name: 'Sports Illustrated' },
    ]
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Entertainment, arts, gaming',
    color: '#FF375F',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    feeds: [
      { url: 'https://www.polygon.com/rss/index.xml', name: 'Polygon' },
      { url: 'https://pitchfork.com/feed/feed-news/rss', name: 'Pitchfork' },
      { url: 'https://www.newyorker.com/feed/culture', name: 'The New Yorker' },
      { url: 'https://www.vulture.com/rss/index.xml', name: 'Vulture' },
    ]
  },
  {
    id: 'newsletters',
    label: 'Newsletters',
    description: 'Curated analysis, deep dives',
    color: '#AC8E68',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 6L2 7" />
      </svg>
    ),
    feeds: [
      { url: 'https://stratechery.com/feed/', name: 'Stratechery' },
      { url: 'https://www.platformer.news/rss/', name: 'Platformer' },
      { url: 'https://www.ben-evans.com/benedictevans/rss.xml', name: 'Benedict Evans' },
      { url: 'https://www.notboring.co/feed', name: 'Not Boring' },
    ]
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Wellness, medicine, fitness',
    color: '#FF6482',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    feeds: [
      { url: 'https://www.statnews.com/feed/', name: 'STAT News' },
      { url: 'https://www.health.harvard.edu/blog/feed', name: 'Harvard Health' },
      { url: 'https://www.medicalnewstoday.com/newsfeeds/rss', name: 'Medical News Today' },
    ]
  },
];

// Slide transition variants
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedFeeds, setSelectedFeeds] = useState([]);
  const [subscribing, setSubscribing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Get recommended feeds based on selected topics
  const recommendedFeeds = TOPICS
    .filter(t => selectedTopics.includes(t.id))
    .flatMap(t => t.feeds.map(f => ({ ...f, topic: t.label })))
    .filter((feed, index, self) =>
      index === self.findIndex(f => f.url === feed.url)
    );

  const goToStep = (newStep) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const toggleTopic = (topicId) => {
    triggerHaptic('selection');
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const toggleFeed = (feedUrl) => {
    triggerHaptic('selection');
    setSelectedFeeds(prev =>
      prev.includes(feedUrl)
        ? prev.filter(url => url !== feedUrl)
        : [...prev, feedUrl]
    );
  };

  const handleComplete = useCallback(async () => {
    setSubscribing(true);
    triggerHaptic('success');

    // Get feeds to subscribe to
    const feedsToAdd = selectedFeeds.length > 0
      ? recommendedFeeds.filter(f => selectedFeeds.includes(f.url))
      : []; // If none selected, skip adding feeds

    // Set up progress tracking
    setProgress({ current: 0, total: feedsToAdd.length });

    // Progress callback for parallel subscription
    const handleProgress = (current, total) => {
      setProgress({ current, total });
    };

    // Complete onboarding with selected feeds and progress callback
    await onComplete(feedsToAdd, selectedTopics, handleProgress);
    setSubscribing(false);
  }, [selectedFeeds, recommendedFeeds, selectedTopics, onComplete]);

  const handleSkip = useCallback(() => {
    triggerHaptic('light');
    onComplete([], []);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[300] bg-[var(--color-background)] overflow-hidden">
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="flex gap-2 max-w-md mx-auto">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--color-fill)] relative"
            >
              <motion.div
                className="h-full rounded-full absolute inset-0"
                initial={{ width: 0 }}
                animate={{ width: step >= i ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  background: step >= i ? 'var(--color-tint)' : 'transparent',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        whileTap={{ scale: 0.95 }}
        className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-4 z-10 px-4 py-2 text-[15px] text-[var(--color-tint)] hover:opacity-80 transition-opacity"
        style={{ letterSpacing: '-0.016em' }}
      >
        Skip
      </motion.button>

      {/* Content */}
      <div className="h-full pt-[calc(env(safe-area-inset-top)+48px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={easeApple}
              className="h-full flex flex-col items-center justify-center px-8 text-center"
            >
              <div className="mb-12">
                <KevinLogoHero />
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ...easeApple }}
                className="text-[28px] font-semibold text-label mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  letterSpacing: '-0.032em'
                }}
              >
                Your intelligent reading companion
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...easeApple }}
                className="text-[17px] text-label-secondary max-w-[300px] leading-relaxed mb-12"
                style={{ letterSpacing: '-0.022em' }}
              >
                AI-powered summaries, personalized feeds, and a reading experience designed for focus.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ...easeApple }}
                className="relative w-full max-w-[280px]"
              >
                <motion.button
                  onClick={() => {
                    triggerHaptic('medium');
                    goToStep(1);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full h-14 px-10 text-[17px] font-semibold text-white rounded-full overflow-hidden"
                  style={{
                    background: 'var(--color-tint)',
                    boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                    letterSpacing: '-0.022em'
                  }}
                >
                  Get Started
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Topic Selection */}
          {step === 1 && (
            <motion.div
              key="topics"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={easeApple}
              className="h-full flex flex-col px-6"
            >
              <div className="text-center mb-8 pt-8">
                <h1
                  className="text-[28px] font-semibold text-label mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    letterSpacing: '-0.032em'
                  }}
                >
                  What interests you?
                </h1>
                <p
                  className="text-[15px] text-label-secondary"
                  style={{ letterSpacing: '-0.016em' }}
                >
                  Select topics to personalize your feed
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pb-4">
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {TOPICS.map((topic, index) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, ...easeApple }}
                        onClick={() => toggleTopic(topic.id)}
                        whileTap={{ scale: 0.97 }}
                        className="relative p-4 rounded-2xl text-left transition-all duration-200"
                        style={{
                          background: isSelected ? `${topic.color}15` : 'var(--color-fill)',
                          boxShadow: isSelected ? `0 0 0 2px ${topic.color}` : 'none',
                        }}
                      >
                        <div
                          className="mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: isSelected ? topic.color : `${topic.color}15`,
                            color: isSelected ? 'white' : topic.color,
                          }}
                        >
                          {topic.icon}
                        </div>
                        <h3
                          className="relative text-[15px] font-semibold mb-0.5"
                          style={{
                            letterSpacing: '-0.016em',
                            color: isSelected ? topic.color : 'var(--color-label)',
                          }}
                        >
                          {topic.label}
                        </h3>
                        <p
                          className="relative text-[12px] text-label-tertiary"
                          style={{ letterSpacing: '-0.008em' }}
                        >
                          {topic.description}
                        </p>

                        {/* Checkmark */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              background: topic.color,
                              boxShadow: `0 2px 8px ${topic.color}60`,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Continue button */}
              <div className="pt-4 pb-2">
                <div className="relative">
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium');
                      if (selectedTopics.length > 0) {
                        // Pre-select all recommended feeds
                        const allFeedUrls = TOPICS
                          .filter(t => selectedTopics.includes(t.id))
                          .flatMap(t => t.feeds.map(f => f.url));
                        setSelectedFeeds(allFeedUrls);
                      }
                      goToStep(2);
                    }}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedTopics.length === 0}
                    className="relative w-full h-14 text-[17px] font-semibold rounded-full disabled:opacity-50 transition-colors"
                    style={{
                      background: selectedTopics.length > 0
                        ? 'var(--color-tint)'
                        : 'var(--color-fill-secondary)',
                      boxShadow: selectedTopics.length > 0
                        ? '0 2px 8px rgba(10, 132, 255, 0.25)'
                        : 'none',
                      letterSpacing: '-0.022em',
                      color: selectedTopics.length > 0 ? 'white' : 'var(--color-label-tertiary)',
                    }}
                  >
                    <span className="relative z-10">
                      {selectedTopics.length === 0
                        ? 'Select at least one topic'
                        : `Continue with ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}`
                      }
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Feed Selection */}
          {step === 2 && (
            <motion.div
              key="feeds"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={easeApple}
              className="h-full flex flex-col px-6"
            >
              <div className="text-center mb-6 pt-8">
                <h1
                  className="text-[28px] font-semibold text-label mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    letterSpacing: '-0.032em'
                  }}
                >
                  Recommended for you
                </h1>
                <p
                  className="text-[15px] text-label-secondary"
                  style={{ letterSpacing: '-0.016em' }}
                >
                  We'll add these feeds to get you started
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pb-4">
                <div className="max-w-md mx-auto space-y-2">
                  {recommendedFeeds.map((feed, index) => (
                    <motion.button
                      key={feed.url}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, ...easeApple }}
                      onClick={() => toggleFeed(feed.url)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 ${
                        selectedFeeds.includes(feed.url)
                          ? 'bg-[var(--color-tint)]/10 ring-1 ring-[var(--color-tint)]/30'
                          : 'bg-[var(--color-fill)] hover:bg-[var(--color-fill-secondary)]'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedFeeds.includes(feed.url)
                            ? 'bg-[var(--color-tint)]'
                            : 'bg-[var(--color-fill-secondary)] border border-[var(--color-separator)]'
                        }`}
                      >
                        {selectedFeeds.includes(feed.url) && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </motion.svg>
                        )}
                      </div>

                      {/* Feed info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-[15px] font-medium text-label"
                          style={{ letterSpacing: '-0.016em' }}
                        >
                          {feed.name}
                        </h3>
                        <p
                          className="text-[12px] text-label-tertiary"
                          style={{ letterSpacing: '-0.008em' }}
                        >
                          {feed.topic}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 pb-2 space-y-3">
                <div className="relative">
                  <motion.button
                    onClick={handleComplete}
                    whileTap={{ scale: 0.98 }}
                    disabled={subscribing}
                    className="relative w-full h-14 text-[17px] font-semibold text-white rounded-full disabled:opacity-70 flex items-center justify-center gap-2 overflow-hidden"
                    style={{
                      background: 'var(--color-tint)',
                      boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
                      letterSpacing: '-0.022em'
                    }}
                  >
                  {subscribing ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <motion.svg
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </motion.svg>
                        <span>
                          {progress.total > 0
                            ? `Adding feeds (${progress.current}/${progress.total})`
                            : 'Setting up...'}
                        </span>
                      </div>
                      {progress.total > 0 && (
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                          />
                        </div>
                      )}
                    </div>
                    ) : selectedFeeds.length > 0 ? (
                      <span className="relative z-10">{`Add ${selectedFeeds.length} feed${selectedFeeds.length > 1 ? 's' : ''} and start`}</span>
                    ) : (
                      <span className="relative z-10">Skip and start empty</span>
                    )}
                  </motion.button>
                </div>

                {selectedFeeds.length > 0 && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedFeeds([]);
                    }}
                    className="w-full py-2 text-[15px] text-label-secondary hover:text-label transition-colors"
                    style={{ letterSpacing: '-0.016em' }}
                  >
                    Deselect all
                  </button>
                )}

                {/* Back button */}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    goToStep(1);
                  }}
                  className="w-full py-2 text-[15px] text-label-tertiary hover:text-label-secondary transition-colors"
                  style={{ letterSpacing: '-0.016em' }}
                >
                  Back to topics
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
