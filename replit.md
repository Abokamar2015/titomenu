# & Co. Coffee Shop Menu

A bilingual (Arabic/English) digital menu app for "& Co. Coffee Shop & Pop Up" with a public menu page and password-protected admin panel.

## Run & Operate

- `pnpm --filter @workspace/cafe-menu run dev` — run the menu app (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the API server (Express, port 8080, mounted at `/api`)
- `pnpm --filter @workspace/db run push` — push Drizzle schema changes to Postgres
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, framer-motion, sonner (toasts), wouter (routing)
- UI: shadcn/ui components (radix-ui primitives)
- Backend: Express api-server + Supabase Postgres (Drizzle ORM) + Supabase Storage (bucket `menu-images`)
- Client: plain `fetch` helpers (no SDK) hitting the api-server at `/api`

## Where things live

- `artifacts/cafe-menu/` — the React + Vite frontend app
  - `src/pages/MenuPage.tsx` — public bilingual menu (Arabic/English toggle)
  - `src/pages/AdminPage.tsx` — password-protected admin panel
  - `src/lib/supabase.ts` — backend client: fetch helpers for all DB/storage operations (filename kept for stable imports; no longer uses Supabase)
  - `src/lib/motion.ts` — framer-motion spring presets
  - `src/lib/constants.ts` — route paths, category labels (no password — auth is server-side)
  - `public/images/` — cover.jpg, LOGO.png, cropped category image
- `artifacts/api-server/` — Express API server (serves the menu app's `/api` routes)
  - `src/routes/menu.ts` — CRUD for items, categories, settings (Drizzle + Zod)
  - `src/routes/storage.ts`, `src/lib/objectStorage.ts` — object storage upload/serve
- `lib/db/src/schema/` — Drizzle schemas: `menuItems`, `categories`, `settings`

## Architecture decisions

- Supabase Postgres is the single source of truth: `menu_items`, `categories`, `settings` tables (via Drizzle in `lib/db`). Connection built from `SUPABASE_DATABASE_URL` with password override from `SUPABASE_DB_PASSWORD` (fallback `DATABASE_URL`)
- Images live in Supabase Storage (public bucket `menu-images`, keys `uploads/<uuid>`); uploads use a signed-upload-URL flow and are served (proxied) via `/api/storage/objects/...` — this URL shape is stored in the DB and must stay stable
- Production hosting target is Railway (Dockerfile at repo root builds frontend + API into one service; `STATIC_DIR` enables static serving + SPA fallback; `admin.<domain>` redirects to `/admin`). See `DEPLOY.md` (Arabic guide)
- Client helpers keep snake_case field shapes (e.g. `name_ar`, `is_available`); the api-server maps to/from camelCase Drizzle columns
- Theme colors are stored in the `settings` table as key-value pairs and fetched at runtime — no CSS vars
- Admin auth is server-side: login posts the password to `/api/auth/login`, which verifies it against the `ADMIN_PASSWORD` secret (constant-time) and returns an HMAC-signed, 7-day token (signed with `SESSION_SECRET`). The client stores the token in sessionStorage (`admin_token`) and sends it as `Authorization: Bearer <token>`. All mutating endpoints require it; public GET endpoints stay open.
- Routing via wouter (matches scaffold convention) with BASE_URL prefix for proxy compatibility
- Dark-themed by default; theme fully customizable via admin "المظهر" tab with 6 presets + manual color pickers

## Product

- **Public menu** (`/`): Cover image, logo, social links (Instagram, TikTok, Maps, WhatsApp), category tabs with images/icons, list/grid view toggle, item detail modal, Arabic/English bilingual toggle
- **Admin panel** (`/admin`, server-side password via `ADMIN_PASSWORD` secret): Manage menu items (CRUD), categories (CRUD with image upload), theme colors (presets + custom), QR Code generator for sharing menu link

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Env vars: `SUPABASE_DATABASE_URL`, `SUPABASE_DB_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (+ `ADMIN_PASSWORD`, `SESSION_SECRET`). Old Replit `DATABASE_URL`/object-storage vars are legacy fallbacks only
- `SUPABASE_URL` secret may contain a path (e.g. `/rest/v1`) — code normalizes to origin; the `SUPABASE_DATABASE_URL` secret has a stale password, `SUPABASE_DB_PASSWORD` overrides it
- Theme is applied via inline styles on the MenuPage (not CSS variables) — fetched from the api-server on each load
- Admin auth: client stores the server-issued token in `sessionStorage` (`admin_token`) — clears on tab close; `apiFetch` and the upload flow both log out on a 401. Password is the `ADMIN_PASSWORD` secret (never in client code)
- Image uploads go through object storage; `deleteMenuImage` is intentionally a no-op (orphaned objects are negligible)
- In `api-server/src/routes/menu.ts`, the `/menu/items/sort-orders` route must be declared BEFORE `/menu/items/:id` or it gets shadowed

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `object-storage` and `database` skills for storage/Postgres setup details
