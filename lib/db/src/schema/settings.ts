import { pgTable, uuid, text, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const settingsTable = pgTable(
  "settings",
  {
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.key] })],
);

export const insertSettingSchema = createInsertSchema(settingsTable);
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settingsTable.$inferSelect;
