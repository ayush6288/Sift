import { supabase } from './supabaseClient';

// The API always lives on the same origin as the Vite build. During local
// development Vite proxies /api to uvicorn via vite.config.js.
export const API_BASE_URL = '';

async function accessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

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
  const token = await accessToken();
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function fetchWebhookConfig() {
  const payload = await apiRequest('/api/webhook-config');
  if (!payload?.url || !payload?.token) {
    throw new Error('The Sift API did not return a webhook configuration.');
  }
  return payload;
}

export async function fetchEmails(userId) {
  if (!userId) throw new Error('A signed-in user is required.');

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', userId)
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

export async function siftEmail(email, userId) {
  if (!userId) throw new Error('A signed-in user is required.');

  const row = await apiRequest('/api/sift', {
    method: 'POST',
    body: JSON.stringify({ ...email, user_id: userId }),
  });

  if (!row?.id) {
    throw new Error('The Sift API did not return the saved email.');
  }

  return row;
}

export async function updateEmailRecord(id, patch, userId) {
  if (!userId) throw new Error('A signed-in user is required.');

  try {
    const row = await apiRequest(`/api/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    if (!row?.id) {
      throw new Error('The Sift API did not return the updated email.');
    }

    return { row, source: 'api' };
  } catch (apiError) {
    if (!supabase) throw apiError;

    console.warn(
      'Server update failed; falling back to a user-scoped Supabase update.',
      apiError.message,
    );

    const { data, error } = await supabase
      .from('emails')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw apiError;
    return { row: data, source: 'supabase' };
  }
}

export async function deleteEmailRecord(id, userId) {
  if (!userId) throw new Error('A signed-in user is required.');

  try {
    await apiRequest(`/api/emails/${id}`, { method: 'DELETE' });
    return { source: 'api' };
  } catch (apiError) {
    if (!supabase) throw apiError;

    console.warn(
      'Server delete failed; falling back to a user-scoped Supabase delete.',
      apiError.message,
    );

    const { data, error } = await supabase
      .from('emails')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error || !data?.length) throw apiError;
    return { source: 'supabase' };
  }
}

export function subscribeToEmails(userId, onChange) {
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`emails:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'emails',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onChange(payload),
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(
          'Supabase postgres_changes is unavailable; live broadcasts and periodic refresh remain active.',
        );
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLiveUpdates(userId, onChange) {
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`sift:user:${userId}`)
    .on('broadcast', { event: 'email.changed' }, (payload) =>
      onChange(payload),
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(
          'Supabase live updates are unavailable; the inbox will refresh periodically.',
        );
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
