"use client";

import { useSyncExternalStore, useState } from "react";

const CLIENTS = ["Claude Code", "Claude.ai", "Any MCP client"] as const;
type Client = (typeof CLIENTS)[number];

// Origin is only known in the browser; the server render shows a placeholder.
const useOrigin = () => useSyncExternalStore(() => () => {}, () => window.location.origin, () => "https://your-deployment");

export function McpConnect() {
  const [client, setClient] = useState<Client>("Claude Code");
  const url = `${useOrigin()}/api/mcp`;

  const steps: Record<Client, { label: string; value: string }[]> = {
    "Claude Code": [{ label: "Run in your terminal", value: `claude mcp add --transport http trust-receipt ${url}` }],
    "Claude.ai": [
      { label: "Settings → Connectors → Add custom connector, then paste", value: url },
      { label: "Ask Claude", value: "Use trust-receipt: what's the Belgian notice period for 2.5 years of seniority?" },
    ],
    "Any MCP client": [{ label: "Streamable HTTP endpoint", value: url }],
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="flex gap-1 border-b border-white/10 p-1.5">
        {CLIENTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setClient(c)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${c === client ? "bg-white text-ink" : "text-neutral-400 hover:text-white"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div key={client} className="animate-slide-in flex flex-col gap-4 p-5">
        {steps[client].map((s) => (
          <div key={s.label}>
            <p className="mb-2 text-xs font-medium text-neutral-400">{s.label}</p>
            <CopyLine value={s.value} />
          </div>
        ))}
        <p className="text-xs text-neutral-500">Two tools: <code className="text-neutral-300">ask_with_trust</code> and <code className="text-neutral-300">find_expert</code>. Claude.ai needs a public URL, so deploy first.</p>
      </div>
    </div>
  );
}

function CopyLine({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/40 py-2 pr-2 pl-4 font-mono text-[13px] text-neutral-200">
      <span className="flex-1 overflow-x-auto whitespace-nowrap">{value}</span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 font-sans text-xs font-semibold text-white transition-colors hover:bg-white/20"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
