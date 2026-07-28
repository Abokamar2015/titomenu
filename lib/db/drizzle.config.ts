import { defineConfig } from "drizzle-kit";
import path from "path";

function resolveDatabaseUrl(): string {
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
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  },
});
