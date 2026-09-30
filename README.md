# trust.receipt

**Every answer comes with a receipt.** A hackathon proof of concept for the SD Worx knowledge challenge: ask a payroll question and get an answer plus a *trust receipt*. The receipt shows:

- **Sources**: every claim links to the SharePoint file or Teams thread it came from.
- **Freshness**: fresh / aging / stale / superseded, computed from review dates in code (not guessed by the model).
- **Conflicts**: when sources disagree, both are shown with which one wins and why.
- **Context check**: flags sources from a different country than the one asked about.
- **Expert**: the owner of the knowledge, to contact when the receipt isn't enough.

The same engine is exposed through a web page and an **MCP server**, so Claude (or any MCP client) returns answers with the same receipt.

## How it works

```
SharePoint files ─┐
Teams threads ────┼─ bun run sync (Microsoft Graph) ─► Neon Postgres ─► askWithTrust() ─┬─► web page  (/api/ask)
People directory ─┘                                  (docs, experts)    (OpenRouter LLM) └─► MCP server (/api/mcp)
```

| Path | What |
|---|---|
| `src/lib/ask.ts` | Core: `askWithTrust` (LLM with structured output, then trust metadata) and `findExpert` |
| `src/app/api/ask` · `src/app/api/mcp` | Web API · MCP tools `ask_with_trust`, `find_expert` |
| `src/app/page.tsx`, `src/components/landing/` | Landing page with a live demo |
| `src/sync/` | Microsoft Graph sync (device-code sign-in, delegated permissions) |
| `src/db/seed-data.ts` | Fictional demo knowledge with 4 planted traps (conflicts, outdated doc, wrong country) |
| `tenant-content/` | The same demo knowledge as files, for uploading to a Microsoft 365 tenant |

## Run it

Requires [Bun](https://bun.sh), a Neon (Postgres) database and an [OpenRouter](https://openrouter.ai) key.

```bash
bun install
cp .env.example .env.local   # fill in DATABASE_URL, OPENROUTER_API_KEY
bun run db:push              # create tables
bun run db:seed              # load demo data with the planted traps
bun dev                      # http://localhost:3000
```

Try the trap questions in the live demo section (country: Belgium).

**Model.** Set with `OPENROUTER_MODEL`; the default is `anthropic/claude-opus-5`. `anthropic/claude-sonnet-5` is recommended for demos: it caught all four traps. The free `nvidia/nemotron-3-super-120b-a12b:free` works but misses some conflicts and wrong-country warnings.

**Connect Claude Code to the MCP server:**
```bash
claude mcp add --transport http trust-receipt http://localhost:3000/api/mcp
```

### Sync from Microsoft 365 (optional)

1. **Register an app in Entra.** Single tenant, no redirect URI, *Allow public client flows* = Yes. Add these Graph *delegated* permissions and grant admin consent: `User.Read.All`, `Sites.Read.All`, `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Read.All`.
2. **Add to `.env.local`:** `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `SHAREPOINT_SITE` (e.g. `contoso.sharepoint.com:/sites/Knowledge`).
3. **Tenant conventions:**
   - SharePoint: top-level folders `BE/`, `NL/`, `DE/` in the site's Documents library. Anything under `Archive/` counts as superseded. An optional `ReviewedOn` date column sets the review date. The uploader is the owner.
   - Teams: channel names contain the country code (`payroll-be`). The last replier in a thread is its owner.
4. **Run `bun run sync`** and sign in with the printed code. This **replaces** all data in the database; `bun run db:seed` restores the demo data.

`bun run tenant:export` regenerates `tenant-content/` from the seed data.

## Unfinished / known limits

- **Vercel deploy is failing.** Both production builds show as failed. Not yet diagnosed; start by checking that `DATABASE_URL` and `OPENROUTER_API_KEY` are set in the Vercel project.
- **Teams threads don't sync yet in the demo tenant.** The syncing account is a member of 0 teams. Add it to the team and to the private `payroll-be` channel, then re-sync.
- **Entra users have no job titles**, so expert cards show only the country.
- **The hero chat is a scripted replay.** The live demo section is the real thing.
- **No retrieval.** The whole corpus goes into each prompt. Fine for ~15 docs; add search before scaling.
- **The sync is a full reload**, not incremental. PDFs are skipped (only `.md`, `.txt`, `.docx`).
- **No auth.** It's a public demo by design.
- **An unused `items` starter table** remains in the schema, to avoid a destructive migration prompt. Safe to drop.
- **All demo content is fictional.** Figures only look plausible.
