import { z } from "zod";
import { db } from "@/db";
import { docs, experts, type Doc, type Expert } from "@/db/schema";

// Shared core: the web UI (/api/ask) and the MCP server (/api/mcp) both call these.

export const COUNTRIES = ["BE", "NL", "DE"] as const;
export type Country = (typeof COUNTRIES)[number];

// Any OpenRouter model with structured_outputs support. Sonnet is faster for live demos.
const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-5";

const ModelAnswer = z.object({
  answer: z.string(),
  citations: z.array(z.object({ docId: z.number(), claim: z.string() })),
  conflicts: z.array(z.object({ docIds: z.array(z.number()), explanation: z.string() })),
  scopeWarnings: z.array(z.object({ docId: z.number(), issue: z.string() })),
  confidence: z.enum(["high", "medium", "low"]),
  confidenceReason: z.string(),
});

const SYSTEM = `You answer questions from payroll consultants using ONLY the provided knowledge sources.
Each source has an id, country, status, source type and last-reviewed date.
- Cite every factual claim with the docId it came from.
- Prefer sources with status "current" and recent review dates. Never present a "superseded" source as the answer.
- If two sources disagree on a fact, report it in conflicts and say in the answer which one you trust and why.
- If a source you considered is for a different country than the one asked about, report it in scopeWarnings.
- If the sources do not answer the question, say so and set confidence to low. Do not use outside knowledge.`;

// Deterministic, not model-judged: freshness is metadata, so compute it in code.
export type Freshness = "fresh" | "aging" | "stale" | "superseded";
function freshness(doc: Doc, now = new Date()): Freshness {
  if (doc.status === "superseded") return "superseded";
  const ageDays = (now.getTime() - new Date(doc.reviewedAt).getTime()) / 86_400_000;
  if (ageDays < 180) return "fresh";
  if (ageDays < 365) return "aging";
  return "stale";
}

function withTrust(doc: Doc, owners: Map<number, Expert>) {
  const { body, ...meta } = doc; // body stays server-side; the receipt only needs metadata
  void body;
  return { ...meta, freshness: freshness(doc), owner: doc.ownerId ? owners.get(doc.ownerId) : undefined };
}

export async function askWithTrust(question: string, country: Country) {
  // ponytail: whole corpus in the prompt, fine for ~15 docs. Add retrieval when the corpus outgrows the context.
  const [allDocs, allExperts] = await Promise.all([db.select().from(docs), db.select().from(experts)]);
  const docsById = new Map(allDocs.map((d) => [d.id, d]));
  const owners = new Map(allExperts.map((e) => [e.id, e]));

  const sources = allDocs
    .map((d) => `<source id="${d.id}" country="${d.country}" status="${d.status}" type="${d.sourceType}" reviewed="${d.reviewedAt}">\n${d.title}\n${d.body}\n</source>`)
    .join("\n");

  const out = await completeJson(
    ModelAnswer,
    SYSTEM,
    `<sources>\n${sources}\n</sources>\n\nCountry context: ${country}\nQuestion: ${question}`,
  );
  const trustedDoc = (id: number) => {
    const doc = docsById.get(id);
    return doc ? withTrust(doc, owners) : undefined; // drops ids the model invented
  };

  const citations = out.citations.flatMap((c) => {
    const doc = trustedDoc(c.docId);
    return doc ? [{ claim: c.claim, doc }] : [];
  });

  return {
    answer: out.answer,
    confidence: out.confidence,
    confidenceReason: out.confidenceReason,
    citations,
    conflicts: out.conflicts.map((c) => ({ explanation: c.explanation, docs: c.docIds.flatMap((id) => trustedDoc(id) ?? []) })),
    scopeWarnings: out.scopeWarnings.flatMap((w) => {
      const doc = trustedDoc(w.docId);
      return doc ? [{ issue: w.issue, doc }] : [];
    }),
    // Who to ask when the receipt isn't enough: owners of the cited sources.
    experts: [...new Map(citations.flatMap((c) => (c.doc.owner ? [[c.doc.owner.id, c.doc.owner]] : []))).values()],
  };
}

async function completeJson<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T>> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000, // a receipt is ~1k tokens; without a cap OpenRouter reserves the model max against credits
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "answer", strict: true, schema: z.toJSONSchema(schema) },
      },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter returned no content: ${JSON.stringify(data)}`);
  return schema.parse(JSON.parse(content));
}

export type TrustReceipt = Awaited<ReturnType<typeof askWithTrust>>;

export async function findExpert(topic: string, country?: Country) {
  // ponytail: substring match over a handful of rows. Swap for full-text search if the directory gets real.
  const needle = topic.toLowerCase();
  const all = await db.select().from(experts);
  return all.filter(
    (e) => (!country || e.country === country) && e.topics.some((t) => t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase())),
  );
}
