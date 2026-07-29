export const prerender = false;

const PAR_URL = process.env.OCI_PAR_URL;
const TOKEN = process.env.EDITOR_TOKEN;
const MANIFEST_NAME = "_manifest.json";

function isAuthorized(request: Request) {
  if (!TOKEN) return false;
  return request.headers.get("x-editor-token") === TOKEN;
}

export async function GET({ request }: { request: Request }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!PAR_URL) {
    return new Response("Storage not configured", { status: 500 });
  }

  const res = await fetch(`${PAR_URL}${encodeURIComponent(MANIFEST_NAME)}`);
  if (res.status === 404) {
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  }
  if (!res.ok) {
    return new Response("Failed to load file list", { status: 502 });
  }
  const text = await res.text();
  return new Response(text, { headers: { "Content-Type": "application/json" } });
}
