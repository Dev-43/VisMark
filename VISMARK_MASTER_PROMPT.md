# 🗂️ VisMark — Master Project Prompt

> Drop this file at the start of every new chat session.
> This gives the AI full context so you never repeat yourself.

---

## 📌 What This Project Is

**VisMark** is a visual bookmark manager web app.
Users can save links into named folders. Each saved link generates a visual card with a screenshot of the website, similar to a visual bookmark. If a screenshot can't be taken, it falls back gracefully.

This is a **learning project** — every feature is built with explanation first, then code. The goal is to understand what is being built, not just copy-paste it.

---

## 👤 About the Developer

- 2nd year B.Tech Computer Engineering student
- Has built projects using AI agents (Next.js, React) but doesn't always know the technical names of concepts used
- Learns best **feature by feature** — one complete vertical slice at a time (DB → Backend → Frontend)
- Wants to be able to explain every part of this project in an interview
- **Important:** Whenever a concept appears (middleware, auth tokens, queues, etc.), explain the real technical name + plain English meaning before using it in code

---

## 🛠️ Final Tech Stack

| Layer              | Technology                                    | Notes                                                                             |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Frontend           | Next.js 14 (App Router)                       | Deployed on Vercel                                                                |
| Backend            | Express.js (Node.js)                          | Deployed on Railway                                                               |
| Database           | Supabase (Postgres)                           | Also handles Auth + File Storage                                                  |
| Auth               | Google OAuth via Supabase Auth                | Anyone can sign in                                                                |
| Screenshot Service | Playwright (primary) + Puppeteer (fallback)   | Self-built sandbox on Railway backend                                             |
| Job Queue          | **BullMQ** + Redis                      | Async screenshot generation (BullMQ is the actively maintained successor to Bull) |
| Deployment         | Vercel (frontend) + Railway (backend + Redis) |                                                                                   |

---

## ✅ Feature Roadmap (Build Order)

Each feature = complete vertical slice. Never skip ahead.
Mark features as done as you go.

```
[ ] Feature 1  — Project Setup & Monorepo Folder Structure
[ ] Feature 2  — Google OAuth Login (Supabase Auth)
[ ] Feature 3  — Create / Rename / Delete Folders
[ ] Feature 4  — Paste a Link → Save to Folder (no screenshot yet)
[ ] Feature 5  — Screenshot Service + Fallback Chain (Puppeteer → OG tags → favicon → generic card)
[ ] Feature 6  — Rate Limiter on snapshot endpoint
[ ] Feature 7  — Search across all saved links
[ ] Feature 8  — Tags system
[ ] Feature 9  — Public folder sharing (optional shareable link)
[ ] Feature 10 — Final Deployment (Vercel + Railway)
[ ] Feature 11 — Collaboration Folders (usernames, invites, notifications, roles, activity log) — see full spec below
```

> **Note:** Screenshot service and fallback chain are built together as one feature (Feature 5).
> The fallback chain is not a separate step — it's the error-handling layer built inside the same service.

> **Update (post-launch):** Feature 5's screenshot engine was upgraded post-launch from Puppeteer-only to a dual-engine approach: **Playwright runs first, Puppeteer is the fallback**, before falling through to OG scraper → favicon → generic card. See "Screenshot Service Logic" section below for the updated flow and error-classification rules.

---

## 🏗️ Project Folder Structure

```
VisMark/
├── frontend/                  # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/            # Login / signup pages
│   │   ├── (dashboard)/       # Main app after login
│   │   │   ├── page.tsx       # Home — shows all folders
│   │   │   └── folder/[id]/   # Single folder view
│   │   ├── api/               # Next.js API routes (thin layer)
│   │   └── layout.tsx
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Supabase client, helper functions
│   └── .env.local             # Frontend env variables
│
├── backend/                   # Express.js server
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── links.js       # Save/delete links
│   │   │   └── snapshot.js    # Screenshot endpoint
│   │   ├── services/
│   │   │   ├── puppeteer.js   # Headless browser logic
│   │   │   ├── ogScraper.js   # OG tag fallback
│   │   │   └── queue.js       # BullMQ queue setup
│   │   ├── middleware/
│   │   │   ├── auth.js        # Verify Supabase JWT token
│   │   │   └── rateLimiter.js # express-rate-limit config
│   │   └── index.js           # Express app entry point
│   └── .env                   # Backend env variables
│
└── README.md
```

---

## 🗄️ Database Schema (Supabase / Postgres)

### Table: `folders`

```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
name        text not null
is_public   boolean default false
public_slug text unique          -- used for public sharing URL
created_at  timestamp default now()
```

### Table: `links`

```sql
id             uuid primary key default gen_random_uuid()
folder_id      uuid references folders(id) on delete cascade
user_id        uuid references auth.users(id) on delete cascade
url            text not null
title          text
description    text
screenshot_url text                -- stored in Supabase Storage
favicon_url    text
snapshot_status text default 'pending'  -- pending | done | failed
created_at     timestamp default now()
```

---

## 🔐 Environment Variables

### frontend/.env.local

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### backend/.env

```
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # NOT the anon key — this is the admin key
SUPABASE_STORAGE_BUCKET=         # the bucket name where screenshots are saved
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=3600000     # 1 hour
RATE_LIMIT_MAX=10                # max snapshots per user per hour
```

> **Note:** `SUPABASE_STORAGE_BUCKET` is needed in Feature 5 when screenshots are uploaded.
> Supabase Storage has its own access policies separate from RLS — this will be explained in Feature 5.

---

## 📸 Screenshot Service Logic (updated post-launch)

```
URL received at POST /api/snapshot
        ↓
Rate limiter checks (per user, 10/hour)  →  429 if exceeded
        ↓
Add job to BullMQ queue
        ↓
Worker attempts PLAYWRIGHT screenshot (primary engine)
        ↓ success                    ↓ fail
Save to Supabase Storage      Is error non-recoverable?
Update DB: status=done        (DNS failure / 404 / 410)
                                ↓ yes              ↓ no (timeout, bot-block, generic)
                          Skip Puppeteer,    Worker attempts PUPPETEER screenshot (fallback)
                          go straight to           ↓ success           ↓ fail
                          OG scraper         Save to Supabase Storage   ↓
                                             Update DB: status=done     ↓
                                                                  Try OG scraper (og:image, og:title)
                                                                        ↓ success        ↓ fail
                                                                  Use og:image      Use favicon only
                                                                                          ↓ fail
                                                                                    Generic card (domain name + icon)
```

**Engine files:**
- `backend/src/services/playwrightSnapshot.js` — primary engine, Chromium via Playwright, `browser.newContext()` per job (singleton browser instance)
- `backend/src/services/puppeteer.js` — fallback engine, unchanged from original implementation
- Wired together in `backend/src/services/worker.js` (BullMQ job processor)

**Non-recoverable vs recoverable error classification (Playwright → Puppeteer fallback decision):**
- **Non-recoverable (skip Puppeteer, go straight to OG scraper):** DNS/network resolution failures (`net::ERR_NAME_NOT_RESOLVED`, `net::ERR_ADDRESS_UNREACHABLE`, `net::ERR_CONNECTION_REFUSED`, `NS_ERROR_UNKNOWN_HOST`), and definitive HTTP statuses `404` / `410` returned by the page response.
- **Recoverable (fall back to Puppeteer):** Timeouts, bot-blocks (often `403`/`503`), and generic rendering errors — since a different engine/fingerprint may succeed where Playwright didn't.

---

## 🤝 Feature 11 — Collaboration Folders (v1 scope, planned)

> Added post-launch, on top of the Playwright-primary/Puppeteer-fallback codebase. This is the largest feature since original launch — touches auth, permissions, and every existing link/folder route.

### Why usernames, not email invites
Google OAuth gives verified emails, but inviting-by-email exposes user emails to other users. Decision: add a `profiles` table with a unique `username`, chosen during a mandatory onboarding step after first OAuth login (Supabase Auth has no native username concept). Invite lookups query `profiles`, never `auth.users` email directly. Username/password login is a **separate future feature (v2+)** — not bundled into this one, since it drags in signup forms, password policy, and reset flows that collaboration doesn't need.

### New tables
```sql
-- profiles: extends auth.users with a username, created during onboarding
profiles
  id          uuid primary key references auth.users(id) on delete cascade
  username    text unique not null   -- store/compare lowercase
  created_at  timestamp default now()

-- folder_members: replaces single-owner model for shared folders
folder_members
  id          uuid primary key default gen_random_uuid()
  folder_id   uuid references folders(id) on delete cascade
  user_id     uuid references profiles(id)
  role        text not null           -- 'owner' | 'editor' | 'viewer'
  joined_at   timestamp default now()

-- folder_invites: pending invite awaiting accept/decline via notification
folder_invites
  id            uuid primary key default gen_random_uuid()
  folder_id     uuid references folders(id) on delete cascade
  invited_by    uuid references profiles(id)
  invited_user  uuid references profiles(id)
  role          text default 'editor'
  status        text default 'pending'  -- pending | accepted | declined
  created_at    timestamp default now()

-- folder_activity: audit log, survives member removal (references profiles, not folder_members)
folder_activity
  id          uuid primary key default gen_random_uuid()
  folder_id   uuid references folders(id) on delete cascade
  user_id     uuid references profiles(id)
  action      text not null   -- link_added | link_deleted | member_invited | member_joined
                               -- | member_removed | member_left | description_edited
                               -- | public_share_toggled | delete_initiated | ownership_transferred
  target_id   uuid            -- link id / member id, depending on action
  created_at  timestamp default now()

-- notifications: in-app delivery for invites (polling for v1, Realtime push in v2)
notifications
  id            uuid primary key default gen_random_uuid()
  recipient_id  uuid references profiles(id) on delete cascade
  type          text not null       -- 'folder_invite' for now
  folder_id     uuid references folders(id) on delete cascade
  invite_id     uuid references folder_invites(id)
  status        text default 'pending'  -- pending | accepted | declined
  created_at    timestamp default now()
```

`links.added_by` and `folder_activity.user_id` reference `profiles(id)`, not `folder_members(id)` — deliberate, so a removed member's past contributions and log entries remain intact and attributable after they leave.

### Permission model
- **Owner** — full control: invite/remove members, transfer ownership, initiate delete, toggle public sharing. Only one per folder.
- **Editor** — add/delete links, edit both scraped and personal link descriptions (on any link in the folder, not just their own). Cannot manage members or the folder itself.
- **Viewer** — read-only.
- All actions above are written to `folder_activity` regardless of role.

### Leave / removal flow
- Any non-owner member can leave freely, no flow required.
- On leave or removal, the member is offered the choice to **keep a personal copy of only the links they personally added** (not the whole folder — avoids copying other members' saved links without their say). If accepted, this duplicates those `links` rows (new IDs) into a new personal folder owned solely by them, executed synchronously before their `folder_members` row is deleted (they lose read access to the source folder immediately after).
- Their historical `folder_activity` entries and `links.added_by` references on links that remain in the shared folder are untouched — still attributed to their `profiles.id`, which continues to exist.

### Ownership transfer & folder deletion
- Owner **cannot leave** without first transferring ownership to another member (mandatory, no exceptions).
- Owner **can initiate delete** at any time — no member veto/consensus. All members are notified when a delete is initiated so removal isn't a surprise. Deletion is immediate on confirm — no scheduled grace-period window, since there's no veto to protect against and nothing waiting to be cancelled.
- **v2 add-on:** when initiating delete, the owner can optionally enable "allow full folder copy." If enabled, members get the option to copy the *entire* folder's links (not just their own contributions) into their own workspace before it's deleted. If the owner doesn't enable this, members fall back to the default — copying only the links they personally added (same as the regular leave/removal flow). This is owner-gated specifically because copying everyone else's saved links is a bigger permission question than copying your own.

### Public sharing interaction (Feature 9 carryover)
- A folder can be both publicly shared (read-only link, Feature 9) and have collaboration members simultaneously.
- Toggling public sharing stays **owner-only** and is now logged (`public_share_toggled`).
- Public view never shows the activity log or member list.

### Personal link description
```sql
alter table links add column personal_description text;
```
- `description` = scraped OG description (unchanged, default display).
- `personal_description` = optional manual override, nullable, editable via the link card's edit action.
- Editors can edit `personal_description` on **any** link in the folder (per permission model above) — a per-link override field, not a per-user one, despite the name.

### Required before/alongside this feature
- **Full IDOR re-audit** at the end of the build: every existing route currently checking `.eq('user_id', owner)` must become a `folder_members` membership + role check — including routes the pre-launch security audit already hardened once. Highest-risk part of this feature since it modifies already-fixed code.
- **Rate limiting** on the invite endpoint (same reasoning as the existing snapshot rate limiter — prevents invite spam).

### v1 vs v2 split
**v1 (required — shared folders aren't safe to use without these):** profiles + username onboarding, invites via username lookup, notifications (polling), `folder_members` / `folder_activity` tables, editor/viewer permission enforcement, leave/removal with own-links-only copy option, ownership transfer, delete-on-confirm (immediate, all members notified), public-sharing interaction rules, personal link description, full IDOR re-audit.

**v2 (deferred, not required for correctness):**
- Real-time notification delivery via Supabase Realtime (websocket push) instead of polling
- Owner-enabled "full folder copy" option on delete (default remains own-links-only copy)
- Username/password login (separate feature entirely, not a collaboration dependency)

### Build order (vertical slices, same pattern as Features 1–10)
```
[x] 11.1  — profiles table + mandatory username-selection onboarding step (DB → backend check → frontend gate)
[ ] 11.2  — folder_members table + migrate existing folders (owner row per folder) + update folder read/list routes to join through membership
[ ] 11.3  — folder_invites table + invite-by-username route + username-exists check (frontend + backend)
[ ] 11.4  — notifications table + polling endpoint + accept/decline routes + bell/panel UI
[ ] 11.5  — editor/viewer permission enforcement across all link routes (add/delete/edit)
[ ] 11.6  — folder_activity table + logging calls wired into every mutation from 11.2–11.9
[ ] 11.7  — leave / removal flow + own-links-only copy option (frontend prompt + backend duplication routine)
[ ] 11.8  — ownership transfer flow (mandatory before owner can leave)
[ ] 11.9  — delete-folder flow: owner-initiated, immediate on confirm, all members notified
[ ] 11.10 — personal_description column + link card edit UI + display fallback logic
[ ] 11.11 — full IDOR re-audit across all Feature 11 routes + re-check pre-existing routes touched by membership migration
```
> Mark each sub-feature complete before moving to the next, same as the top-level roadmap. 11.11 is last on purpose — it depends on everything above existing first.

---

### 11.2 migration safety — MANDATORY, not optional
Migrating existing single-owner folders to `folder_members` is a one-way-door step touching live data. All of the following are required before any route is rewritten to check membership instead of `folders.user_id`:
1. **Backfill via a single set-based SQL statement**, not an application-code loop: `insert into folder_members (folder_id, user_id, role) select id, user_id, 'owner' from folders`. Atomic, can't partially fail halfway through.
2. **Verify row counts match** — `count(*)` on `folders` must equal `count(*)` on `folder_members` immediately after backfill. If they don't match, stop and investigate before proceeding.
3. **Take a Supabase backup/snapshot immediately before running the backfill on real data.** Test the backfill on a copy first if at all possible.
4. **Strict ordering, no half-migrated state:** create table (empty) → run backfill → verify counts → only then start rewriting routes, one at a time. Never ship a state where some routes check `folders.user_id` and others check `folder_members` — that's how an IDOR reappears.
5. **Keep `folders.user_id` column in place** until every route is confirmed migrated and tested. It's the cross-check reference; don't drop it early.
6. **Full grep audit of every `.eq('user_id', ...)` occurrence** across the whole backend before starting — not just the folder routes. The original security audit found IDORs in link creation, tag association, and snapshot trigger too. Build this into an explicit checklist, not memory.
7. **Confirm public-folder sharing (Feature 9) is unaffected** — its slug-based access path must not accidentally start requiring `folder_members` membership, which would break public viewing for logged-out visitors.
8. **Rollback plan written down before running anything:** a feature-flagged fallback to the old `folders.user_id` check (env var or simple conditional) so route logic can revert instantly without a new deploy, plus the pre-migration backup to restore from if needed.
9. **Test on a second real Supabase test account before production** — migrate a test folder, manually verify: owner retains full access, a random non-member is denied, a public folder still loads for a logged-out request.

---

## 🧑‍💻 How Feature 11 will be built (workflow change from Features 1–10)

Starting with this feature, the codebase is large enough that agent-based building (via Antigravity or similar) replaces manual line-by-line code writing. This changes what happens per sub-feature (11.1–11.11):

- **Concept explained first**, same as always — what it is, why it exists, before anything else.
- **No raw code provided directly.** Instead, a clear, scoped **prompt for the coding agent** is written — including explicit "do not refactor unrelated files" / surgical-change constraints, matching the pattern already found to work well with Antigravity.
- **Step-by-step instructions** for what to run/verify after the agent produces changes (migrations to run, endpoints to test in Thunder Client, etc.) — a checklist, not a code dump.
- **Frontend is built alongside each sub-feature**, not deferred to the end — so each of 11.1 through 11.11 is testable live immediately after building, the same vertical-slice principle (DB → backend → frontend) just applied at the sub-feature level instead of only the feature level.
- **Only the table(s) needed for the current sub-feature are created** — e.g. `profiles` in 11.1, `folder_members` in 11.2, `folder_invites` in 11.3, and so on. Don't pre-create all five tables upfront; this keeps each sub-feature a genuine standalone vertical slice and makes rollback of a single sub-feature realistic if something goes wrong.
- **Diffs/agent output should be reviewed before accepting**, same scrutiny as the migration safety checklist above — an agent producing working-looking code isn't the same as it being safe or scoped correctly.

### Mandatory agent workflow per sub-feature
- **One git branch per sub-feature** (e.g. `feature/11.1-profiles`, `feature/11.2-folder-members`), created by the agent before starting work on that sub-feature.
- **Before pushing, the agent must run and pass verification**: lint (`npm run lint` or equivalent), build check, and any other existing project checks — not just "the feature appears to work."
- **Only after verification passes** does the agent push the branch. Branch stays separate from `main` until you've done the Thunder Client + click-through confirmation yourself.
- This gives clean, isolated rollback per sub-feature if something's wrong — matches the "each sub-feature is a standalone slice" principle already established.

### How to start each sub-feature going forward
This document is written to be handed directly to the coding agent as the only context needed — no separate "fullshot" prompt has to be written per session. To start a sub-feature, tell the agent: **"Read VISMARK_MASTER_PROMPT.md, build Feature [X.X]."** The agent should have everything it needs — schema, permission model, table scope, branch/verification requirements — from this file. In chat, Claude's role per sub-feature is: explain the concept first, then after the agent's build is pushed, walk through the Thunder Client / click-through steps to confirm it actually works.

---

## 🧠 Concepts to Learn Along the Way

These will be explained as they appear in the code. Listed here so you know what's coming:

- **Middleware** — functions that run before your route handler
- **JWT (JSON Web Token)** — how Supabase proves a user is logged in
- **REST API** — the pattern for how frontend talks to backend
- **Environment Variables** — secrets kept out of your code
- **Async / Await + Promises** — how JavaScript handles waiting
- **Job Queue (BullMQ)** — offloading slow tasks so the server doesn't freeze
- **Headless Browser** — a real browser running with no visible window
- **Rate Limiting** — preventing one user from abusing an endpoint
- **Graceful Degradation** — when the best option fails, fall back to something still useful
- **Row Level Security (RLS)** — Supabase feature so users can only see their own data
- **Supabase Storage Policies** — separate from RLS; controls who can read/write files in storage buckets
- **OAuth** — how "Login with Google" works without storing passwords

---

## 📋 Rules for Every Chat Session

1. **State which feature you are working on** at the start of the chat
2. **Explain the concept before writing code** — what is it, why does it exist
3. **Explain every new file** — what it does, where it fits in the structure
4. **Don't dump full files** — guide line by line where understanding matters
5. **When something breaks** — debug together, explain why it broke
6. **Use the folder structure above** — don't invent new locations
7. **Never skip the DB step** — every feature starts with the data model
8. **Mark the feature complete** in the README.md checklist before moving to the next

---

## 📍 Current Status

**Last completed feature:** Feature 10 — Final Deployment (Vercel + Railway); project launched publicly.

**Post-launch work completed:**
- 8-phase frontend redesign
- Public launch across Twitter/X, LinkedIn, Reddit
- Security audit (fixed unauthenticated share route, 2× IDOR bugs, snapshot-trigger IDOR, SSRF risk in Puppeteer endpoint)
- **Dual-engine screenshot upgrade:** Added Playwright as primary screenshot engine with existing Puppeteer service retained as fallback (see updated "Screenshot Service Logic" above). Tested and confirmed working locally via Thunder Client, including the full fallback chain.

**Currently working on:** Redeployment — Railway free trial expired, backend/Redis currently down. Evaluating Render (web service) + Upstash (Redis) as the free-tier replacement, since Render's free tier alone may be too memory-constrained (512 MB RAM) to reliably run two Chromium-based engines simultaneously. Deployment is on hold pending this decision.

**Blockers / notes:**
- Backend is currently offline (Railway trial expired) — app is not live until redeployed.
- Next.js major version upgrade (14.x → 16.x) still deferred from pre-launch audit, not yet started.
- Known minor bug: Supabase Storage screenshot URLs currently resolve with a double slash (`public//screenshots/...`) — appears cosmetic but not yet confirmed harmless in all cases.
- **Feature 11 (Collaboration Folders) is fully spec'd but not started** — see section above for schema, permission model, and v1/v2 split. Should begin only after backend redeployment is resolved.
