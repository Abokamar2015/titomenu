import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * Resolve the Postgres connection string.
 * Priority:
 * 1. SUPABASE_DATABASE_URL (with password override from SUPABASE_DB_PASSWORD if set)
 * 2. DATABASE_URL (legacy / local fallback)
 */
export function resolveDatabaseUrl(): string {
  const supaUrl = process.env.SUPABASE_DATABASE_URL?.trim();
  const supaPw = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (supaUrl) {
    if (supaPw) {
      const u = new URL(supaUrl);
      u.password = encodeURIComponent(supaPw);
      return u.toString();
    }
    return supaUrl;
  }
  const fallback = process.env.DATABASE_URL;
  if (fallback) return fallback;
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

const connectionString = resolveDatabaseUrl();
const isSupabase = /supabase\.(co|com)/.test(new URL(connectionString).hostname);

export const pool = new Pool({
  connectionString,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
