// Pulls the M365 tenant into Neon: Entra users → experts, SharePoint files + Teams threads → docs.
// Replaces all existing rows (seeded fakes included). Run: bun run sync
//
// Tenant conventions this relies on:
//   SharePoint: top-level folder per country (BE/, NL/, DE/). Files under an "Archive" folder = superseded.
//               Optional date column "ReviewedOn" overrides last-modified as the review date.
//   Teams:      channel name contains the country code, e.g. "payroll-be".
import mammoth from "mammoth";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { docs, experts } from "@/db/schema";
import { COUNTRIES, type Country } from "@/lib/ask";
import { graph, graphAll, graphFetch } from "./graph";

type NewDoc = typeof docs.$inferInsert;
type DriveItem = {
  id: string; name: string; webUrl: string; lastModifiedDateTime: string;
  file?: object; folder?: object; createdBy?: { user?: { id?: string } };
};

function countryIn(name: string): Country | undefined {
  const tokens = name.toUpperCase().split(/[^A-Z]+/);
  return COUNTRIES.find((c) => tokens.includes(c));
}

const toDate = (iso: string) => iso.slice(0, 10);
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

async function fileText(driveId: string, item: DriveItem): Promise<string | undefined> {
  const ext = item.name.split(".").pop()?.toLowerCase();
  if (!["md", "txt", "docx"].includes(ext ?? "")) return undefined;
  const res = await graphFetch(`/drives/${driveId}/items/${item.id}/content`);
  if (ext !== "docx") return res.text();
  return (await mammoth.extractRawText({ buffer: Buffer.from(await res.arrayBuffer()) })).value;
}

async function syncSharePoint(): Promise<(NewDoc & { ownerExternalId?: string })[]> {
  const site = await graph(`/sites/${process.env.SHAREPOINT_SITE}`); // e.g. contoso.sharepoint.com:/sites/Knowledge
  const drive = await graph(`/sites/${site.id}/drive`);
  const out: (NewDoc & { ownerExternalId?: string })[] = [];

  async function walk(itemId: string, path: string[]) {
    for (const item of await graphAll<DriveItem>(`/drives/${drive.id}/items/${itemId}/children`)) {
      if (item.folder) { await walk(item.id, [...path, item.name]); continue; }
      const country = countryIn(path[0] ?? "");
      if (!country) { console.warn(`skip (no country folder): ${[...path, item.name].join("/")}`); continue; }
      const body = await fileText(drive.id, item);
      if (!body) { console.warn(`skip (unsupported type): ${item.name}`); continue; }
      const fields = await graph(`/drives/${drive.id}/items/${item.id}/listItem/fields`);
      out.push({
        title: item.name.replace(/\.[^.]+$/, ""),
        body,
        sourceType: "sharepoint",
        sourceUrl: item.webUrl,
        country,
        status: path.some((p) => p.toLowerCase() === "archive") ? "superseded" : "current",
        reviewedAt: toDate(fields.ReviewedOn ?? item.lastModifiedDateTime),
        ownerExternalId: item.createdBy?.user?.id, // uploader; editing ReviewedOn must not change the owner
      });
    }
  }
  await walk("root", []);
  return out;
}

async function syncTeams(): Promise<(NewDoc & { ownerExternalId?: string })[]> {
  const out: (NewDoc & { ownerExternalId?: string })[] = [];
  const teams = await graphAll("/me/joinedTeams");
  console.log(`teams: member of ${teams.length} team(s)`);
  for (const team of teams) {
    for (const channel of await graphAll(`/teams/${team.id}/channels`)) {
      const country = countryIn(channel.displayName);
      if (!country) { console.log(`teams: skip ${team.displayName} / ${channel.displayName} (no country in name)`); continue; }
      const threads = await graphAll(`/teams/${team.id}/channels/${channel.id}/messages?$top=50&$expand=replies`);
      console.log(`teams: ${team.displayName} / ${channel.displayName} → ${threads.length} messages (${country})`);
      for (const root of threads.filter((m) => m.messageType === "message" && !m.deletedDateTime)) {
        const thread = [root, ...(root.replies ?? [])].filter((m) => !m.deletedDateTime);
        const last = thread.at(-1);
        const text = thread.map((m) => `${m.from?.user?.displayName ?? "unknown"}: ${stripHtml(m.body.content)}`).join("\n");
        out.push({
          title: `Teams #${channel.displayName}: ${root.subject || stripHtml(root.body.content).slice(0, 80)}`,
          body: text,
          sourceType: "teams",
          sourceUrl: root.webUrl,
          country,
          status: "current",
          reviewedAt: toDate(last.lastModifiedDateTime),
          ownerExternalId: last.from?.user?.id, // whoever answered last holds the knowledge
        });
      }
    }
  }
  return out;
}

const users = await graphAll("/users?$select=id,displayName,jobTitle,department,usageLocation,mail,userPrincipalName&$top=999");
const [spDocs, teamsDocs] = [await syncSharePoint(), await syncTeams()];
const allDocs = [...spDocs, ...teamsDocs];

// Expertise = directory profile + what people actually wrote or answered.
const ownedTitles = (userId: string) => allDocs.filter((d) => d.ownerExternalId === userId).map((d) => d.title);

await db.execute(sql`TRUNCATE ${docs}, ${experts} RESTART IDENTITY CASCADE`);
const insertedExperts = await db
  .insert(experts)
  .values(
    users.map((u) => ({
      externalId: u.id,
      name: u.displayName,
      role: u.jobTitle ?? "",
      country: u.usageLocation ?? "", // ISO code, e.g. BE
      topics: [u.department, u.jobTitle, ...ownedTitles(u.id)].filter(Boolean),
      email: u.mail ?? u.userPrincipalName,
    })),
  )
  .returning({ id: experts.id, externalId: experts.externalId });
const expertIdByExternal = new Map(insertedExperts.map((e) => [e.externalId, e.id]));

if (allDocs.length) {
  await db.insert(docs).values(allDocs.map(({ ownerExternalId, ...d }) => ({ ...d, ownerId: expertIdByExternal.get(ownerExternalId ?? "") ?? null })));
}
console.log(`Synced ${users.length} people, ${spDocs.length} SharePoint files, ${teamsDocs.length} Teams threads.`);
