import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Empty starter table still in Neon. Delete this + run `bun run db:push` (choose drop) when convenient.
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stands in for the HR directory (Entra ID / Workday).
export const experts = pgTable("experts", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(), // Entra user id; null for seeded fakes
  name: text("name").notNull(),
  role: text("role").notNull(),
  country: text("country").notNull(), // BE | NL | DE
  topics: text("topics").array().notNull(),
  email: text("email").notNull(),
});

// One table for every knowledge source; sourceType says where it "came from".
export const docs = pgTable("docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sourceType: text("source_type").notNull(), // sharepoint | teams | ticket | legal_feed
  sourceUrl: text("source_url").notNull(),
  country: text("country").notNull(), // BE | NL | DE
  status: text("status").notNull(), // current | superseded
  ownerId: integer("owner_id").references(() => experts.id),
  reviewedAt: date("reviewed_at").notNull(),
});

export type Doc = typeof docs.$inferSelect;
export type Expert = typeof experts.$inferSelect;
