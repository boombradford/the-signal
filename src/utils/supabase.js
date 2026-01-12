import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found, using fallback');
}

export const supabase = createClient(
  supabaseUrl || 'https://yifwrwljuypjqmngleuw.supabase.co',
  supabaseAnonKey || 'sb_publishable_RwHCZbYFyr15rogpBQLh5Q_5AVngNOy',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Get or create anonymous session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return session;
  }

  // Create anonymous session
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Failed to create anonymous session:', error);
    throw error;
  }

  return data.session;
}

// Get current user ID
export async function getUserId() {
  const session = await getSession();
  return session?.user?.id;
}

// Initialize auth on app load
export async function initAuth() {
  try {
    await getSession();
    return true;
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return false;
  }
}
