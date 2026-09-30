import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { askWithTrust, COUNTRIES, findExpert } from "@/lib/ask";

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "ask_with_trust",
      {
        title: "Ask with trust receipt",
        description:
          "Answer a payroll/HR question from SD Worx knowledge sources. Returns the answer plus a trust receipt: cited sources with owner, freshness and status, conflicts between sources, country-scope warnings, and experts to contact.",
        inputSchema: z.object({ question: z.string(), country: z.enum(COUNTRIES) }),
      },
      async ({ question, country }) => json(await askWithTrust(question, country)),
    );
    server.registerTool(
      "find_expert",
      {
        title: "Find expert",
        description: "Find colleagues with expertise on a payroll/HR topic, optionally filtered by country.",
        inputSchema: z.object({ topic: z.string(), country: z.enum(COUNTRIES).optional() }),
      },
      async ({ topic, country }) => json(await findExpert(topic, country)),
    );
  },
  { serverInfo: { name: "trust-receipt", version: "0.1.0" } },
);

export { handler as GET, handler as POST };
