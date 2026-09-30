// Fake knowledge base for the demo. All content is fictional — figures only look plausible.
// Run: bun run db:seed   (wipes and reloads both tables)
//
// Planted traps (the demo relies on these):
//   1. Conflict  — BE notice periods: SharePoint procedure v4 vs. old onboarding checklist.
//   2. Conflict  — BE end-of-year premium: current policy vs. 2024 Teams thread.
//   3. Stale     — BE meal voucher €6.91 doc, superseded by the €8.91 legal-feed update.
//   4. Scope     — NL holiday-allowance doc that reads like an answer to a BE "13th month" question.
import { sql } from "drizzle-orm";
import { db } from "./index";
import { docs, experts } from "./schema";
import { DOCS, EXPERTS } from "./seed-data";

await db.execute(sql`TRUNCATE ${docs}, ${experts} RESTART IDENTITY CASCADE`);
await db.insert(experts).values(EXPERTS);
await db.insert(docs).values(DOCS);
console.log(`Seeded ${EXPERTS.length} experts, ${DOCS.length} docs.`);
