import { useRef } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import ArticleCard from './ArticleCard';
import { useArticles, useFeeds } from '../hooks/useDatabase';
import { springGentle } from '../utils/animations';

export default function SavedView({ onSelectArticle, onLogoClick }) {
  const scrollRef = useRef(null);
  const { feeds } = useFeeds();
  const { articles, markRead } = useArticles({ filter: 'saved' });

  const handleArticleClick = async (article) => {
    await markRead(article.id);
    onSelectArticle(article);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      role="tabpanel"
      id="saved-panel"
      aria-labelledby="saved-tab"
    >
      <Header
        title="Saved"
        subtitle={articles.length > 0 ? `${articles.length} articles` : null}
        scrollRef={scrollRef}
        onLogoClick={onLogoClick}
      />

      <main
        ref={scrollRef}
        className="overflow-y-auto px-4 pb-4"
        style={{ height: 'calc(100vh - 49px - env(safe-area-inset-bottom))' }}
      >
        {articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="flex flex-col items-center justify-center px-8 py-20 text-center"
            role="status"
          >
            {/* Animated bookmark with ambient effect */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ ...springGentle, delay: 0.1 }}
            >
              {/* Ambient pulse */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 30px 15px rgba(255, 159, 10, 0.06)',
                    '0 0 50px 25px rgba(255, 159, 10, 0.1)',
                    '0 0 30px 15px rgba(255, 159, 10, 0.06)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 159, 10, 0.15), rgba(255, 159, 10, 0.05))',
                  border: '1px solid rgba(255, 159, 10, 0.2)'
                }}
              >
                <motion.svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[var(--color-warning)]"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.15 }}
              className="text-[24px] text-label mb-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.024em'
              }}
            >
              Your Reading List
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.2 }}
              className="text-label-secondary text-[15px] max-w-[280px] leading-relaxed"
              style={{ letterSpacing: '-0.016em' }}
            >
              Bookmark articles you want to read later. They'll be waiting for you here.
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.05 }
              }
            }}
            className="space-y-3"
            role="feed"
            aria-label="Saved articles"
          >
            {articles.map((article) => (
              <motion.div
                key={article.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <ArticleCard
                  article={article}
                  feedTitle={feeds.find(f => f.id === article.feedId)?.title}
                  onClick={() => handleArticleClick(article)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
