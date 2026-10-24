import { supabase } from './supabaseClient';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000'
).replace(/\/+$/, '');

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
      `Could not reach the Sift API at ${API_BASE_URL}. Is FastAPI running?`,
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
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { rows: data ?? [], source: 'supabase' };
    } catch (error) {
      console.warn(
        'Direct Supabase read failed; falling back to the FastAPI bridge.',
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
  if (supabase) {
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
        'Direct Supabase update failed; falling back to the FastAPI bridge.',
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
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert(rows)
        .select();

      if (error) throw error;
      return { rows: data ?? [], source: 'supabase' };
    } catch (error) {
      console.warn(
        'Direct Supabase seed failed; falling back to the FastAPI bridge.',
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
