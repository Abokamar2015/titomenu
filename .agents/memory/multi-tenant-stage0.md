---
name: Multi-tenant Stage 0 constraints
description: Rules that keep the multi-tenant schema/API backward compatible with the old single-tenant prod deploy
---

- Live prod (Railway) may run older code against the SAME Supabase DB. Any schema change must be additive: `restaurant_id` columns keep a DB `DEFAULT 'a0000000-0000-4000-8000-000000000001'` (& Co.'s fixed uuid) so old inserts still work. Do not drop that default until prod runs tenant-aware code.
- **Why:** zero downtime for the live & Co. menu and printed QR codes during rollout.
- **How to apply:** legacy read-only `/api/menu/*` must keep serving the default restaurant (env `DEFAULT_RESTAURANT_SLUG`, fallback slug `and-co`); root `/` and `/print` frontend routes stay for the default tenant; other tenants use `/r/:slug`.
- Password hash format is `s2$<saltHex>$<scryptHex>` (N=16384, keylen 64) — any seed script must match `hashPassword` in the api-server auth lib.
- Migrations were applied via ad-hoc SQL (not drizzle push) to control PK changes; drizzle push may try to drop the restaurant_id DB defaults — avoid running it blindly against this DB.
