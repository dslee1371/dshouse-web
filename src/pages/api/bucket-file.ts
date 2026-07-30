export const prerender = false;

import {
  createBucketStorage,
  MANIFEST_NAME,
  readManifest,
  writeManifest,
} from "../../lib/bucket-storage";

const TOKEN = process.env.EDITOR_TOKEN;
const MAX_BYTES = 2_000_000;

function isAuthorized(request: Request) {
  if (!TOKEN) return false;
  return request.headers.get("x-editor-token") === TOKEN;
}

export async function GET({ request, url }: { request: Request; url: URL }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const name = url.searchParams.get("name");
  if (!name) {
    return new Response("Missing name", { status: 400 });
  }

  try {
    const text = await createBucketStorage().getText(name);
    if (text === null) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    console.error("bucket-file GET failed", error);
    return new Response("Failed to load file", { status: 502 });
  }
}

export async function POST({ request }: { request: Request }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
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

  const storage = createBucketStorage();
  try {
    await storage.putText(name, content);
  } catch (error) {
    console.error("bucket-file POST save failed", error);
    return new Response("Failed to save file", { status: 502 });
  }

  const entries = await readManifest(storage).catch(() => []);
  const next = [
    { name, savedAt: new Date().toISOString() },
    ...entries.filter((entry: any) => entry?.name !== name),
  ];

  try {
    await writeManifest(next, storage);
  } catch (error) {
    console.error("bucket-file POST manifest update failed", error);
    return new Response("Saved file, but failed to update file list", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
