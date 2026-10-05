# Build plan: hackathon day

Goal for the day: make the three things that set us apart from the other "trust receipt" teams **visible on stage**. Each must work live in under 20 seconds.

1. Answers that know **when** a rule applies.
2. Quotes that are **checked** against the source.
3. **Proof** that the traps pass every time.

Everything else (permissions, EU hosting, retrieval at scale, Teams webhooks) goes on a slide, not into code.

Time budget: about 4 hours for the must-haves (P0), about 2 hours for the nice-to-haves (P1).

| # | What | Time | Priority | Shows on stage as |
|---|------|------|----------|-------------------|
| 1 | Effective dates + reference-date picker + indexation trap | 90 min | P0 | Flip May → June, the answer changes |
| 2 | Verified quotes | 60 min | P0 | ✓ "Quote found in source" under every claim |
| 3 | Trap check script | 45 min | P0 | "5 traps × 3 runs: 15/15" slide |
| 4 | Pre-pitch run-through | 30 min | P0 | Nothing breaks |
| 5 | Owner verification card (mock) | 45 min | P1 | Click "Still correct", the receipt turns green |
| 6 | MCP tool annotations + `asOf` | 15 min | P1 | Claude shows the tool as read-only |
| 7 | Try Sonnet 5.5 | 20 min | P1 | Faster answers, if the traps still pass |

Order matters for prod: **run `bun run db:push` against the production database before you deploy code that reads new columns**. Drizzle's `select()` selects every column in the schema, so a missing column breaks every answer.

---

## 1. Effective dates and the reference date (P0, 90 min)

**Why:** a payroll rule has an *effective* date, separate from when someone last reviewed the doc. Today a law published in December for January reads as "fresh" and gets applied too early. Belgium's real indexation reform took effect on **1 June 2026** ([DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/belgium-introduces-major-reforms-to-automatic-wage-indexation)), which gives us the perfect live demo.

### `src/db/schema.ts`
Add two nullable columns to `docs` (null = open-ended):
```ts
effectiveFrom: date("effective_from"),
effectiveTo: date("effective_to"),
```
Run `bun run db:push`. Both columns are nullable, so there is no destructive prompt.

### `src/db/seed-data.ts`
- `Benefits guide: Meal vouchers (BE) 2023` → `effectiveTo: "2025-12-31"`
- `Legal update: Meal voucher ceiling raised (BE)` → `effectiveFrom: "2026-01-01"`
- `Legal update: Automatic wage indexation PC 200, January 2026` → `effectiveFrom: "2026-01-01"`
- **Add trap #5, two docs.** The procedure is right before 1 June and wrong after:
```ts
{
  title: "Procedure: Applying the index to PC 200 salaries (BE)",
  body: "Apply the full PC 200 index percentage to the entire gross monthly salary, with no ceiling. Example: a €5,000 salary indexed by 2.21% becomes €5,110.50. Run the indexation before the January payroll.",
  sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-be/pc200-indexation-procedure",
  country: "BE", status: "current", ownerId: 1, reviewedAt: "2026-02-10",
},
{
  title: "Legal update: Indexation reform (BE), from 1 June 2026",
  body: "From 2026-06-01 automatic wage indexation is moderated for all joint committees, PC 200 included. Only the first €4,000 of gross monthly salary is indexed, and that part by at most 2%. The part above €4,000 is not indexed during the moderation period. A second moderation period starts 2028-01-01. Employers owe a new compensating social security contribution. Update indexation procedures before the first index after 1 June.",
  sourceType: "legal_feed", sourceUrl: "https://legalfeed.example.com/be/2026-06-indexation-reform",
  country: "BE", status: "current", ownerId: 2, reviewedAt: "2026-06-15", effectiveFrom: "2026-06-01",
},
```
Add the trap to the comment in `src/db/seed.ts`. Then run `bun run db:seed` and `bun run tenant:export`.

### `src/lib/ask.ts`
- **Signature:** `askWithTrust(question, country, asOf = today())`, where `asOf` is a `YYYY-MM-DD` string.
- **Validity in code**, next to `freshness()`:
```ts
export type Validity = "in_force" | "not_yet" | "expired" | "open";
function validity(doc: Doc, asOf: string): Validity {
  if (!doc.effectiveFrom && !doc.effectiveTo) return "open";
  if (doc.effectiveFrom && asOf < doc.effectiveFrom) return "not_yet";
  if (doc.effectiveTo && asOf > doc.effectiveTo) return "expired";
  return "in_force";
}
```
  ISO date strings compare correctly as strings.
- **Source tag:** add `effective_from`, `effective_to` and `validity` attributes, and put `Reference date: ${asOf}` next to `Country context`.
- **`SYSTEM` prompt, new rules:**
  - "Answer for the reference date. Never present a rule that is not yet in force or has expired on that date as the answer."
  - "If a rule changes within 90 days after the reference date, say so as an upcoming change."
  - "If an internal procedure contradicts a legal update in force on the reference date, report it in conflicts; the legal update wins."
- **`withTrust`:** add `validity: validity(doc, asOf)`, and return `asOf` on the receipt.

### `src/app/api/ask/route.ts`
Add to `Body`: `asOf: z.iso.date().optional()`, and pass it through. Check the Zod v4 docs for the exact date helper; `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` also works.

### `src/components/landing/live-demo.tsx`
- Add a **"Reference date"** `<input type="date">` under the country switch, defaulting to today. Send it with the request.
- In `SourceLine`, show validity next to freshness:
  - "In force since 2026-06-01" (green)
  - "Not yet in force (from …)" (amber)
  - "Expired …" (red)
- Add a suggestion: `{ signal: "New law", question: "How do I index a €5,000 PC 200 salary?" }`.

**Done when** the same question gives:
- with 2026-05-15: full indexation, plus an "upcoming change on 1 June" note;
- with 2026-06-15: the reform applies, and the conflict with the internal procedure is flagged.

---

## 2. Verified quotes (P0, 60 min)

**Why:** the Stanford study of legal AI found the typical failure is a *real* citation that doesn't support the claim ([Stanford HAI](https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-or-more-benchmarking-queries)). Today we only check that the `docId` exists.

**Why not Claude's Citations API today:** it can't be combined with structured outputs; the API returns a 400 ([docs](https://platform.claude.com/docs/en/build-with-claude/citations), "Feature compatibility"). Adopting it means splitting the call in two, which is not a one-day change. Checking the quotes ourselves gets most of the value now. Put the Citations API on the roadmap slide.

### `src/lib/ask.ts`
- Citation schema: `z.object({ docId: z.number(), claim: z.string(), quote: z.string() })`.
- Prompt: "For every citation, `quote` is one sentence copied **verbatim** from that source's body."
- Check the quote in code:
```ts
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[“”"]/g, '"').trim();
const verified = norm(doc.body).includes(norm(quote));
```
- Each citation becomes `{ claim, quote, verified, doc }`.
- **Confidence:** if any quote is unverified, cap confidence at `medium` and append "One quote could not be found in its source." to `confidenceReason`. That is the first trust signal computed in code rather than by the model, so say so on stage.

### `live-demo.tsx`
Under each claim, show the quote in a muted block. Show **✓ Quote found in source** in green, or **⚠ Quote not found** in amber.

**Done when** every trap answer shows ✓ on every citation. If an answer shows ⚠, tighten the prompt, not the check.

---

## 3. Trap check script (P0, 45 min)

**Why:** the commit history says "keep only the two traps that pass reliably". The jury will ask "how do you know it stays right?" One slide with 15/15 answers that question.

### `src/eval/traps.ts` + `"eval": "bun src/eval/traps.ts"` in `package.json`

Match on **titles**, not ids, because ids change on every seed.

```ts
const CASES = [
  { trap: "Conflict",      q: "What's the notice period for 2.5 years of seniority?", country: "BE",
    mustCite: ["Procedure: Calculating notice periods"], conflictWith: ["Onboarding checklist"] },
  { trap: "Conflict",      q: "Does a March joiner get the end-of-year premium this year?", country: "BE",
    mustCite: ["Policy: End-of-year premium"], conflictWith: ["Teams #payroll-be"] },
  { trap: "Superseded",    q: "What's the max employer meal voucher contribution?", country: "BE",
    mustCite: ["Meal voucher ceiling raised"], mustNotCite: ["Benefits guide: Meal vouchers (BE) 2023"] },
  { trap: "Wrong country", q: "Is a 13th month mandatory?", country: "BE",
    mustNotCite: ["(NL)"], scopeWarning: ["(NL)"] },
  { trap: "New law",       q: "How do I index a €5,000 PC 200 salary?", country: "BE", asOf: "2026-06-15",
    mustCite: ["Indexation reform"], conflictWith: ["Procedure: Applying the index"] },
];
```

- Run each case 3 times, in parallel per case.
- Print one line per run: trap, pass/fail, the reason, seconds, and the share of verified quotes.
- Exit 1 if anything fails.
- Take a screenshot of the passing output for the deck.

---

## 4. Pre-pitch run-through (P0, 30 min)

- [ ] `bun run lint` and `bunx tsc --noEmit` are clean.
- [ ] `bun run db:push` on the production DB, **then** deploy, then `bun run db:seed`.
- [ ] `bun run eval` passes 15/15 against production settings.
- [ ] Ask every demo question once on the live URL (this warms caches and catches surprises).
- [ ] Record a screen video of the full demo as a backup.
- [ ] Freeze: no deploys after the final run-through.

---

## 5. Owner verification card, mocked (P1, 45 min)

**Why:** it turns "a chatbot" into "it repairs the knowledge base", which is what knowledge managers buy.

- **Where:** a new `src/components/landing/owner-card.tsx` on the landing page, below the live demo. Client state only; no Teams bot today.
- **The card is styled like a Teams Adaptive Card:** "An Peeters, your doc *Procedure: Applying the index to PC 200 salaries* conflicts with *Indexation reform, from 1 June 2026*. Cited 14 times this week."
- **Buttons:** **Still correct** · **Update needed** · **Not mine**.
- **On click:** show a mini receipt line flipping from amber "Conflict" to green "Owner verified today", with the text "ReviewedOn written back to SharePoint" underneath.
- **Label it "Preview" on screen.** Honesty earns points.

## 6. MCP polish (P1, 15 min)

In `src/app/api/mcp/route.ts`:
- Add `annotations: { readOnlyHint: true }` to both tools. The installed `@modelcontextprotocol/server` accepts `annotations` in `registerTool`.
- Add `asOf: z.string().optional()` to `ask_with_trust`.

## 7. Try Sonnet 5.5 (P1, 20 min)

Sonnet 5 is now listed as legacy; Sonnet 5.5 has the same price ($2 / $10 per million tokens) ([Models overview](https://platform.claude.com/docs/en/models/overview)). Find its slug on openrouter.ai/models and set `OPENROUTER_MODEL`. Run `bun run eval`, and switch **only if 15/15 pass and it is faster**.

---

## Not building today (say it on the roadmap slide)

| Item | One-line answer when asked |
|------|----------------------------|
| Permission trimming | Each passage stores its SharePoint/Teams groups; filtered by the asker's Entra groups before the model sees anything |
| EU hosting | Neon Frankfurt, Vercel `fra1`, Claude via Bedrock or Vertex EU (Anthropic's own API offers only US or global) |
| Retrieval at scale | Under ~200k tokens the whole corpus fits in the prompt (Anthropic's guidance); above that, hybrid search + rerank |
| Native Citations API | Needs the answer and the receipt split into two calls; on the roadmap |
| Live sync | Graph delta queries + change notifications instead of full reloads |
| Copilot / Teams | The same MCP server plugs into Microsoft 365 Copilot agents; owner cards become real Teams Adaptive Cards |
