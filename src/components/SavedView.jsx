import { useRef } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import ArticleCard from './ArticleCard';
import { useArticles, useFeeds } from '../hooks/useDatabase';

export default function SavedView({ onSelectArticle }) {
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
            className="flex flex-col items-center justify-center px-8 py-20 text-center"
            role="status"
          >
            <div className="w-20 h-20 rounded-full bg-fill flex items-center justify-center mb-6" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-label-tertiary">
                <path
                  d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="font-display font-semibold text-xl text-label mb-2">
              No Saved Articles
            </h2>
            <p className="text-label-secondary text-[15px] max-w-[280px]">
              Tap the bookmark icon on any article to save it for later.
            </p>
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
