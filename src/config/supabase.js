import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://ddclppyrnnpxzltggorp.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY2xwcHlybm5weHpsdGdnb3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzU4ODcsImV4cCI6MjEwNjQxMTg4N30.0VzShWRqsNeyJgB7YUJj_2Pm_j8roPsY0dqnHT3vqLw';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || defaultUrl).trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey).trim();

// Supabase is configured if valid URL and Key are present
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
