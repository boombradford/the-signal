// Re-export everything from localDb for compatibility
// This allows the app to work without Supabase authentication
export {
  initializeDB,
  defaultCategories,
  feedOperations,
  articleOperations,
  summaryOperations,
  settingsOperations
} from './localDb';
