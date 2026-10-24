import { supabase } from './supabaseClient';

// The API always lives on the same origin as the Vite build. During local
// development Vite proxies /api to uvicorn via vite.config.js.
export const API_BASE_URL = '';

// Direct browser access is opt-in because the emails table has RLS enabled
// without anon policies. The server-side API uses the service role instead.
const directSupabaseEnabled =
  import.meta.env.VITE_SUPABASE_DIRECT === 'true' && Boolean(supabase);

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function detailMessage(payload, fallback) {
  if (typeof payload?.detail === 'string') return payload.detail;
  if (Array.isArray(payload?.detail)) {
    const messages = payload.detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ');
    if (messages) return messages;
  }
  return fallback;
}

async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Could not reach the Sift API at ${API_BASE_URL || 'the same origin'}.`,
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(
      detailMessage(payload, `The Sift API returned HTTP ${response.status}.`),
    );
  }

  return payload;
}

export async function fetchEmails() {
  if (directSupabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { rows: data ?? [], source: 'supabase' };
    } catch (error) {
      console.warn(
        'Direct Supabase read failed; falling back to the server API.',
        error.message,
      );
    }
  }

  const rows = await apiRequest('/api/emails');
  return { rows: Array.isArray(rows) ? rows : [], source: 'api' };
}

export async function siftEmail(email) {
  const row = await apiRequest('/api/sift', {
    method: 'POST',
    body: JSON.stringify(email),
  });

  if (!row?.id) {
    throw new Error('The Sift API did not return the saved email.');
  }

  return row;
}

export async function updateEmailRecord(id, patch) {
  if (directSupabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { row: data, source: 'supabase' };
    } catch (error) {
      console.warn(
        'Direct Supabase update failed; falling back to the server API.',
        error.message,
      );
    }
  }

  const row = await apiRequest(`/api/emails/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  if (!row?.id) {
    throw new Error('The Sift API did not return the updated email.');
  }

  return { row, source: 'api' };
}

export async function seedEmailRecords(rows) {
  if (directSupabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert(rows)
        .select();

      if (error) throw error;
      return { rows: data ?? [], source: 'supabase' };
    } catch (error) {
      console.warn(
        'Direct Supabase seed failed; falling back to the server API.',
        error.message,
      );
    }
  }

  const inserted = await apiRequest('/api/emails/seed', {
    method: 'POST',
    body: JSON.stringify({ emails: rows }),
  });

  return {
    rows: Array.isArray(inserted) ? inserted : [],
    source: 'api',
  };
}
