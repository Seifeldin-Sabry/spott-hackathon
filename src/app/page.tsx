import { Clock, FileText, Globe, TriangleAlert, UserRound } from "lucide-react";
import { ChatDemo } from "@/components/landing/chat-demo";
import { LiveDemo } from "@/components/landing/live-demo";
import { McpConnect } from "@/components/landing/mcp-connect";
import { Reveal } from "@/components/landing/reveal";

const DOUBTS = [
  { title: "Ten results, one question.", body: "Search finds a policy, a checklist and a Teams thread. They say three different things." },
  { title: "Old answers look like new ones.", body: "A 2023 checklist reads just as confidently as last month's reviewed procedure." },
  { title: "Right answer, wrong country.", body: "The Dutch rule is correct. It just doesn't apply to your Belgian customer." },
];

const SIGNALS = [
  { icon: FileText, title: "Sources cited", body: "Every claim links to the document or thread it came from." },
  { icon: Clock, title: "Freshness", body: "Review dates and superseded status, computed from metadata, not guessed." },
  { icon: TriangleAlert, title: "Conflicts", body: "When sources disagree, you see both and which one wins, and why." },
  { icon: Globe, title: "Context check", body: "Flags sources that belong to a different country or situation." },
  { icon: UserRound, title: "The expert", body: "The owner of the knowledge, one click away when the receipt isn't enough." },
];

const STEPS = [
  { n: "01", title: "Connect", body: "Syncs SharePoint files, Teams channel threads and the people directory through Microsoft Graph." },
  { n: "02", title: "Check", body: "Freshness comes from review dates. Claude compares sources, spots conflicts and wrong-country matches." },
  { n: "03", title: "Answer anywhere", body: "In the browser, or inside Claude and any MCP client, with the same receipt attached." },
];

export default function Home() {
  return (
    <div className="bg-white text-ink">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)] bg-[size:44px_44px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-28">
          <div>
            <p className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
              <span className="size-1.5 rounded-full bg-brand" /> Knowledge you can check · proof of concept
            </p>
            <h1 className="animate-fade-up text-[clamp(40px,6vw,68px)] leading-[1.02] font-extrabold tracking-[-0.045em]" style={{ animationDelay: "80ms" }}>
              Every answer comes <br className="hidden sm:block" />
              with a <span className="text-brand">receipt.</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-lg text-lg leading-relaxed text-neutral-600" style={{ animationDelay: "160ms" }}>
              Payroll answers with their sources, review dates, conflicts and the expert to ask. Go from &ldquo;I found something&rdquo; to &ldquo;I know why I can rely on it.&rdquo;
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <a href="#demo" className="rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgb(41_163_41/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_10px_28px_rgb(41_163_41/0.4)]">
                Try the live demo ↓
              </a>
              <a href="#connect" className="rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
                Connect to Claude
              </a>
            </div>
            <p className="animate-fade-up mt-8 text-xs text-neutral-400" style={{ animationDelay: "320ms" }}>
              Reads from SharePoint · Teams · People directory
            </p>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* The moment of doubt */}
      <section className="border-b border-neutral-200 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader label="The problem" title="Finding it was never the hard part." />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 md:grid-cols-3">
            {DOUBTS.map((d, i) => (
              <Reveal key={d.title} delay={i * 100} className="bg-white p-7">
                <p className="text-lg font-bold tracking-[-0.02em]">{d.title}</p>
                <p className="mt-2 leading-relaxed text-neutral-600">{d.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Anatomy */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader label="Trust signals" title="What's on every receipt." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SIGNALS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                  <span className="grid size-10 place-items-center rounded-xl bg-neutral-100 text-ink transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                    <s.icon className="size-5" strokeWidth={2} />
                  </span>
                  <p className="mt-4 font-bold tracking-[-0.02em]">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" className="scroll-mt-16 border-b border-neutral-200 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader label="Live demo" title="Ask it a trick question." sub="Real answers, generated live. The demo knowledge base has planted conflicts, outdated docs and wrong-country traps." />
          <Reveal>
            <LiveDemo />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-neutral-200 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader label="How it works" title="Where knowledge already lives." />
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <p className="font-mono text-sm font-semibold text-brand">{s.n}</p>
                <div className="my-4 h-px bg-gradient-to-r from-neutral-300 to-transparent" />
                <p className="text-xl font-bold tracking-[-0.02em]">{s.title}</p>
                <p className="mt-2 leading-relaxed text-neutral-600">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Connect */}
      <section id="connect" className="scroll-mt-16 bg-ink py-24 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <Label dark>MCP</Label>
            <h2 className="text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-extrabold tracking-[-0.04em]">Not another portal. <br />A receipt inside your AI.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-neutral-400">
              Plug the trust layer into Claude or any MCP client. Whatever assistant your people already use, every answer arrives with its receipt.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <McpConnect />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[linear-gradient(180deg,#29a329_0%,#1f7f1f_100%)] py-24 text-white">
        <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-[clamp(32px,4.5vw,56px)] leading-[1.02] font-extrabold tracking-[-0.045em]">Stop guessing. Start checking.</h2>
          <p className="mt-4 text-lg text-white/85">No sign-up. Ask it something now.</p>
          <a href="#demo" className="mt-9 inline-block rounded-xl bg-white px-7 py-4 text-sm font-semibold text-ink shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl">
            Try the live demo →
          </a>
        </Reveal>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-neutral-400 sm:px-6">
          <Wordmark />
          <p>Hackathon proof of concept · demo data is fictional</p>
        </div>
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <a href="#"><Wordmark /></a>
        <nav className="hidden gap-6 text-sm text-neutral-500 sm:flex">
          <a href="#demo" className="transition-colors hover:text-ink">Demo</a>
          <a href="#connect" className="transition-colors hover:text-ink">Connect</a>
        </nav>
        <a href="#demo" className="ml-auto rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800">
          Try it free
        </a>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <span className="inline-flex items-baseline text-base tracking-[-0.03em]">
      <span className="font-bold text-ink">trust</span>
      <span className="text-lg leading-none font-bold text-brand">.</span>
      <span className="font-medium text-neutral-400">receipt</span>
    </span>
  );
}

function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`mb-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase ${dark ? "text-neutral-400" : "text-neutral-500"}`}>
      <span className="h-px w-6 bg-brand" />
      {children}
    </p>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-12 grid items-end gap-6 md:grid-cols-[1fr_1fr]">
      <div>
        <Label>{label}</Label>
        <h2 className="text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-extrabold tracking-[-0.04em]">{title}</h2>
      </div>
      {sub && <p className="leading-relaxed text-neutral-600">{sub}</p>}
    </Reveal>
  );
}
