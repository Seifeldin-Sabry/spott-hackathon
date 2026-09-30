/* eslint-disable @typescript-eslint/no-explicit-any -- raw Graph JSON, untyped on purpose */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Minimal Microsoft Graph client: device-code sign-in (delegated) + paged GETs.
// Delegated, not app-only: Teams channel messages are restricted for app-only access.

const TENANT = process.env.GRAPH_TENANT_ID!;
const CLIENT_ID = process.env.GRAPH_CLIENT_ID!;
const SCOPES = "User.Read.All Sites.Read.All Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Read.All";
const LOGIN = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;

// Cached locally (gitignored) so repeated syncs within the token lifetime skip the sign-in.
const TOKEN_CACHE = ".graph-token.json";
let token: string | undefined;

async function cachedToken(): Promise<string> {
  if (existsSync(TOKEN_CACHE)) {
    const cached: { token: string; expiresAt: number } = JSON.parse(readFileSync(TOKEN_CACHE, "utf8"));
    if (cached.expiresAt > Date.now() + 60_000) return cached.token;
  }
  const { access_token, expires_in } = await signIn();
  writeFileSync(TOKEN_CACHE, JSON.stringify({ token: access_token, expiresAt: Date.now() + expires_in * 1000 }));
  return access_token;
}

async function signIn(): Promise<{ access_token: string; expires_in: number }> {
  const form = (params: Record<string, string>) => ({ method: "POST", body: new URLSearchParams(params) });
  const code = await (await fetch(`${LOGIN}/devicecode`, form({ client_id: CLIENT_ID, scope: SCOPES }))).json();
  if (!code.device_code) throw new Error(`Device code request failed: ${JSON.stringify(code)}`);
  console.log(`\n${code.message}\n`);

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, code.interval * 1000));
    const res = await (
      await fetch(`${LOGIN}/token`, form({ grant_type: "urn:ietf:params:oauth:grant-type:device_code", client_id: CLIENT_ID, device_code: code.device_code }))
    ).json();
    if (res.access_token) return res;
    if (res.error !== "authorization_pending" && res.error !== "slow_down") throw new Error(`Sign-in failed: ${res.error_description}`);
  }
}

export async function graphFetch(pathOrUrl: string): Promise<Response> {
  token ??= await cachedToken();
  const url = pathOrUrl.startsWith("https://") ? pathOrUrl : `https://graph.microsoft.com/v1.0${pathOrUrl}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Graph ${res.status} ${url}: ${await res.text()}`);
  return res;
}

export async function graph<T = any>(path: string): Promise<T> {
  return (await graphFetch(path)).json();
}

// Follows @odata.nextLink until the collection is exhausted.
export async function graphAll<T = any>(path: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | undefined = path;
  while (next) {
    const page: { value: T[]; "@odata.nextLink"?: string } = await graph(next);
    items.push(...page.value);
    next = page["@odata.nextLink"];
  }
  return items;
}
