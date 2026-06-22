import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq, asc, sql } from "drizzle-orm";
import {
  db,
  menuItemsTable,
  categoriesTable,
  settingsTable,
  type MenuItem,
  type Category,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function paramStr(raw: string | string[]): string {
  return Array.isArray(raw) ? raw[0] : raw;
}

// ===== mappers (DB camelCase <-> API snake_case) =====
function itemToApi(row: MenuItem) {
  return {
    id: row.id,
    name_ar: row.nameAr,
    name_en: row.nameEn,
    description_ar: row.descriptionAr,
    description_en: row.descriptionEn,
    price: row.price,
    calories: row.calories,
    category: row.category,
    is_available: row.isAvailable,
    sort_order: row.sortOrder,
    image_url: row.imageUrl,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function catToApi(row: Category) {
  return {
    key: row.key,
    name_ar: row.nameAr,
    name_en: row.nameEn,
    icon: row.icon,
    sort_order: row.sortOrder,
    is_active: row.isActive,
    image_url: row.imageUrl,
  };
}

// ===== schemas =====
const itemInsert = z.object({
  name_ar: z.string(),
  name_en: z.string(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  price: z.number().int(),
  calories: z.number().int().nullable().optional(),
  category: z.string(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  image_url: z.string().nullable().optional(),
});
const itemUpdate = itemInsert.partial();

type ItemInsert = z.infer<typeof itemInsert>;
type ItemUpdate = z.infer<typeof itemUpdate>;

function itemToDb(b: ItemInsert | ItemUpdate) {
  const out: Record<string, unknown> = {};
  if (b.name_ar !== undefined) out.nameAr = b.name_ar;
  if (b.name_en !== undefined) out.nameEn = b.name_en;
  if (b.description_ar !== undefined) out.descriptionAr = b.description_ar;
  if (b.description_en !== undefined) out.descriptionEn = b.description_en;
  if (b.price !== undefined) out.price = b.price;
  if (b.calories !== undefined) out.calories = b.calories;
  if (b.category !== undefined) out.category = b.category;
  if (b.is_available !== undefined) out.isAvailable = b.is_available;
  if (b.sort_order !== undefined) out.sortOrder = b.sort_order;
  if (b.image_url !== undefined) out.imageUrl = b.image_url;
  return out;
}

const catInsert = z.object({
  key: z.string().min(1),
  name_ar: z.string(),
  name_en: z.string(),
  icon: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().nullable().optional(),
});
const catUpdate = catInsert.partial();

type CatInsert = z.infer<typeof catInsert>;
type CatUpdate = z.infer<typeof catUpdate>;

function catToDb(b: CatInsert | CatUpdate) {
  const out: Record<string, unknown> = {};
  if (b.key !== undefined) out.key = b.key;
  if (b.name_ar !== undefined) out.nameAr = b.name_ar;
  if (b.name_en !== undefined) out.nameEn = b.name_en;
  if (b.icon !== undefined) out.icon = b.icon;
  if (b.sort_order !== undefined) out.sortOrder = b.sort_order;
  if (b.is_active !== undefined) out.isActive = b.is_active;
  if (b.image_url !== undefined) out.imageUrl = b.image_url;
  return out;
}

// ===== MENU ITEMS =====
router.get("/menu/items", async (req, res): Promise<void> => {
  const onlyAvailable = req.query.available === "true";
  const rows = await db
    .select()
    .from(menuItemsTable)
    .orderBy(asc(menuItemsTable.category), asc(menuItemsTable.sortOrder));
  const filtered = onlyAvailable ? rows.filter((r) => r.isAvailable) : rows;
  res.json(filtered.map(itemToApi));
});

router.post("/menu/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = itemInsert.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(menuItemsTable)
    .values(itemToDb(parsed.data) as typeof menuItemsTable.$inferInsert)
    .returning();
  res.status(201).json(itemToApi(row));
});

router.patch("/menu/items/sort-orders", requireAuth, async (req, res): Promise<void> => {
  const schema = z.object({
    updates: z.array(
      z.object({ id: z.string(), sort_order: z.number().int() }),
    ),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await Promise.all(
    parsed.data.updates.map(({ id, sort_order }) =>
      db
        .update(menuItemsTable)
        .set({ sortOrder: sort_order })
        .where(eq(menuItemsTable.id, id)),
    ),
  );
  res.sendStatus(204);
});

router.patch("/menu/items/:id", requireAuth, async (req, res): Promise<void> => {
  const id = paramStr(req.params.id);
  const parsed = itemUpdate.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(menuItemsTable)
    .set(itemToDb(parsed.data))
    .where(eq(menuItemsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(itemToApi(row));
});

router.delete("/menu/items/:id", requireAuth, async (req, res): Promise<void> => {
  const id = paramStr(req.params.id);
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
  res.sendStatus(204);
});

// ===== CATEGORIES =====
router.get("/menu/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder));
  res.json(rows.map(catToApi));
});

router.post("/menu/categories", requireAuth, async (req, res): Promise<void> => {
  const parsed = catInsert.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(categoriesTable)
    .values(catToDb(parsed.data) as typeof categoriesTable.$inferInsert)
    .returning();
  res.status(201).json(catToApi(row));
});

router.patch("/menu/categories/:key", requireAuth, async (req, res): Promise<void> => {
  const key = paramStr(req.params.key);
  const parsed = catUpdate.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(categoriesTable)
    .set(catToDb(parsed.data))
    .where(eq(categoriesTable.key, key))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(catToApi(row));
});

router.delete("/menu/categories/:key", requireAuth, async (req, res): Promise<void> => {
  const key = paramStr(req.params.key);
  await db.delete(categoriesTable).where(eq(categoriesTable.key, key));
  res.sendStatus(204);
});

// ===== SETTINGS =====
router.get("/menu/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  res.json(rows.map((r) => ({ key: r.key, value: r.value })));
});

router.put("/menu/settings/:key", requireAuth, async (req, res): Promise<void> => {
  const key = paramStr(req.params.key);
  const parsed = z.object({ value: z.string() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key, value: parsed.data.value })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value: parsed.data.value },
    });
  res.sendStatus(204);
});

export default router;
