---
name: cafe-menu admin auth
description: How server-side admin auth works in the cafe-menu app and the constraints to keep when touching it.
---

# cafe-menu admin auth (server-side)

Admin auth lives in the api-server, not the client. Login posts the password to
`/api/auth/login`, which constant-time compares it against the `ADMIN_PASSWORD`
secret and returns an HMAC-signed, 7-day token (signed with `SESSION_SECRET`).
The client keeps the token in sessionStorage and sends `Authorization: Bearer <token>`.

**Rule:** every mutating endpoint must carry `requireAuth`; public GET endpoints
(menu items/categories/settings reads, object serving) must stay open so the
public menu works without a login.

**Why:** the user explicitly asked for protection ("اريد حماية"). The pre-auth
state let anyone hit the write endpoints directly even though the UI gated on a
client-side password constant — that was the one severe gap flagged in review.

**How to apply:**
- New write routes → add `requireAuth` and confirm with an unauthorized curl (expect 401).
- Any client call that hits a protected endpoint must handle 401 by calling
  `logout()` (clears the stale token). `apiFetch` does this centrally, but the
  image-upload flow uses a direct `fetch` for the presign request-url call and
  needs its own 401→logout handling — easy to miss if you add more direct fetches.
- No new npm deps: token is plain `crypto` HMAC, not a JWT library.
- Secret values are NOT readable from the code_execution sandbox (`viewEnvVars`
  returns booleans). To test the happy path, curl from bash using `$ADMIN_PASSWORD`
  with jq (never echo it), not the sandbox.
