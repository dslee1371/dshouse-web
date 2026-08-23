import { defineCollection, z } from "astro:content";

/**
 * 프로젝트 사례 단일 컬렉션.
 *
 * 예전에는 works(사례)와 automation(자동화 프로젝트)을 나눠 뒀지만,
 * 둘 다 "우리가 한 일"이라 성격이 같아 하나로 합쳤습니다.
 * 구분은 category 태그가 맡습니다.
 *
 * detail: true 인 항목만 상세 페이지(/works/<slug>)가 생성됩니다.
 * 짧게 소개만 할 사례는 detail을 생략하고 카드로만 노출합니다.
 */
const works = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** 본문을 갖춘 상세 페이지를 만들지 여부 */
    detail: z.boolean().default(false),
    /** 목록 정렬 순서 (작을수록 앞) */
    order: z.number().default(100),
    /** 목록 필터에 쓰이는 분류 */
    category: z.enum(["자동화", "공공데이터", "하이브리드", "데이터"]),
    /** 진행 단계 */
    status: z.enum(["샘플", "시제품", "파일럿", "운영"]).default("파일럿"),
    /** 고객·현장 이름 (공개 가능한 경우) */
    org: z.string().optional(),
    /** 자동화 효과: 도입 전/후 */
    before: z.string().optional(),
    after: z.string().optional(),
    /** 카드에 표시할 요약 불릿 */
    highlights: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    /**
     * 실제 결과물 이미지. 상세 페이지 상단에 갤러리로 렌더됩니다.
     * ⚠️ 실명·연락처 등 개인정보가 담긴 화면은 가리고 올리세요.
     */
    gallery: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    /**
     * 진행 순서 — 상세 페이지 사이드바에 렌더됩니다.
     * actor는 "이 단계를 사람이 하는가, 자동으로 되는가"를 나타냅니다.
     * 방문자에게는 서버 구조보다 이쪽이 훨씬 중요한 정보입니다.
     */
    pipeline: z
      .array(
        z.object({
          label: z.string(),
          detail: z.string().optional(),
          /** 이 단계에서 실제로 손대는 항목. 칩으로 강조 렌더됩니다. */
          items: z.array(z.string()).default([]),
          actor: z.enum(["담당자", "자동"]).default("자동"),
        }),
      )
      .default([]),
    /** 연결된 실제 도구 */
    tool: z
      .object({
        href: z.string(),
        label: z.string().default("도구 열기"),
        gated: z.boolean().default(false),
        external: z.boolean().default(false),
      })
      .optional(),
  }),
});

export const collections = { works };
