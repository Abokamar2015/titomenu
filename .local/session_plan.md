# Objective
Migrate cafe-menu off Supabase to Replit's free Postgres + object storage. Keep the
client helper API surface (`src/lib/supabase.ts` functions) identical so MenuPage/
AdminPage need no changes; only reimplement helper bodies to hit the api-server.

# Tasks

### T001: Drizzle schema for menu_items, categories, settings
- Blocked By: []
- Files: lib/db/src/schema/{menuItems,categories,settings}.ts + index.ts
- Match Supabase shapes (uuid id for items, text key PK for categories/settings).
- Acceptance: `pnpm --filter @workspace/db run push` creates tables.

### T002: Object storage server setup
- Blocked By: []
- Copy objectStorage.ts, objectAcl.ts, routes/storage.ts templates into api-server.
- Install @google-cloud/storage google-auth-library.
- Acceptance: storage routes mounted, typecheck passes.

### T003: Menu API routes (CRUD) in api-server
- Blocked By: [T001]
- routes: items, categories, settings. Drizzle + zod validation.
- Acceptance: GET/POST/PATCH/DELETE work via curl through proxy /api.

### T004: Data + image migration script
- Blocked By: [T001, T002]
- Upload 55 backup images to object storage, insert rows from data-backup JSON with
  rewritten image_url serving paths.
- Acceptance: DB has 50 items, 6 categories, 5 settings; images serve via /api.

### T005: Rewrite client helpers to use API
- Blocked By: [T003, T002]
- Reimplement src/lib/supabase.ts (rename file optional) with fetch to /api.
- Keep all exported function signatures + types identical.
- Acceptance: MenuPage + AdminPage work unchanged.

### T006: Verify end-to-end + cleanup
- Screenshot menu (items show), test admin CRUD + image upload.
- Remove @supabase/supabase-js dep + Supabase env reliance.
- Acceptance: app fully works without Supabase; typecheck clean.
