# Sift — Inbox, sorted

Sift is a full-stack email triage dashboard: React + Vite on the front end, a
FastAPI Python Function for AI classification, Gemini structured outputs, and
Supabase for persistence. The whole stack runs from a single Vercel project —
the browser calls same-origin `/api/*` routes, so no separate API host or
`localhost:8000` server is needed in production.

Incoming email is classified into **Action Required**, **Receipts**,
**Newsletters**, or **Archive**, assigned a **High / Medium / Low** priority, and
summarised into a two-sentence TL;DR with a concrete next action.

## Features

- Live inbox backed by the Supabase `emails` table, ordered newest first.
- One-click sample inbox seeding when the database is empty.
- "Simulate incoming email" modal that sends a message through FastAPI and
  Gemini, then prepends and selects the AI-sorted result.
- Category tags, priority badges, two-bullet AI summaries, and detected action
  items in the reading pane.
- Smart folders with live conversation totals, quick filters, and instant
  search across senders, subjects, bodies, and tags.
- Mark handled and folder moves persist to Supabase and remain after refresh,
  with undo support.
- Collapsible desktop sidebar, off-canvas mobile navigation, and a green-tinted
  dark theme with a persisted light/dark toggle.

## Run locally

### 1. Environment files

```bash
cp .env.example .env
cp api/.env.example api/.env
```

Fill in the Supabase and Gemini credentials. The API uses the
`SUPABASE_SERVICE_ROLE_KEY`, so `api/.env` must stay private. Never put the
service-role key in the root `.env` — Vite exposes every `VITE_*` variable to the
browser.

The root `.env` holds the public Supabase URL and anon key. The `emails` table
has RLS enabled without anon policies, so Sift uses the server-side API for
reads and writes by default. Set `VITE_SUPABASE_DIRECT=true` only after adding
RLS policies for the anon role. The UI footer shows whether it is using
**Vercel API** or **Supabase direct**.

### 2. Backend

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn api.index:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/api/health`

The model is configurable with `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL`.
Recent Google AI Studio keys reject `gemini-2.5-flash`; the defaults are
`gemini-3.5-flash` with `gemini-3-flash-preview` as a fallback.

### 3. Frontend

```bash
npm install
npm run dev
```

Open the Vite URL. If the `emails` table is empty, choose **Seed sample emails**
to populate a realistic inbox. Use the header's **Simulate email** button to
classify a new message with Gemini.

## API

- `GET /api/health` — service health.
- `POST /api/sift` — classify `{ sender, subject, body }`, save it, and return the
  inserted Supabase row.
- `PATCH /api/emails/{email_id}` — persist `is_handled` and/or `category`.
- `GET /api/emails` — list emails for the same-origin browser API.
- `POST /api/emails/seed` — insert sample records when the inbox is empty.

## Build and lint

```bash
npm run lint
npm run build
```

## Deploy to Vercel

The repository is a single Vercel project:

- Vite builds the frontend into `dist/`.
- `api/index.py` exports the FastAPI `app` and becomes one Python Function.
- `requirements.txt` at the repository root installs the Python dependencies.
- `vercel.json` sends `/api/*` to the function and every other route to the SPA.

Add these environment variables in **Vercel → Project → Settings → Environment
Variables** for Production and Preview:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL (build time). |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (build time). |
| `VITE_SUPABASE_DIRECT` | `false`; enables direct browser reads only with RLS policies. |
| `SUPABASE_URL` | Supabase project URL (runtime). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key. Never expose with `VITE_`. |
| `GEMINI_API_KEY` | Server-only Gemini key. |
| `GEMINI_MODEL` | Optional; defaults to `gemini-3.5-flash`. |
| `GEMINI_FALLBACK_MODEL` | Optional; defaults to `gemini-3-flash-preview`. |

Leave `VITE_API_URL` unset in Vercel so the browser uses same-origin `/api`.
Redeploy after changing any `VITE_*` variable because Vite inlines them at build
time. The Python Function needs no separate hosting.

## Project structure

```
api/
├── index.py             FastAPI routes, Gemini triage, Supabase persistence
└── .env.example
requirements.txt         Python dependencies installed by Vercel
vercel.json              API + SPA routing
src/
├── components/
│   ├── EmailDetail.jsx
│   ├── EmailList.jsx
│   ├── Header.jsx
│   ├── SimulateEmailModal.jsx
│   └── ...
├── data/mockEmails.js   Seed content and folder definitions
├── lib/
│   ├── emailMapper.js   Supabase row ↔ UI model conversion
│   ├── emailService.js  Same-origin API client (+ opt-in Supabase direct)
│   └── supabaseClient.js
├── utils/format.js
├── App.jsx
├── index.css
└── main.jsx
```
