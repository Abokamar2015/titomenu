---
name: Planned Supabase → Replit DB migration (cafe-menu)
description: Why and how the cafe-menu app should eventually move off Supabase to Replit's free database + object storage.
---

# Planned migration: Supabase → Replit built-in DB (cafe-menu)

The cafe-menu app currently uses Supabase directly from the browser (anon key) for
`menu_items`, `categories`, `settings` tables + `menu-images` storage bucket. See
`artifacts/cafe-menu/src/lib/supabase.ts`.

**Decision:** The owner wants to move OFF Supabase to Replit's built-in PostgreSQL
(free with Replit) + Replit object storage to eliminate the Supabase bill.

**Why:** Supabase free tier hit `exceed_cached_egress_quota` (HTTP 402 on all REST
calls, even server-side) — the public menu showed "no items" because data fetches
were blocked. Restoring requires upgrading (paid) or waiting for the monthly free
quota reset.

**Plan agreed (June 2026):** Owner renews/restores Supabase for the current month so
the live menu works now; migration to Replit DB happens later (not yet done).

**How to apply when migrating:**
- Replit Postgres cannot be reached directly from the browser — route DB access
  through the `api-server` artifact (build real API endpoints + admin-write auth).
- Replace the direct-Supabase helpers in `src/lib/supabase.ts` with API calls.
- Move images from the `menu-images` bucket to Replit object storage.
- Extract existing Supabase data BEFORE the quota blocks again (egress resets monthly).
  When blocked, data is fully unreadable; item names (AR/EN) and categories are
  recoverable from the `/print` and `/` page screenshots, but prices/descriptions/
  images are not.
