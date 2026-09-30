"use client";

import { ArrowRight, CircleCheck, FileText, Globe, ReceiptText, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Country, Freshness, TrustReceipt } from "@/lib/ask";

const COUNTRIES: { code: Country; label: string }[] = [
  { code: "BE", label: "Belgium" },
  { code: "NL", label: "Netherlands" },
  { code: "DE", label: "Germany" },
];

// Each one trips a different trust signal in the demo data.
const SUGGESTIONS = [
  { signal: "Conflict", question: "What's the notice period for 2.5 years of seniority?" },
  { signal: "Outdated", question: "What's the max employer meal voucher contribution?" },
];

const LOADING_STEPS = ["Reading SharePoint…", "Scanning Teams threads…", "Checking review dates…", "Comparing sources…", "Writing the receipt…"];

const FRESHNESS: Record<Freshness, { dot: string; label: string }> = {
  fresh: { dot: "bg-brand", label: "Fresh" },
  aging: { dot: "bg-yellow-400", label: "Aging" },
  stale: { dot: "bg-amber-500", label: "Stale" },
  superseded: { dot: "bg-red-500", label: "Superseded" },
};

type SourceDoc = TrustReceipt["citations"][number]["doc"];

export function LiveDemo() {
  const [question, setQuestion] = useState("");
  const [country, setCountry] = useState<Country>("BE");
  const [receipt, setReceipt] = useState<TrustReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (q.trim().length < 3 || loading) return;
    setQuestion(q);
    setLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const res = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question: q, country }) });
      const data = await res.json();
      if (res.ok) setReceipt(data);
      else setError(data.error ?? "Something went wrong");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      {/* Ask panel */}
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">Context</p>
          <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCountry(c.code)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                  c.code === country ? "bg-white text-ink shadow-sm" : "text-neutral-500 hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">Question</p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
            rows={3}
            placeholder="Ask a payroll question…"
            className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-[15px] transition-shadow outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-neutral-800 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? "Checking sources…" : "Get answer + receipt →"}
          </button>
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">Try a trap question</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.question}
                type="button"
                onClick={() => {
                  setCountry("BE");
                  ask(s.question);
                }}
                disabled={loading}
                className="group flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-left text-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
              >
                <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-500">{s.signal}</span>
                <span className="text-neutral-700">{s.question}</span>
                <span className="ml-auto text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipt panel */}
      <div className="min-h-[520px] rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6">
        {loading && <LoadingReceipt />}
        {error && !loading && <p className="animate-fade-up rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && !receipt && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <ReceiptText className="mx-auto size-10 text-neutral-300" strokeWidth={1.5} />
              <p className="mt-3 font-semibold text-ink">Your receipt prints here</p>
              <p className="mt-1 text-sm text-neutral-500">Pick a trap question to see trust signals in action.</p>
            </div>
          </div>
        )}
        {receipt && !loading && <Receipt receipt={receipt} />}
      </div>
    </div>
  );
}

function LoadingReceipt() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((n) => Math.min(n + 1, LOADING_STEPS.length - 1)), 1100);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex h-full flex-col gap-3">
      <p key={i} className="animate-slide-in flex items-center gap-2 text-sm font-medium text-neutral-600">
        <span className="animate-pulse-ring size-2 rounded-full bg-brand" />
        {LOADING_STEPS[i]}
      </p>
      {[90, 75, 82, 60].map((w, n) => (
        <div key={n} className="h-3 animate-pulse rounded bg-neutral-200" style={{ width: `${w}%`, animationDelay: `${n * 120}ms` }} />
      ))}
    </div>
  );
}

const CONFIDENCE = {
  high: { icon: CircleCheck, label: "High confidence", style: "bg-brand/10 text-brand-dark" },
  medium: { icon: TriangleAlert, label: "Medium confidence", style: "bg-amber-100 text-amber-800" },
  low: { icon: TriangleAlert, label: "Low confidence", style: "bg-red-100 text-red-700" },
};

const SOURCE_LABEL: Record<string, string> = { sharepoint: "SharePoint", teams: "Teams", ticket: "Ticket", legal_feed: "Legal feed" };

export function Receipt({ receipt }: { receipt: TrustReceipt }) {
  // Staggered entrance: answer, receipt, then each section's rows in reading order.
  const stagger = (order: number) => ({ animationDelay: `${order * 90}ms` });
  // One entry per source document, with every claim it backs.
  const byDoc = new Map<number, { doc: SourceDoc; claims: string[] }>();
  for (const c of receipt.citations) {
    const entry = byDoc.get(c.doc.id) ?? { doc: c.doc, claims: [] };
    entry.claims.push(c.claim);
    byDoc.set(c.doc.id, entry);
  }
  const sources = [...byDoc.values()];
  const conflictsAt = 2 + sources.length;
  const scopeAt = conflictsAt + receipt.conflicts.length;
  const expertsAt = scopeAt + receipt.scopeWarnings.length;
  const confidence = CONFIDENCE[receipt.confidence];

  return (
    <div className="flex flex-col gap-4">
      {/* The answer */}
      <div className="animate-fade-up rounded-xl border border-neutral-200 bg-white p-5" style={stagger(0)}>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${confidence.style}`}>
          <confidence.icon className="size-3.5" strokeWidth={2.5} />
          {confidence.label}
        </span>
        <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap text-ink">{receipt.answer}</p>
        <p className="mt-3 border-t border-neutral-100 pt-3 text-[13px] leading-relaxed text-neutral-500">{receipt.confidenceReason}</p>
      </div>

      {/* The receipt */}
      <div className="animate-print receipt-edge rounded-t-xl border border-b-0 border-neutral-200 bg-white px-5 pt-5 pb-7" style={stagger(1)}>
        <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-neutral-400">
          <span className="flex items-center gap-1.5 font-semibold"><ReceiptText className="size-3.5" /> TRUST RECEIPT</span>
          <span>{sources.length} {sources.length === 1 ? "SOURCE" : "SOURCES"}</span>
        </div>
        <Divider />

        <Section icon={FileText} title="Sources">
          {sources.map((source, n) => (
            <div key={source.doc.id} className="animate-fade-up" style={stagger(2 + n)}>
              <ul className="flex flex-col gap-1">
                {source.claims.map((claim) => (
                  <li key={claim} className="text-[13px] leading-snug text-neutral-700">{claim}</li>
                ))}
              </ul>
              <SourceLine doc={source.doc} />
            </div>
          ))}
        </Section>

        {receipt.conflicts.length > 0 && (
          <Section icon={TriangleAlert} title="Sources disagree" tone="text-amber-600">
            {receipt.conflicts.map((c, n) => (
              <div key={n} className="animate-fade-up border-l-2 border-amber-400 pl-3" style={stagger(conflictsAt + n)}>
                <p className="text-[13px] leading-snug text-neutral-700">{c.explanation}</p>
                {c.docs.map((d) => <SourceLine key={d.id} doc={d} />)}
              </div>
            ))}
          </Section>
        )}

        {receipt.scopeWarnings.length > 0 && (
          <Section icon={Globe} title="Different context" tone="text-blue-600">
            {receipt.scopeWarnings.map((w, n) => (
              <div key={n} className="animate-fade-up border-l-2 border-blue-400 pl-3" style={stagger(scopeAt + n)}>
                <p className="text-[13px] leading-snug text-neutral-700">{w.issue}</p>
                <SourceLine doc={w.doc} />
              </div>
            ))}
          </Section>
        )}

        {receipt.experts.length > 0 && (
          <Section icon={UserRound} title="Ask an expert" last>
            {receipt.experts.map((e, n) => (
              <a
                key={e.id}
                href={`mailto:${e.email}`}
                className="animate-fade-up group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
                style={stagger(expertsAt + n)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
                  {e.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{e.name}</span>
                  <span className="block truncate text-xs text-neutral-500">{e.role ? `${e.role} · ${e.country}` : e.country}</span>
                </span>
                <ArrowRight className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </a>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 border-t border-dashed border-neutral-200" />;
}

function Section({ icon: Icon, title, tone = "text-neutral-400", last = false, children }: { icon: LucideIcon; title: string; tone?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <>
      <p className={`mb-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase ${tone}`}>
        <Icon className="size-3.5" strokeWidth={2.25} />
        {title}
      </p>
      <div className="flex flex-col gap-4">{children}</div>
      {!last && <Divider />}
    </>
  );
}

function SourceLine({ doc }: { doc: SourceDoc }) {
  const f = FRESHNESS[doc.freshness];
  return (
    <div className="mt-1.5 flex items-start gap-2">
      <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${f.dot}`} title={f.label} />
      <div className="min-w-0 text-xs leading-relaxed">
        <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-neutral-300 underline-offset-2 transition-colors hover:decoration-ink">
          {doc.title}
        </a>
        <p className="font-mono text-[11px] text-neutral-400">
          {SOURCE_LABEL[doc.sourceType] ?? doc.sourceType} · {doc.country} · <span className={doc.freshness === "fresh" ? "text-brand-dark" : doc.freshness === "superseded" ? "text-red-600" : "text-amber-700"}>{f.label}</span> · {doc.reviewedAt}
          {doc.owner && ` · ${doc.owner.name}`}
        </p>
      </div>
    </div>
  );
}
