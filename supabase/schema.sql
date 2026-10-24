-- Sift multi-user schema hardening.
--
-- Apply this in the Supabase SQL editor for the project that serves Sift.
-- The browser reads, updates, and deletes rows directly through Supabase with
-- the signed-in user's JWT. Inserts stay server-side because only the FastAPI
-- function holds the service-role key.

create extension if not exists pgcrypto;

create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null,
  subject text not null,
  body text not null,
  category text not null,
  priority text not null,
  ai_summary text not null default '',
  action_item text not null default 'None',
  is_handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep older projects working when the table already exists.
alter table public.emails
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.emails enable row level security;

drop policy if exists "Sift users can read their own email" on public.emails;
create policy "Sift users can read their own email"
  on public.emails
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Sift users can update their own email" on public.emails;
create policy "Sift users can update their own email"
  on public.emails
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Sift users can delete their own email" on public.emails;
create policy "Sift users can delete their own email"
  on public.emails
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT policy for the authenticated role: only the service-role API
-- classifies and inserts inbound messages.

create index if not exists emails_user_id_created_at_idx
  on public.emails (user_id, created_at desc);

-- Realtime is used for live inserts and updates. The frontend also polls as a
-- fallback, but adding the table to the publication makes updates instant.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'emails'
  ) then
    alter publication supabase_realtime add table public.emails;
  end if;
end
$$;
