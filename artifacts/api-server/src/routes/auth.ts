import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod/v4";
import { createToken, verifyPassword, requireAuth } from "../lib/auth";

const router: IRouter = Router();

const LoginBody = z.object({ password: z.string() });

/** POST /auth/login — exchange the admin password for a signed token. */
router.post("/auth/login", (req: Request, res: Response): void => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  if (!verifyPassword(parsed.data.password)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ token: createToken() });
});

/** GET /auth/verify — confirm the caller holds a valid token. */
router.get("/auth/verify", requireAuth, (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

export default router;
