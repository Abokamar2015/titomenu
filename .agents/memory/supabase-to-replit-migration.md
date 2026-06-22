---
name: cafe-menu Supabase → Replit migration
description: How the cafe-menu backend was moved off Supabase to Replit Postgres + object storage, and the constraints that keep it working.
---

# cafe-menu: off Supabase, onto Replit Postgres + object storage

The cafe-menu app was migrated off Supabase (to kill an egress bill) onto Replit's
free Postgres (Drizzle, `lib/db`) + object storage, served by the `api-server`
artifact at `/api`.

## Constraints worth keeping consistent

- **`src/lib/supabase.ts` filename is intentionally kept** even though it no longer
  uses Supabase. It is now a thin `fetch` client to `/api`. Pages import named
  helpers + types from it; do not rename without updating MenuPage/AdminPage/PrintMenuPage.
  **Why:** the migration's whole point was zero page changes — keep the helper
  surface (signatures + snake_case types) identical to the old Supabase helpers.
- **Field shapes stay snake_case on the wire** (`name_ar`, `is_available`, etc.).
  The api-server maps snake_case ↔ camelCase Drizzle columns. Client/UI never sees
  camelCase.
- **`deleteMenuImage` is a deliberate no-op.** Orphaned objects are negligible cost;
  there is no object-delete endpoint. Don't "fix" it into a real delete unless asked.
- **Image upload = presigned flow:** client POSTs `/api/storage/uploads/request-url`,
  PUTs bytes to the returned GCS URL, then stores `/api/storage<objectPath>` as the
  serving URL.

## Gotchas learned

- **`pnpm remove`/`pnpm add` rewrite `pnpm-workspace.yaml`** — they strip the
  `minimumReleaseAge` security comment block and reorder/normalize the file, and can
  leave the lockfile in a state that makes an unrelated package (mockup-sandbox)
  fail typecheck with a dual-Vite TS error (two vite instances differing only by
  optional `tsx`/`yaml` peers). Fix: restore `pnpm-workspace.yaml` from HEAD via
  `git show HEAD:pnpm-workspace.yaml > pnpm-workspace.yaml`, then
  `pnpm install --no-frozen-lockfile` to regenerate a clean lockfile. After a clean
  reinstall the dual-Vite typecheck error disappears.
- **Route ordering:** in `api-server/src/routes/menu.ts`, `/menu/items/sort-orders`
  must be declared BEFORE `/menu/items/:id` or the `:id` route shadows it.
- Image PNGs are ~2MB each, so they load slowly (~5s) on first paint — this is a
  pre-existing asset-size issue, not a migration bug.
