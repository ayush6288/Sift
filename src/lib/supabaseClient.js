import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

// The dashboard sometimes hands out a REST endpoint. The SDK expects the
// project origin and appends /rest/v1 itself.
export const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

// A pasted JWT is only usable when it has all three segments. Ignore partial
// keys instead of booting a client that will fail on every request.
const isPartialJwt =
  rawAnonKey.startsWith('eyJ') && rawAnonKey.split('.').length !== 3;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && rawAnonKey && !isPartialJwt,
);

if (isPartialJwt) {
  console.warn(
    'VITE_SUPABASE_ANON_KEY looks truncated. Authentication and Supabase queries are unavailable.',
  );
}

// The auth client must exist whenever the public project credentials are
// present. Data access still runs through Supabase RLS with the signed-in
// user's JWT; the service-role key never reaches the browser.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
