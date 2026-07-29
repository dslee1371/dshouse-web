export const prerender = false;

const PAR_URL = process.env.OCI_PAR_URL;
const TOKEN = process.env.EDITOR_TOKEN;
const MANIFEST_NAME = "_manifest.json";
const MAX_BYTES = 2_000_000;

function isAuthorized(request: Request) {
  if (!TOKEN) return false;
  return request.headers.get("x-editor-token") === TOKEN;
}

function objectUrl(name: string) {
  return `${PAR_URL}${encodeURIComponent(name)}`;
}

export async function GET({ request, url }: { request: Request; url: URL }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!PAR_URL) {
    return new Response("Storage not configured", { status: 500 });
  }
  const name = url.searchParams.get("name");
  if (!name) {
    return new Response("Missing name", { status: 400 });
  }

  const res = await fetch(objectUrl(name));
  if (res.status === 404) {
    return new Response("Not found", { status: 404 });
  }
  if (!res.ok) {
    return new Response("Failed to load file", { status: 502 });
  }
  const text = await res.text();
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST({ request }: { request: Request }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!PAR_URL) {
    return new Response("Storage not configured", { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const content = body?.content;
  if (!name || typeof content !== "string") {
    return new Response("Missing name or content", { status: 400 });
  }
  if (name === MANIFEST_NAME) {
    return new Response("Reserved file name", { status: 400 });
  }
  if (Buffer.byteLength(content, "utf-8") > MAX_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  const putRes = await fetch(objectUrl(name), { method: "PUT", body: content });
  if (!putRes.ok) {
    return new Response("Failed to save file", { status: 502 });
  }

  const manifestRes = await fetch(objectUrl(MANIFEST_NAME));
  const manifest = manifestRes.ok ? await manifestRes.json().catch(() => []) : [];
  const entries = Array.isArray(manifest) ? manifest : [];
  const next = [
    { name, savedAt: new Date().toISOString() },
    ...entries.filter((entry: any) => entry?.name !== name),
  ];

  const manifestPutRes = await fetch(objectUrl(MANIFEST_NAME), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
  if (!manifestPutRes.ok) {
    return new Response("Saved file, but failed to update file list", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
