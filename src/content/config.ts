import { defineCollection, z } from "astro:content";

const works = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.string().transform((s) => new Date(s)),
    summary: z.string().optional(),
  }),
});

const automation = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    order: z.number().default(100),
    status: z.enum(["아이디어", "파일럿", "운영"]).default("파일럿"),
    org: z.string().optional(),
    summary: z.string(),
    // 자동화 효과: 도입 전/후 소요 시간
    before: z.string().optional(),
    after: z.string().optional(),
    stack: z.array(z.string()).default([]),
    // 파이프라인 단계 (상세 페이지에서 다이어그램으로 렌더)
    pipeline: z
      .array(
        z.object({
          label: z.string(),
          detail: z.string().optional(),
          where: z.enum(["web", "cloud", "local"]).default("web"),
        }),
      )
      .default([]),
    // 연결된 실제 도구 (비공개면 gated: true)
    tool: z
      .object({
        href: z.string(),
        label: z.string().default("도구 열기"),
        gated: z.boolean().default(false),
      })
      .optional(),
  }),
});

export const collections = { works, automation };
