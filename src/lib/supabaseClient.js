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
    'VITE_SUPABASE_ANON_KEY looks truncated. Sift will use the FastAPI bridge.',
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, rawAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
