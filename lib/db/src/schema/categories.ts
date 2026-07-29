import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const categoriesTable = pgTable(
  "categories",
  {
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    icon: text("icon").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    imageUrl: text("image_url"),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.key] })],
);

export const insertCategorySchema = createInsertSchema(categoriesTable);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
