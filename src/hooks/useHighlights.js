import { useLiveQuery } from 'dexie-react-hooks';
import { highlightOperations } from '../utils/localDb';

export function useHighlights(articleId) {
  const highlights = useLiveQuery(
    () => highlightOperations.getByArticle(articleId),
    [articleId]
  );

  return {
    highlights: highlights || [],
    addHighlight: (text, note) => highlightOperations.add(articleId, text, note),
    deleteHighlight: (id) => highlightOperations.delete(id)
  };
}
