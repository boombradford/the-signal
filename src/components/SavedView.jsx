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
            {/* Bookmark icon */}
            <motion.div
              className="relative mb-10"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ ...springGentle, delay: 0.1 }}
            >
              <div className="relative">
                <div
                  className="relative w-24 h-24 rounded-3xl flex items-center justify-center bg-[rgba(255,159,10,0.1)] border border-[rgba(255,159,10,0.2)]"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      stroke="#FF9F0A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Plus badge */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center bg-[#FF9F0A] text-white border-2 border-[var(--color-background)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springGentle, delay: 0.3 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.15 }}
              className="text-[26px] text-label mb-3"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.028em'
              }}
            >
              Your Reading List
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.2 }}
              className="text-label-secondary text-[15px] max-w-[300px] leading-relaxed mb-6"
              style={{ letterSpacing: '-0.016em' }}
            >
              Bookmark articles you want to read later. They'll be waiting for you here.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...springGentle, delay: 0.3 }}
              className="text-label-tertiary text-[13px]"
              style={{ letterSpacing: '-0.008em' }}
            >
              Swipe right on any article to save it
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
