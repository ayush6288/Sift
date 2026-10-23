# Sift — Inbox, sorted

An email organiser dashboard built with React, Vite, and Tailwind CSS. Sift is a
front-end MVP that demonstrates AI-assisted triage: smart folders, priority
tags, two-bullet summaries, and quick actions over realistic mock mail.

## Features

- Smart folders for action-required mail, receipts and invoices, newsletters,
  and archive — with live conversation totals and unread indicators that stay
  in sync when mail is archived, restored, or moved.
- Quick filters for unread and high-priority conversations.
- Instant search across senders, subjects, snippets, bodies, tags, and
  attachments.
- Split-pane reading view with an AI summary, detected action item, and email
  body.
- Mark handled, move between folders, archive with undo, star, and a simulated
  AI reply draft.
- Simulated inbox sync that sorts new mail into the right folders.
- Collapsible desktop sidebar that becomes an icon rail, plus an off-canvas
  mailbox and list/detail navigation on mobile.
- Green-tinted dark theme enabled by default, with a persisted light/dark
  toggle in the header.
- Fully responsive: three-pane desktop layout and a focused reading view on
  smaller screens.

## Run locally

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

## Project structure

```
src/
├── components/
│   ├── Avatar.jsx
│   ├── EmailDetail.jsx
│   ├── EmailList.jsx
│   ├── Header.jsx
│   ├── Icons.jsx
│   ├── Sidebar.jsx
│   ├── Tag.jsx
│   └── Toast.jsx
├── data/mockEmails.js
├── utils/format.js
├── App.jsx
├── index.css
└── main.jsx
```

All inbox data is mocked in `src/data/mockEmails.js`; no backend or email
provider is connected.
