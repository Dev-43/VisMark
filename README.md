# VisMark 🔖

A visual bookmark manager that saves links as screenshot cards — organized into folders, searchable, taggable, and shareable.

**Live Demo:** [vis-mark-two.vercel.app](https://vis-mark-two.vercel.app)

---

## What It Does

Paste any URL into a folder and VisMark automatically captures a visual card for it — a real screenshot of the page, or a graceful fallback if the screenshot fails. Think of it as a Pinterest-style bookmarks manager where every saved link looks like the actual website.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | UI, routing, server components |
| Backend | Express.js (Node.js) | REST API, auth middleware, job dispatch |
| Database | Supabase (PostgreSQL) | Data storage + Row Level Security |
| Auth | Google OAuth via Supabase Auth | Passwordless login |
| File Storage | Supabase Storage | Screenshot image hosting |
| Screenshot Service | Puppeteer (headless Chrome) | Automated page capture |
| Job Queue | BullMQ + Redis | Async screenshot processing |
| Deployment | Vercel (frontend) + Railway (backend + Redis) | Production hosting |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (User)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 Frontend  (Vercel)                      │
│                                                                 │
│  /login           → Google OAuth via Supabase Auth             │
│  /dashboard       → Folder list, search, tags                  │
│  /dashboard/folder/[id] → Links inside a folder                │
│  /share/[slug]    → Public read-only folder view               │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API calls (with JWT)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express.js Backend  (Railway)                      │
│                                                                 │
│  POST /api/folders        → Create folder                      │
│  GET  /api/folders        → List user's folders                │
│  POST /api/links          → Save a link                        │
│  POST /api/snapshot       → Trigger screenshot job             │
│  GET  /api/search         → Full-text search across links      │
│  GET  /api/tags           → List/create/assign tags            │
│  GET  /api/shared/:slug   → Public folder (no auth)            │
│                                                                 │
│  Middleware:                                                    │
│  ├── auth.js        → Verifies Supabase JWT on every request   │
│  └── rateLimiter.js → Max 10 snapshots/user/hour               │
└──────────┬────────────────────────────┬────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────┐         ┌─────────────────────────────────┐
│  Supabase        │         │  BullMQ Queue  (Redis/Railway)  │
│  (PostgreSQL)    │         │                                 │
│                  │         │  Worker picks up screenshot job │
│  folders table   │         │  ┌─────────────────────────┐   │
│  links table     │◄────────│  │ 1. Puppeteer screenshot  │   │
│  tags table      │         │  │ 2. OG tag scraper        │   │
│  link_tags table │         │  │ 3. Favicon only          │   │
│                  │         │  │ 4. Generic card fallback │   │
│  Storage bucket: │◄────────│  └─────────────────────────┘   │
│  screenshots/    │  upload │                                 │
└──────────────────┘         └─────────────────────────────────┘
```

---

## Screenshot Fallback Chain

When a link is saved, a background job tries to get a visual in this order:

```
POST /api/snapshot
      │
      ▼
Rate limiter (10/hour per user)
      │
      ▼
BullMQ adds job to Redis queue
      │
      ▼
Worker: try Puppeteer (headless Chrome)
      │
      ├── ✅ Success → upload PNG to Supabase Storage → status: done
      │
      └── ❌ Blocked/timeout
              │
              ▼
          Try OG tag scraper (og:image, og:title, og:description)
              │
              ├── ✅ Found og:image → use it → status: done
              │
              └── ❌ No og:image
                      │
                      ▼
                  Try favicon (https://domain/favicon.ico)
                      │
                      ├── ✅ Found → show favicon card → status: failed
                      │
                      └── ❌ Nothing works → generic domain name card → status: failed
```

This pattern is called **graceful degradation** — the app never shows a broken card. It always has something to display.

---

## Database Schema

### `folders`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
name        text not null
is_public   boolean default false
public_slug text unique
created_at  timestamp default now()
```

### `links`
```sql
id              uuid primary key default gen_random_uuid()
folder_id       uuid references folders(id) on delete cascade
user_id         uuid references auth.users(id) on delete cascade
url             text not null
title           text
description     text
screenshot_url  text
favicon_url     text
snapshot_status text default 'pending'   -- pending | done | failed
created_at      timestamp default now()
```

### `tags` + `link_tags`
```sql
-- tags
id      uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id) on delete cascade
name    text not null

-- link_tags (join table)
link_id uuid references links(id) on delete cascade
tag_id  uuid references tags(id) on delete cascade
```

Row Level Security (RLS) is enabled on all tables — users can only read and write their own data.

---

## Project Structure

```
VisMark/
├── frontend/                        # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/login/            # Login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/           # Folder list + search + tags
│   │   │   └── dashboard/folder/[id]/  # Single folder view
│   │   └── share/[slug]/            # Public folder (no auth)
│   ├── components/                  # Reusable UI (FolderCard, LinkCard, TagPicker...)
│   ├── lib/
│   │   ├── supabase/                # Supabase browser + server clients
│   │   └── hooks/                   # useTags, useSearch, etc.
│   └── .env.local
│
├── backend/                         # Express.js API server
│   └── src/
│       ├── routes/
│       │   ├── folders.js           # CRUD for folders
│       │   ├── links.js             # Save / delete links
│       │   ├── snapshot.js          # Trigger screenshot job
│       │   ├── search.js            # Full-text search
│       │   ├── tags.js              # Tag management
│       │   └── share.js             # Public folder endpoint
│       ├── services/
│       │   ├── queue.js             # BullMQ queue setup + Redis connection
│       │   ├── worker.js            # Job processor (Puppeteer → OG → favicon)
│       │   ├── puppeteer.js         # Headless Chrome screenshot logic
│       │   └── ogScraper.js         # OG tag + favicon scraper
│       ├── middleware/
│       │   ├── auth.js              # Supabase JWT verification
│       │   └── rateLimiter.js       # express-rate-limit (10 snapshots/user/hour)
│       └── index.js                 # Express app entry point
│
└── README.md
```

---

## Features

- **Google OAuth login** — one-click sign in, no passwords stored
- **Folder management** — create, rename, delete folders
- **Visual link cards** — each saved link generates a screenshot card automatically
- **Screenshot fallback chain** — Puppeteer → OG tags → favicon → generic card
- **Background job queue** — screenshots processed async via BullMQ, UI never blocks
- **Rate limiting** — max 10 screenshot requests per user per hour
- **Full-text search** — search across all saved links by title, URL, description
- **Tags system** — create tags and assign them to links for filtering
- **Public folder sharing** — generate a shareable slug for any folder; viewable without login

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project
- Redis (local via Docker or a cloud Redis)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev            # runs on localhost:4000
```

**Required env variables (`backend/.env`):**
```
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=screenshots
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=10
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev                         # runs on localhost:3000
```

**Required env variables (`frontend/.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Root directory: `frontend` |
| Backend + Redis | Railway | Root directory: `backend`, Redis added as a database service |

**Key production steps:**
1. Add Vercel domain to Supabase Auth → URL Configuration → Redirect URLs
2. Set `NEXT_PUBLIC_BACKEND_URL` on Vercel to the Railway backend domain
3. Set CORS `allowedOrigins` in `backend/src/index.js` to include your Vercel domain
4. `REDIS_URL` on Railway is auto-injected when Redis and backend are in the same project

---

## Key Concepts Used

| Concept | Where It's Used |
|---|---|
| JWT (JSON Web Token) | Supabase issues a JWT on login; backend verifies it in `middleware/auth.js` on every protected request |
| OAuth 2.0 | Google login flow handled by Supabase Auth — no passwords stored anywhere |
| REST API | All frontend↔backend communication follows REST conventions (GET/POST/DELETE + JSON) |
| Job Queue | BullMQ + Redis decouple screenshot generation from the HTTP request — the API responds immediately, the screenshot happens in the background |
| Headless Browser | Puppeteer runs a real Chrome instance with no visible window to capture page screenshots |
| Rate Limiting | `express-rate-limit` + Redis tracks how many snapshot requests each user makes per hour |
| Graceful Degradation | Screenshot service always falls back to something useful rather than showing an error |
| Row Level Security | Supabase RLS policies ensure users can only query their own folders and links at the database level |
| CORS | Backend explicitly allows only trusted origins (localhost + Vercel domain) to make API calls |

---

## API Reference

All endpoints except `/health` and `/api/shared/:slug` require a `Bearer` JWT token in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/folders` | List user's folders |
| POST | `/api/folders` | Create a folder |
| PATCH | `/api/folders/:id` | Rename a folder |
| DELETE | `/api/folders/:id` | Delete a folder |
| GET | `/api/links?folderId=` | Get links in a folder |
| POST | `/api/links` | Save a new link |
| DELETE | `/api/links/:id` | Delete a link |
| POST | `/api/snapshot` | Trigger screenshot job for a link |
| GET | `/api/search?q=` | Search across all user's links |
| GET | `/api/tags` | List user's tags |
| POST | `/api/tags` | Create a tag |
| POST | `/api/tags/assign` | Assign tag to a link |
| GET | `/api/shared/:slug` | Get public folder (no auth) |

---

## License

MIT
