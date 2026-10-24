# Sift — Inbox, sorted

Sift is a production, multi-user email triage dashboard: React + Vite on the
front end, a FastAPI Python Function for AI classification, Gemini structured
outputs, and Supabase for authentication and persistence. The whole stack runs
from one Vercel project, so the browser calls same-origin `/api/*` routes.

Every inbox is private to the signed-in Supabase user. Sift classifies mail into
**Action Required**, **Receipts**, **Newsletters**, or **Archive**, assigns a
**High / Medium / Low** priority, and writes a two-sentence TL;DR with a concrete
next action.

## Features

- Email/password Supabase authentication with persisted sessions and a working
  sign-out flow.
- Per-user inbox isolation enforced by Supabase row-level security and by every
  API query filtering on `user_id`.
- Live inbox updates through Supabase Realtime Broadcast after every API
  write, with postgres_changes and a 30-second refresh as fallbacks.
- **Import / Forward Email** dialog that sends a pasted message through FastAPI
  and Gemini, then prepends and selects the AI-sorted result.
- Personal inbound webhook endpoint for Gmail auto-forwarding, Postmark,
  CloudMailin, and SendGrid.
- Category tags, priority badges, two-bullet AI summaries, and a concrete action
  item in the reading pane.
- Smart folders with live totals, quick filters, and instant search across
  senders, subjects, bodies, and tags.
- Archive, delete, and mark-handled actions with optimistic UI and undo support
  for folder moves.
- Collapsible desktop sidebar, off-canvas mobile navigation, and a persisted
  light/dark theme.

There is no demo mode, sample seed, or fallback inbox content. A new account
starts with the production empty state.

## Run locally

### 1. Environment files

```bash
cp .env.example .env
cp api/.env.example api/.env
```

The root `.env` contains build-time public Supabase credentials:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The API `.env` contains server-only secrets:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODEL=gemini-3-flash-preview
```

Never place the service-role key in a `VITE_*` variable. Vite exposes those to
the browser.

### 2. Supabase

Apply [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
It enables RLS policies so authenticated users can read, update, and delete only
their own rows, adds the user/created-at index, and optionally adds `emails` to
the realtime publication. Live updates work without the publication because the
API broadcasts a row id after every write. Browser inserts stay disabled; the
service-role API is the only writer.

Email/password auth must be enabled in **Supabase → Authentication → Providers**.
If "Confirm email" is enabled, new accounts receive a confirmation link before
their first sign-in.

### 3. Backend

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn api.index:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/api/health`

### 4. Frontend

```bash
npm ci
npm run dev
```

Open the Vite URL and create an account. The dev server proxies `/api` to
`http://127.0.0.1:8000`, so keep uvicorn running in another terminal.

## API

All user-facing routes require `Authorization: Bearer <supabase-access-token>`.
The API verifies the token with Supabase before touching data.

- `GET /api/health` — service health.
- `GET /api/webhook-config` — return the signed inbound webhook URL for the
  authenticated user.
- `POST /api/sift` — classify and save an email. Authenticated requests use the
  verified token's user. External webhook requests must supply both `user_id`
  and an HMAC `token` query parameter. Every successful write broadcasts a row
  id to the owner's live channel.
- `GET /api/emails` — list only the authenticated user's emails.
- `PATCH /api/emails/{email_id}` — persist `is_handled` and/or `category` for a
  row owned by the authenticated user.
- `DELETE /api/emails/{email_id}` — delete a row owned by the authenticated
  user.

API documentation (`/docs`, `/redoc`, `/openapi.json`) is disabled outside
development. The API caps request bodies at 100 KB, applies per-IP and per-user
sliding-window limits, and returns generic JSON errors without upstream details.

The broadcast payload contains only the affected row id. Each open tab then
refetches through Supabase RLS, so email content never travels over the channel.

### Inbound webhook

Each signed-in user can copy their personal endpoint from the **Webhook**
button in the header:

```text
https://your-sift-domain/api/sift?user_id=<supabase-user-id>&token=<hmac-token>
```

The token is a stateless HMAC-SHA256 of the user id. It is derived from
`WEBHOOK_SECRET` when set; otherwise Sift derives a dedicated signing subkey
from the server-only `SUPABASE_SERVICE_ROLE_KEY`. The token is returned only by
the authenticated `GET /api/webhook-config` endpoint.

It accepts JSON or form-encoded payloads from Postmark, CloudMailin, and
SendGrid. Supported aliases include:

| Sift field | Accepted inbound fields |
| --- | --- |
| `sender` | `sender`, `from`, `From`, `FromFull`, `fromFull` |
| `subject` | `subject`, `Subject` |
| `body` | `body`, `TextBody`, `text`, `plain`, `stripped-text`, `body-plain`, `html`, `HtmlBody` |
| `user_id` | `?user_id=` query parameter (required for external webhooks) |
| `token` | `?token=` query parameter (required for external webhooks) |

Keep the endpoint URL private. Anyone with the full URL can add mail to that
inbox and consume that user's classification quota. Rotate `WEBHOOK_SECRET` to
invalidate every outstanding webhook URL.

## Build and lint

```bash
npm run lint
npm run build
```

## Deploy to Vercel

The repository is one Vercel project:

- Vite builds the frontend into `dist/`.
- `api/index.py` exports the FastAPI `app` and becomes one Python Function.
- `requirements.txt` installs the Python dependencies.
- `vercel.json` sends `/api/*` to the function and every other route to the SPA.

Add these environment variables in **Vercel → Project → Settings → Environment
Variables** for Production and Preview:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL (build time). |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (build time). |
| `SUPABASE_URL` | Supabase project URL (runtime). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key. |
| `GEMINI_API_KEY` | Server-only Gemini key. |
| `GEMINI_MODEL` | Optional; defaults to `gemini-3.5-flash`. |
| `GEMINI_FALLBACK_MODEL` | Optional; defaults to `gemini-3-flash-preview`. |
| `WEBHOOK_SECRET` | Optional; decouples webhook signing from the service key. |
| `FRONTEND_ORIGINS` | Optional; comma-separated extra CORS origins. |
| `MAX_EMAILS_PER_DAY` | Optional; rolling 24-hour per-inbox cap (default 500). |

Redeploy after changing a `VITE_*` variable because Vite inlines it at build
time. The Python Function needs no separate hosting.

`vercel.json` installs with `npm ci`, applies immutable caching to hashed
assets, marks API responses `no-store`, and sends HSTS, CSP, frame, MIME,
referrer, and permissions headers. Vite production source maps are disabled.

## Security model

- Supabase RLS restricts browser reads, updates, and deletes to the signed-in
  user. Browser inserts stay disabled; the API writes with a server-only key.
- Every API read/write is also explicitly filtered by the verified `user_id`.
- External webhook ingestion requires a user-specific HMAC token in addition to
  the user id and is rejected with `401` before Gemini is called.
- `/api/sift` is limited to 10 requests per minute per IP and per user; other
  API routes are limited to 60 per minute per IP and per user. Vercel Firewall
  adds an edge rate-limit layer. Responses use `Retry-After`.
- Request bodies over 100 KB return `413`; sender, subject, and body fields are
  capped at 320, 998, and 50,000 characters.
- CORS accepts only the production Sift origins and local Vite origins.
- Production deployments are public; preview deployments stay protected by
  Vercel Authentication. Fork protection and protected source maps are enabled.

## Project structure

```text
api/
├── index.py             FastAPI auth, webhook normalization, Gemini triage
└── .env.example
supabase/
└── schema.sql           RLS, index, and realtime publication
requirements.txt         Python dependencies installed by Vercel
vercel.json              API + SPA routing
src/
├── components/
│   ├── AuthPage.jsx      Sign in / create account
│   ├── ComposeModal.jsx  Import / forward email
│   ├── WebhookPopover.jsx Personal inbound endpoint and copy action
│   ├── EmailDetail.jsx
│   ├── EmailList.jsx
│   ├── Header.jsx
│   └── ...
├── lib/
│   ├── emailMapper.js   Supabase row ↔ UI model conversion
│   ├── emailService.js  User-scoped Supabase client + authenticated API fallback
│   ├── folders.js       Shared folder definitions
│   ├── supabaseClient.js
│   └── user.js
├── utils/format.js
├── App.jsx
├── index.css
└── main.jsx
```
