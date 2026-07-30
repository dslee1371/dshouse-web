export const prerender = false;

import { readManifest } from "../../lib/bucket-storage";

const TOKEN = process.env.EDITOR_TOKEN;

function isAuthorized(request: Request) {
  if (!TOKEN) return false;
  return request.headers.get("x-editor-token") === TOKEN;
}

export async function GET({ request }: { request: Request }) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const entries = await readManifest();
    return new Response(JSON.stringify(entries), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("bucket-list GET failed", error);
    return new Response("Failed to load file list", { status: 502 });
  }
}
