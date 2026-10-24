# Sift — Inbox, sorted

Sift is a full-stack email triage dashboard: React + Vite on the front end, a
FastAPI service for AI classification, Gemini structured outputs, and Supabase
for persistence.

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
cp backend/.env.example backend/.env
```

Fill in the Supabase and Gemini credentials. The backend uses the
`SUPABASE_SERVICE_ROLE_KEY`, so that file must stay private. Never put the
service-role key in the root `.env` — Vite exposes every `VITE_*` variable to the
browser.

For direct browser access to Supabase, set the project's full anon/public key as
`VITE_SUPABASE_ANON_KEY`. If it is missing or truncated, Sift automatically uses
the secure FastAPI bridge (`GET /api/emails`) for reads and writes. The UI footer
shows which path is active.

### 2. Backend

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn main:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/api/health`

The model is configurable with `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL`.
Recent Google AI Studio keys reject `gemini-2.5-flash`; the local configuration
uses `gemini-3.5-flash` with `gemini-3-flash-preview` as a fallback.

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
- `GET /api/emails` — list emails for the browser-safe API bridge.
- `POST /api/emails/seed` — insert sample records when the inbox is empty.

## Build and lint

```bash
npm run lint
npm run build
```

## Project structure

```
backend/
├── main.py              FastAPI routes, Gemini triage, Supabase persistence
├── requirements.txt
└── .env.example
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
│   ├── emailService.js  Direct Supabase client + FastAPI fallback
│   └── supabaseClient.js
├── utils/format.js
├── App.jsx
├── index.css
└── main.jsx
```
