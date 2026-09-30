import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Placeholder table. Rename/replace once the idea is locked.
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
