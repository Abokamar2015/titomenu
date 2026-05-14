# & Co. Coffee Shop Menu

A bilingual (Arabic/English) digital menu app for "& Co. Coffee Shop & Pop Up" with a public menu page and password-protected admin panel.

## Run & Operate

- `pnpm --filter @workspace/cafe-menu run dev` — run the menu app (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, framer-motion, sonner (toasts), wouter (routing)
- UI: shadcn/ui components (radix-ui primitives)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Client: @supabase/supabase-js

## Where things live

- `artifacts/cafe-menu/` — the React + Vite frontend app
  - `src/pages/MenuPage.tsx` — public bilingual menu (Arabic/English toggle)
  - `src/pages/AdminPage.tsx` — password-protected admin panel
  - `src/lib/supabase.ts` — Supabase client + all DB/storage helpers
  - `src/lib/motion.ts` — framer-motion spring presets
  - `src/lib/constants.ts` — admin password, route paths
  - `public/images/` — cover.jpg, LOGO.png, cropped category image
- `artifacts/api-server/` — Express API server (not used by menu app currently)

## Architecture decisions

- Supabase is the single source of truth: menu_items, categories, settings tables + menu-images storage bucket
- Theme colors are stored in Supabase `settings` table as key-value pairs and fetched at runtime — no CSS vars
- Admin password is client-side only (`andco2024`) — stored in constants.ts, checked against sessionStorage
- Routing via wouter (matches scaffold convention) with BASE_URL prefix for proxy compatibility
- Dark-themed by default; theme fully customizable via admin "المظهر" tab with 6 presets + manual color pickers

## Product

- **Public menu** (`/`): Cover image, logo, social links (Instagram, TikTok, Maps, WhatsApp), category tabs with images/icons, list/grid view toggle, item detail modal, Arabic/English bilingual toggle
- **Admin panel** (`/admin`, password: `andco2024`): Manage menu items (CRUD), categories (CRUD with image upload), theme colors (presets + custom), QR Code generator for sharing menu link

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Supabase env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set (already configured in shared env)
- Theme is applied via inline styles on the MenuPage (not CSS variables) — fetched from Supabase on each load
- Admin auth uses `sessionStorage` — clears on tab close
- Category images are stored in `menu-images` Supabase storage bucket with `cat_` prefix; item images use `item_` prefix

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase project: https://utzpdtgnugzqmqxcbcpv.supabase.co
