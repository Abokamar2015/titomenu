---
name: Backend now on Supabase (Railway target)
description: cafe-menu backend runs on Supabase Postgres + Supabase Storage; Replit DB/object storage are legacy fallbacks only.
---

# Backend: Supabase (July 2026)

The app was migrated Replit Postgres/object-storage → **Supabase** so the user can host on Railway and leave Replit.

- DB connection: `SUPABASE_DATABASE_URL` (session pooler, port 5432) with password **overridden** by `SUPABASE_DB_PASSWORD` — the URL secret contains a stale password. Fallback: `DATABASE_URL`. SSL `rejectUnauthorized:false` for supabase hosts.
- `SUPABASE_URL` secret may include a path (`/rest/v1`); code normalizes to origin. Direct-connection host `db.<ref>.supabase.co` does NOT resolve — only the pooler works.
- Storage: public bucket `menu-images`, keys `uploads/<uuid>`. Upload via Supabase signed upload URLs (PUT). Serving proxied through `/api/storage/objects/...` — this URL shape is stored in DB `image_url` columns and must stay stable.
- Client wire shapes stay snake_case; frontend helper file keeps the `supabase.ts` name (plain fetch, no SDK).
- All prod data migrated (50 items, 6 categories, 5 settings, 55 images).
- Deployment: root `Dockerfile` builds one service (static frontend + Express API); `STATIC_DIR` enables static serving/SPA fallback; `admin.<domain>` → `/admin` redirect. Arabic guide in `DEPLOY.md`.

**Why:** user wants full independence from Replit (cancel subscription); keep Replit deployment live until Railway + DNS verified.
