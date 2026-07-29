import { pgTable, uuid, text, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { restaurantsTable } from "./restaurants";

export const ROLES = ["owner", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const membershipsTable = pgTable(
  "memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    role: text("role", { enum: ROLES }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.restaurantId] })],
);

export type Membership = typeof membershipsTable.$inferSelect;
