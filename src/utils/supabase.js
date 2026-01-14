import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yifwrwljuypjqmngleuw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZndyd2xqdXlwanFtbmdsZXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTQwNzcsImV4cCI6MjA1MjEzMDA3N30.RwHCZbYFyr15rogpBQLh5Q_5AVngNOy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Auth state management
let currentSession = null;
let authListeners = [];

// Subscribe to auth state changes
export function onAuthStateChange(callback) {
  authListeners.push(callback);

  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners(session) {
  authListeners.forEach(cb => cb(session));
}

// Initialize auth and set up listener
export async function initAuth() {
  // Check if we have auth tokens in the URL hash (email verification callback)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = hashParams.get('type');

  if (accessToken && refreshToken) {
    // Set the session from the URL tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error && data.session) {
      currentSession = data.session;
      // Clean up the URL hash
      window.history.replaceState(null, '', window.location.pathname);
      notifyListeners(currentSession);
      return currentSession;
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    currentSession = session;
    notifyListeners(session);
  });

  // If no session, create anonymous session for backward compatibility
  if (!currentSession) {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        currentSession = data.session;
      }
    } catch (err) {
      console.warn('Anonymous auth not available:', err);
    }
  }

  return currentSession;
}

// Get current session
export async function getSession() {
  if (currentSession) return currentSession;

  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;
  return session;
}

// Get current user ID
export async function getUserId() {
  const session = await getSession();
  return session?.user?.id;
}

// Check if user is authenticated (non-anonymous)
export async function isAuthenticated() {
  const session = await getSession();
  return session?.user && !session.user.is_anonymous;
}

// Email/Password Sign Up
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    }
  });

  if (error) throw error;

  currentSession = data.session;
  return data;
}

// Email/Password Sign In
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  currentSession = data.session;
  return data;
}

// Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  currentSession = null;

  // Re-create anonymous session
  try {
    const { data } = await supabase.auth.signInAnonymously();
    currentSession = data?.session;
  } catch (err) {
    console.warn('Could not create anonymous session:', err);
  }
}

// Get current user
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

// Password Reset
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return true;
}

// Update Password
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
}

// Link anonymous account to email
export async function linkEmailToAnonymous(email, password) {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) throw error;
  return data;
}
