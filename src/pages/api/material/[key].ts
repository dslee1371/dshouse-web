/**
 * 예배자료 읽기 전용 공개 엔드포인트.
 *
 *   GET /api/material/latest            → 가장 최근 자료 (json)
 *   GET /api/material/2026-09-13        → 해당 주일 자료 (json)
 *   GET /api/material/20260913          → 위와 동일
 *   ...?format=txt                      → 사람용 txt
 *
 * 예배 순서는 비밀 정보가 아니므로 토큰 없이 GET만 연다.
 * PPT 자동 생성(Claude 스킬)이 contexts 폴더 수동 다운로드 없이 바로 가져오기 위한 용도.
 * 쓰기는 여전히 /api/bucket-file (토큰 필요).
 */
export const prerender = false;

import { createBucketStorage, readManifest } from "../../../lib/bucket-storage";
import { applyDesignRule, EMPTY, parseMaterialText, type MaterialData } from "../../../lib/material";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

function stampOf(key: string): string | null {
  const m = key.match(/^(20\d{2})-?(\d{2})-?(\d{2})$/);
  return m ? `${m[1]}${m[2]}${m[3]}` : null;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET({ params, url }: { params: { key?: string }; url: URL }) {
  const key = (params.key ?? "").trim();
  const wantTxt = url.searchParams.get("format") === "txt";
  const storage = createBucketStorage();

  let stamp: string | null = null;
  try {
    if (key === "latest") {
      const entries = await readManifest(storage);
      // 매니페스트는 최신 저장 순. "자료 - YYYYMMDD" 중 날짜가 가장 큰 것을 고른다.
      const stamps = entries
        .map((e) => e.name.match(/20\d{6}/)?.[0])
        .filter((s): s is string => Boolean(s));
      stamp = stamps.sort().at(-1) ?? null;
    } else {
      stamp = stampOf(key);
    }
  } catch (error) {
    console.error("material GET manifest failed", error);
    return new Response("Failed to read file list", { status: 502, headers: CORS });
  }

  if (!stamp) {
    return new Response("Use /api/material/latest or /api/material/YYYY-MM-DD", {
      status: 400,
      headers: CORS,
    });
  }

  try {
    const txtName = `자료 - ${stamp}.txt`;
    const jsonName = `자료 - ${stamp}.json`;

    if (wantTxt) {
      const txt = await storage.getText(txtName);
      if (txt === null) return new Response("Not found", { status: 404, headers: CORS });
      return new Response(txt, {
        headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // json 우선, 없으면 txt를 파싱해 같은 구조로
    let data: MaterialData | null = null;
    let source = "json";
    const json = await storage.getText(jsonName);
    if (json) {
      try {
        data = applyDesignRule({ ...EMPTY, ...(JSON.parse(json) as Partial<MaterialData>) });
      } catch {
        data = null;
      }
    }
    if (!data) {
      const txt = await storage.getText(txtName);
      if (txt === null) return new Response("Not found", { status: 404, headers: CORS });
      data = parseMaterialText(txt);
      source = "txt";
    }
    data.serviceDate ||= `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;

    return new Response(JSON.stringify({ ...data, _source: source, _stamp: stamp }, null, 2), {
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("material GET failed", error);
    return new Response("Failed to load material", { status: 502, headers: CORS });
  }
}
