import { z } from "zod";
import { askWithTrust, COUNTRIES } from "@/lib/ask";

const Body = z.object({ question: z.string().min(3).max(2000), country: z.enum(COUNTRIES) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Expected { question, country: BE|NL|DE }" }, { status: 400 });
  try {
    return Response.json(await askWithTrust(parsed.data.question, parsed.data.country));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not answer right now" }, { status: 500 });
  }
}
