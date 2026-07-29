import { Router, type IRouter, type Response } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  membershipsTable,
  restaurantsTable,
} from "@workspace/db";
import {
  createToken,
  verifyPasswordHash,
  hashPassword,
  requireUser,
  type AuthedRequest,
} from "../lib/auth";

const router: IRouter = Router();

const LoginBody = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

async function getMembershipsPayload(userId: string) {
  const rows = await db
    .select({
      restaurantId: membershipsTable.restaurantId,
      role: membershipsTable.role,
      slug: restaurantsTable.slug,
      nameAr: restaurantsTable.nameAr,
      nameEn: restaurantsTable.nameEn,
      isActive: restaurantsTable.isActive,
    })
    .from(membershipsTable)
    .innerJoin(
      restaurantsTable,
      eq(membershipsTable.restaurantId, restaurantsTable.id),
    )
    .where(eq(membershipsTable.userId, userId));
  return rows.map((r) => ({
    restaurant_id: r.restaurantId,
    role: r.role,
    slug: r.slug,
    name_ar: r.nameAr,
    name_en: r.nameEn,
    is_active: r.isActive,
  }));
}

function userToApi(u: {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    is_super_admin: u.isSuperAdmin,
  };
}

/** POST /auth/login — email + password -> token + user + memberships. */
router.post("/auth/login", async (req, res: Response): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (!user || !verifyPasswordHash(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json({
    token: createToken(user.id),
    user: userToApi(user),
    memberships: await getMembershipsPayload(user.id),
  });
});

/** GET /auth/me — current user + memberships. */
router.get(
  "/auth/me",
  requireUser,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const user = req.user!;
    res.json({
      user: userToApi(user),
      memberships: await getMembershipsPayload(user.id),
    });
  },
);

/** POST /auth/change-password */
router.post(
  "/auth/change-password",
  requireUser,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const parsed = z
      .object({
        current_password: z.string().min(1),
        new_password: z.string().min(8),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
      return;
    }
    const user = req.user!;
    if (!verifyPasswordHash(parsed.data.current_password, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(parsed.data.new_password) })
      .where(eq(usersTable.id, user.id));
    res.sendStatus(204);
  },
);

/** GET /auth/verify — kept for backward compatibility. */
router.get(
  "/auth/verify",
  requireUser,
  (_req: AuthedRequest, res: Response): void => {
    res.json({ ok: true });
  },
);

export default router;
