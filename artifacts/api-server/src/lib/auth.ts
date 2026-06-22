import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import type { Request, Response, NextFunction } from "express";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET environment variable is required");
  return s;
}

function getAdminPassword(): string {
  const p = process.env["ADMIN_PASSWORD"];
  if (!p) throw new Error("ADMIN_PASSWORD environment variable is required");
  return p;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Issue a signed, time-limited admin token (a minimal HMAC-signed JWT-like token). */
export function createToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS, n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify a token's signature and expiry. */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof data.exp === "number" && Date.now() <= data.exp;
  } catch {
    return false;
  }
}

/** Constant-time comparison of the supplied password against the configured admin password. */
export function verifyPassword(input: string): boolean {
  return safeEqual(input, getAdminPassword());
}

/** Express middleware that rejects requests without a valid admin token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
