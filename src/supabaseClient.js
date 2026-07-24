import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.warn(
    'Supabase credentials are placeholders. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable live database features.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
