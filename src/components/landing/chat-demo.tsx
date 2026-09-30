"use client";

import { useEffect, useRef, useState } from "react";

// Scripted, looping replay of a Claude conversation using the trust-receipt MCP.
// Each entry: how long to wait (ms) before revealing the next step.
const TIMELINE = [600, 1400, 2600, 3200, 1400, 2400, 4200];
const STEP = { user1: 1, thinking1: 2, result1: 3, user2: 4, thinking2: 5, result2: 6 } as const;

export function ChatDemo() {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStep((s) => (s + 1) % (TIMELINE.length)), TIMELINE[step]);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          {["#FF5F57", "#FFBD2E", "#27C840"].map((c) => (
            <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="ml-1 text-xs font-medium text-neutral-400">Claude · trust-receipt MCP</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-brand">
          <span className="animate-pulse-ring size-1.5 rounded-full bg-brand" />
          Connected
        </span>
      </div>

      <div ref={scrollRef} className="flex h-[clamp(360px,48vw,440px)] flex-col gap-4 overflow-y-auto p-5">
        {step >= STEP.user1 && <UserBubble>Does a March joiner get the end-of-year premium in Belgium?</UserBubble>}
        {step === STEP.thinking1 && <Thinking tool="ask_with_trust" args='country: "BE"' />}
        {step >= STEP.result1 && (
          <AssistantBubble>
            <p>
              Yes, <strong>pro rata</strong> for the months worked, provided they reach 6 months&apos; seniority in the year.
            </p>
            <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed">
              <SourceRow status="fresh" title="Policy: End-of-year premium, PC 200" meta="SharePoint · reviewed Mar 2026" />
              <SourceRow status="stale" title="Teams #payroll-be thread" meta="Teams · Nov 2024" />
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800">
                <span>⚠</span>
                <span>Sources disagree. Trusting the reviewed policy over the older chat thread.</span>
              </div>
            </div>
          </AssistantBubble>
        )}
        {step >= STEP.user2 && <UserBubble>Who can confirm this for a customer?</UserBubble>}
        {step === STEP.thinking2 && <Thinking tool="find_expert" args='topic: "end-of-year premium"' />}
        {step >= STEP.result2 && (
          <AssistantBubble>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-semibold text-white">AP</span>
              <div>
                <p className="font-semibold">An Peeters</p>
                <p className="text-xs text-neutral-500">Senior Payroll Consultant · BE · owns the PC 200 policy</p>
              </div>
            </div>
          </AssistantBubble>
        )}
      </div>

      <div className="border-t border-neutral-100 p-3">
        <div className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-400">Message Claude…</div>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-slide-in flex justify-end">
      <div className="max-w-[80%] rounded-[14px_14px_3px_14px] bg-brand px-3.5 py-2.5 text-sm leading-normal tracking-[-0.01em] text-white">
        {children}
      </div>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-slide-in flex items-start gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-[#D97757] text-[11px] font-bold text-white">✳</span>
      <div className="max-w-[88%] text-sm leading-relaxed text-neutral-800">{children}</div>
    </div>
  );
}

function Thinking({ tool, args }: { tool: string; args: string }) {
  return (
    <div className="animate-slide-in flex items-center gap-2.5 text-xs text-neutral-500">
      <span className="grid size-6 place-items-center rounded-md bg-[#D97757] text-[11px] font-bold text-white">✳</span>
      <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono">
        {tool}({args})
      </span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot size-1 rounded-full bg-neutral-400" />
        ))}
      </span>
    </div>
  );
}

function SourceRow({ status, title, meta }: { status: "fresh" | "stale"; title: string; meta: string }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className={`size-1.5 shrink-0 translate-y-[-1px] rounded-full ${status === "fresh" ? "bg-brand" : "bg-amber-500"}`} />
      <span className="truncate text-neutral-800">{title}</span>
      <span className="ml-auto shrink-0 text-neutral-400">{meta}</span>
    </div>
  );
}
