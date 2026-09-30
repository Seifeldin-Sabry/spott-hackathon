// Writes the demo knowledge as files to upload into the M365 tenant, so the tenant carries the same traps.
// Run: bun run tenant:export  → tenant-content/
import { mkdirSync, writeFileSync } from "node:fs";
import { DOCS, EXPERTS } from "@/db/seed-data";

const OUT = "tenant-content";
const teams: string[] = [];

for (const doc of DOCS) {
  const owner = EXPERTS[doc.ownerId - 1].name;
  if (doc.sourceType === "teams") {
    teams.push(`## Channel: payroll-${doc.country.toLowerCase()} (post as ${owner})\n\n${doc.body}\n`);
    continue;
  }
  // Tickets and legal feeds have no M365 home; they go to SharePoint as regular docs.
  const dir = `${OUT}/sharepoint/${doc.country}${doc.status === "superseded" ? "/Archive" : ""}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${doc.title.replace(/[\\/:*?"<>|]/g, "-")}.md`, `${doc.body}\n`);
  console.log(`${dir}/…  upload as ${owner}, ReviewedOn = ${doc.reviewedAt}`);
}
writeFileSync(`${OUT}/teams-messages.md`, `# Paste these into Teams\n\n${teams.join("\n")}`);
