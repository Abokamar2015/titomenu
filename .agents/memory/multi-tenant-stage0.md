---
name: Multi-tenant Stage 0 constraints
description: Rules that keep the multi-tenant schema/API backward compatible with the old single-tenant prod deploy
---

- Live prod (Railway) may run older code against the SAME Supabase DB. Any schema change must be additive: `restaurant_id` columns keep a DB `DEFAULT 'a0000000-0000-4000-8000-000000000001'` (& Co.'s fixed uuid) so old inserts still work. Do not drop that default until prod runs tenant-aware code.
- **Why:** zero downtime for the live & Co. menu and printed QR codes during rollout.
- **How to apply:** legacy read-only `/api/menu/*` must keep serving the default restaurant (env `DEFAULT_RESTAURANT_SLUG`, fallback slug `and-co`); root `/` and `/print` frontend routes stay for the default tenant; other tenants use `/r/:slug`.
- Password hash format is `s2$<saltHex>$<scryptHex>` (N=16384, keylen 64) — any seed script must match `hashPassword` in the api-server auth lib.
- Migrations were applied via ad-hoc SQL (not drizzle push) to control PK changes; drizzle push may try to drop the restaurant_id DB defaults — avoid running it blindly against this DB.

## Stage 1 (platform dashboard) notes
- `/sa` frontend route = super admin dashboard; SA login rejects non-super-admins client-side, but all real authz is server-side (`requireUser` + `requireSuperAdmin`).
- Restaurant "settings" (logo_url, cover_url, contact_*) live in the per-restaurant key-value `settings` table — no schema change needed for new per-tenant config.
- `login()` in the frontend must clear ALL prior session keys before writing new ones (stale tenant context leaked across logins once).
- QR codes are generated locally with the `qrcode` npm package via `toDataURL` + `<img>` — do NOT use canvas refs inside Radix dialogs (ref timing leaves canvas blank) and do NOT use external QR image services.
- Known scale debt (fine pre-billing): `/sa/restaurants` has no pagination/server-side search.
- Dev+prod share the Supabase DB: e2e tests create `zz-*` slugged restaurants/users and MUST clean them up via SQL after.
