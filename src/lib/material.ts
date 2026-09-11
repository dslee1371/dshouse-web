/**
 * 예배자료 공용 모듈.
 *
 * 에디터(입력·저장)와 주보 인쇄뷰가 같은 규격을 공유하도록,
 * 자료 텍스트("자료 - YYYYMMDD.txt")의 생성·파싱·검증을 여기에 모았습니다.
 * DOM에 의존하지 않는 순수 함수만 둡니다.
 */

export const FIELDS = [
  "serviceDate",
  "serviceType",
  "leader", // 인도자 (표지)
  "praiseMain",
  "offeringHymn",
  "offeringPrayer", // 헌금기도
  "hymnThree",
  "hymnFour",
  "specialSong",
  "responsiveReading",
  "prayer",
  "scripture",
  "sermonTitle",
  "benediction", // 축도
  "announcements",
  "notes",
  "rrFontSize",
  "rrOddColor",
  "rrEvenColor",
  "scriptureFontSize",
  "scriptureOddColor",
  "scriptureEvenColor",
] as const;

export type FieldName = (typeof FIELDS)[number];
export type MaterialData = Record<FieldName, string>;

/** 담임목사. 인도자·헌금기도·축도 기본값. */
export const DEFAULT_PASTOR = "김삼열 목사";

/**
 * 색·글자크기는 PPT 디자인 규칙(worship_design.py, 2026-08-23 수정본 기준)이 정한다.
 * 폼에서 바꾸는 값이 아니라 고정 상수다.
 *
 *  - 홀수절 검정(#0F172A), 짝수절 주황(#C2410C), 마지막 절 황금(#B8860B), 44pt
 *  - 밝은 노랑·황금(#ffd966, #f7ab08 …)은 연회색 배경(#ECF0F5)에서 대비 1.7:1 — 안 보인다
 *  - 6주 운영에서 "홀수절 주황/짝수절 검정" 등 뒤집힌 지시가 들어왔다가 되돌린 적이 있어
 *    사용자 입력값은 저장 시 항상 이 값으로 정규화한다.
 */
export const DESIGN_RULE = {
  fontSize: "44",
  oddColor: "#0F172A",
  evenColor: "#C2410C",
  lastColor: "#B8860B",
} as const;

/** @deprecated DESIGN_RULE 사용 */
export const OPTION_DEFAULTS = {
  fontSize: DESIGN_RULE.fontSize,
  oddColor: DESIGN_RULE.oddColor,
  evenColor: DESIGN_RULE.evenColor,
};

export const EMPTY: MaterialData = {
  serviceDate: "",
  serviceType: "주일오전예배",
  leader: DEFAULT_PASTOR,
  praiseMain: "",
  offeringHymn: "43장 1절만",
  offeringPrayer: DEFAULT_PASTOR,
  hymnThree: "",
  hymnFour: "",
  specialSong: "remove",
  responsiveReading: "",
  prayer: "",
  scripture: "",
  sermonTitle: "",
  benediction: DEFAULT_PASTOR,
  announcements: "",
  notes: "",
  rrFontSize: DESIGN_RULE.fontSize,
  rrOddColor: DESIGN_RULE.oddColor,
  rrEvenColor: DESIGN_RULE.evenColor,
  scriptureFontSize: DESIGN_RULE.fontSize,
  scriptureOddColor: DESIGN_RULE.oddColor,
  scriptureEvenColor: DESIGN_RULE.evenColor,
};

/** 색·크기 필드를 디자인 규칙 값으로 강제한다. 저장·불러오기 양쪽에서 호출. */
export function applyDesignRule(data: MaterialData): MaterialData {
  return {
    ...data,
    rrFontSize: DESIGN_RULE.fontSize,
    rrOddColor: DESIGN_RULE.oddColor,
    rrEvenColor: DESIGN_RULE.evenColor,
    scriptureFontSize: DESIGN_RULE.fontSize,
    scriptureOddColor: DESIGN_RULE.oddColor,
    scriptureEvenColor: DESIGN_RULE.evenColor,
    leader: data.leader?.trim() || DEFAULT_PASTOR,
    offeringPrayer: data.offeringPrayer?.trim() || DEFAULT_PASTOR,
    benediction: data.benediction?.trim() || DEFAULT_PASTOR,
  };
}

export const SAMPLE: MaterialData = {
  ...EMPTY,
  serviceDate: "2026-07-26",
  serviceType: "주일오전예배",
  praiseMain: "예배합니다.\n내가매일기쁘게\n주의친절한 팔에안기세\n주만바라볼지라",
  offeringHymn: "43장 1절만",
  hymnThree: "315장",
  hymnFour: "288장",
  specialSong: "remove",
  responsiveReading: "교독문 64. 시편 148편",
  prayer: "김순규 장로",
  scripture: "고린도전서 8장 1-13절",
  sermonTitle: "자유와 사랑",
  announcements: "예배 후 여전도회 월례회가 본당에서 있습니다.\n7.21-24일 김삼열 목사 휴가",
};

/* ------------------------------------------------------------------ */
/* 문자열 유틸                                                          */
/* ------------------------------------------------------------------ */

export function lines(text: string): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function dateStamp(serviceDate: string): string {
  return (serviceDate ?? "").replaceAll("-", "");
}

export function fileNameFor(serviceDate: string): string {
  return `자료 - ${dateStamp(serviceDate)}.txt`;
}

/** 자동화(PPT 생성)가 읽는 구조화 파일. txt와 항상 쌍으로 저장한다. */
export function jsonFileNameFor(serviceDate: string): string {
  return `자료 - ${dateStamp(serviceDate)}.json`;
}

export function isJsonMaterial(name: string): boolean {
  return /\.json$/i.test(name);
}

export function dateFromFileName(name: string): string | null {
  const stamp = name.match(/20\d{6}/)?.[0];
  if (!stamp) return null;
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKoreanDate(serviceDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate ?? "")) return "";
  const [y, m, d] = serviceDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[date.getUTCDay()]})`;
}

/* ------------------------------------------------------------------ */
/* 자료 텍스트 생성                                                     */
/* ------------------------------------------------------------------ */

/** 색·크기 지시 줄. 입력값과 무관하게 디자인 규칙을 적는다 (PPT 쪽 규칙과 문서상 일치). */
function optionLine(): string {
  return `글자크기 ${DESIGN_RULE.fontSize}, 홀수절 ${DESIGN_RULE.oddColor}, 짝수절 ${DESIGN_RULE.evenColor}, 마지막절 ${DESIGN_RULE.lastColor}.`;
}

function numberedBlock(text: string): string {
  return lines(text)
    .map((line) => line.replace(/^(\d+\.\s*)+/, "")) // 이미 번호가 있으면 떼고 다시 매김 ("1. 1. …" 방지)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

export function buildMaterial(raw: MaterialData): string {
  const data = applyDesignRule(raw);
  const chunks: string[] = [];
  chunks.push("### 인도자");
  chunks.push(data.leader);
  chunks.push("\n### 찬양");
  chunks.push(numberedBlock(data.praiseMain));
  chunks.push("\n### 찬송-2 (봉헌찬송)");
  chunks.push(data.offeringHymn);
  chunks.push("\n### 헌금기도");
  chunks.push(data.offeringPrayer);
  chunks.push("\n### 교독문");
  chunks.push(data.responsiveReading);
  chunks.push(optionLine());
  chunks.push("\n### 찬송-3");
  chunks.push(data.hymnThree);
  chunks.push("\n### 기도");
  chunks.push(data.prayer);
  if (data.specialSong === "remove") {
    chunks.push("\n### 특송 슬라이드 제거");
  } else if (data.specialSong === "keep") {
    chunks.push("\n### 특송");
    chunks.push("특송 있음");
  } else {
    chunks.push("\n### 특송");
    chunks.push("확인 필요");
  }
  chunks.push("\n### 광고");
  chunks.push(lines(data.announcements).join("\n"));
  chunks.push("\n### 성경본문");
  chunks.push(normalizeScripture(data.scripture));
  chunks.push(optionLine());
  chunks.push("\n### 설교");
  chunks.push(data.sermonTitle);
  chunks.push("\n### 찬송-4");
  chunks.push(data.hymnFour);
  chunks.push("\n### 축도");
  chunks.push(data.benediction);
  if (data.notes) {
    chunks.push("\n### 추가 요청");
    chunks.push(data.notes);
  }
  return chunks.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ------------------------------------------------------------------ */
/* 자료 텍스트 파싱                                                     */
/* ------------------------------------------------------------------ */

function sectionMap(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = [...text.matchAll(/^###\s*(.+)$/gm)];
  matches.forEach((match, index) => {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    sections[title] = text.slice(start, end).trim();
  });
  return sections;
}

function stripNumbering(text: string): string {
  return lines(text)
    .map((line) => line.replace(/^(\d+\.\s*)+/, ""))
    .join("\n");
}

function splitContentAndOption(text: string): { content: string; option: string } {
  const textLines = lines(text);
  const optionIndex = textLines.findIndex((line) => /글자크기|홀수절|짝수절/.test(line));
  if (optionIndex === -1) return { content: textLines.join("\n"), option: "" };
  return {
    content: textLines.slice(0, optionIndex).join("\n"),
    option: textLines.slice(optionIndex).join(" "),
  };
}

export function parseMaterialText(text: string, base: MaterialData = EMPTY): MaterialData {
  const sections = sectionMap(text);
  const next: MaterialData = { ...base };

  if (sections["인도자"] !== undefined) next.leader = sections["인도자"];
  if (sections["찬양"] !== undefined) next.praiseMain = stripNumbering(sections["찬양"]);
  if (sections["찬송-2 (봉헌찬송)"] !== undefined)
    next.offeringHymn = sections["찬송-2 (봉헌찬송)"];
  if (sections["헌금기도"] !== undefined) next.offeringPrayer = sections["헌금기도"];
  if (sections["찬송-3"] !== undefined) next.hymnThree = sections["찬송-3"];
  if (sections["찬송-4"] !== undefined) next.hymnFour = sections["찬송-4"];
  if (sections["기도"] !== undefined) next.prayer = sections["기도"];
  if (sections["축도"] !== undefined) next.benediction = sections["축도"];
  if (sections["광고"] !== undefined) next.announcements = sections["광고"];
  if (sections["설교"] !== undefined) next.sermonTitle = sections["설교"];
  next.notes = sections["추가 요청"] ?? "";

  if (sections["특송 슬라이드 제거"] !== undefined) {
    next.specialSong = "remove";
  } else if (sections["특송"] !== undefined) {
    next.specialSong = /확인/.test(sections["특송"]) ? "none" : "keep";
  }

  // 색·크기 지시 줄은 읽되 값은 쓰지 않는다 — 항상 디자인 규칙(applyDesignRule)으로 정규화
  if (sections["교독문"] !== undefined) {
    next.responsiveReading = splitContentAndOption(sections["교독문"]).content;
  }

  if (sections["성경본문"] !== undefined) {
    next.scripture = splitContentAndOption(sections["성경본문"]).content;
  }

  return applyDesignRule(next);
}

/* ------------------------------------------------------------------ */
/* 교독문 / 성경본문 표기 정규화                                         */
/* ------------------------------------------------------------------ */

/**
 * 교독문 select 값("65|시편 149편") 또는 자유 입력을 "교독문 65. 시편 149편"으로.
 * 번호와 편 제목을 같이 적어두면 PPT 쪽에서 docx 번호와 대조해 불일치를 잡을 수 있다.
 */
export function formatResponsiveReading(value: string): string {
  const v = (value ?? "").trim();
  const m = v.match(/^(\d{1,3})\|(.+)$/);
  if (m) return `교독문 ${m[1]}. ${m[2].trim()}`;
  return v;
}

/** "고린도전서 13장 1절~13절" / "1 ~ 13절" / "14~33절" 등 → 일관 표기 "고린도전서 13장 1-13절" */
export function normalizeScripture(value: string): string {
  const v = (value ?? "").trim().replace(/\s+/g, " ");
  const m = v.match(/^(.+?)\s*(\d+)\s*장\s*(\d+)\s*절?\s*[~\-–]\s*(\d+)\s*절?$/);
  if (m) return `${m[1].trim()} ${m[2]}장 ${m[3]}-${m[4]}절`;
  const single = v.match(/^(.+?)\s*(\d+)\s*장\s*(\d+)\s*절$/);
  if (single) return `${single[1].trim()} ${single[2]}장 ${single[3]}절`;
  return v;
}

/* ------------------------------------------------------------------ */
/* 검증                                                                */
/* ------------------------------------------------------------------ */

export type IssueLevel = "danger" | "warn" | "ok";
export type Issue = [IssueLevel, string];

const REQUIRED: [string, FieldName][] = [
  ["찬양", "praiseMain"],
  ["봉헌찬송", "offeringHymn"],
  ["교독문", "responsiveReading"],
  ["찬송-3", "hymnThree"],
  ["기도", "prayer"],
  ["성경본문", "scripture"],
  ["설교", "sermonTitle"],
  ["찬송-4", "hymnFour"],
];

const HYMN_FIELDS: [string, FieldName][] = [
  ["봉헌찬송", "offeringHymn"],
  ["찬송-3", "hymnThree"],
  ["찬송-4", "hymnFour"],
];

export function validate(data: MaterialData): Issue[] {
  const issues: Issue[] = [];

  REQUIRED.forEach(([label, field]) => {
    if (!data[field]?.trim()) issues.push(["danger", `${label} 항목이 비어 있습니다.`]);
  });

  if (lines(data.praiseMain).length < 2) {
    issues.push(["warn", "찬양 목록이 2곡 이하입니다. 예배 순서와 맞는지 확인하세요."]);
  }

  HYMN_FIELDS.forEach(([label, field]) => {
    const text = data[field]?.trim();
    if (text && !/\d+\s*장/.test(text)) {
      issues.push(["warn", `${label}에 찬송 장수가 보이지 않습니다.`]);
    }
  });

  const allText = buildMaterial(data);
  const stamp = dateStamp(data.serviceDate);
  const otherDate = allText.match(/20\d{6}/g)?.find((found) => found !== stamp);
  if (otherDate) {
    issues.push([
      "danger",
      `선택한 예배 날짜와 다른 날짜(${otherDate})가 포함되어 있습니다.`,
    ]);
  }

  if (/contexts|수정해줘|확인해서|pptx/i.test(allText)) {
    issues.push(["warn", "작업 지시문처럼 보이는 문장이 포함되어 있습니다. 자료 본문인지 확인하세요."]);
  }

  // "고린도전서 13장 1-13절", "시편 23편 1-6절" 둘 다 허용
  if (!/\S+\s*\d+\s*[장편]\s*\d+\s*(-\s*\d+)?\s*절/.test(normalizeScripture(data.scripture ?? ""))) {
    issues.push(["warn", "성경본문 형식이 자동 조회에 애매할 수 있습니다. 예: 고린도전서 13장 1-13절"]);
  }

  if (data.responsiveReading && !/^교독문\s*\d{1,3}\.\s*\S/.test(data.responsiveReading.trim())) {
    issues.push(["warn", "교독문은 목록에서 골라 '교독문 65. 시편 149편' 형식이어야 번호 불일치를 막을 수 있습니다."]);
  }

  if (!issues.length) {
    issues.push(["ok", "필수 항목이 채워졌습니다. 주보·PPT 생성에 사용할 수 있습니다."]);
  }

  return issues;
}

export function hasBlockingIssue(data: MaterialData): boolean {
  return validate(data).some(([level]) => level === "danger");
}

/* ------------------------------------------------------------------ */
/* 주보 모델                                                            */
/* ------------------------------------------------------------------ */

export type OrderRow = {
  label: string;
  content: string;
  who?: string;
};

export type Bulletin = {
  serviceType: string;
  dateLabel: string;
  scripture: string;
  sermonTitle: string;
  order: OrderRow[];
  announcements: string[];
};

/**
 * 예배순서는 자료 텍스트의 순서(= PPT 슬라이드 순서)를 그대로 따릅니다.
 * 순서를 바꾸려면 buildMaterial과 함께 수정해야 합니다.
 */
export function toBulletin(data: MaterialData): Bulletin {
  const order: OrderRow[] = [];

  const praise = lines(data.praiseMain);
  if (praise.length) {
    order.push({ label: "찬 양", content: praise.join(" · "), who: "찬양팀" });
  }
  // 아래 순서는 실제 PPT 슬라이드 순서(worship_design 조립 순서)와 동일하게 유지한다.
  order.push({ label: "사도신경", content: "", who: "다 같이" });
  if (data.offeringHymn?.trim()) {
    order.push({ label: "봉헌찬송", content: data.offeringHymn.trim(), who: "다 같이" });
  }
  order.push({ label: "헌금기도", content: "", who: data.offeringPrayer?.trim() || DEFAULT_PASTOR });
  if (data.responsiveReading?.trim()) {
    order.push({ label: "교 독 문", content: data.responsiveReading.trim(), who: "다 같이" });
  }
  if (data.hymnThree?.trim()) {
    order.push({ label: "찬 송", content: data.hymnThree.trim(), who: "다 같이" });
  }
  if (data.prayer?.trim()) {
    order.push({ label: "기 도", content: "", who: data.prayer.trim() });
  }
  if (data.specialSong === "keep") {
    order.push({ label: "특 송", content: "", who: "" });
  }
  if (data.scripture?.trim()) {
    order.push({ label: "성경봉독", content: normalizeScripture(data.scripture), who: "다 같이" });
  }
  if (data.sermonTitle?.trim()) {
    order.push({ label: "설 교", content: data.sermonTitle.trim(), who: data.leader?.trim() || DEFAULT_PASTOR });
  }
  if (data.hymnFour?.trim()) {
    order.push({ label: "찬 송", content: data.hymnFour.trim(), who: "다 같이" });
  }
  order.push({ label: "축 도", content: "", who: data.benediction?.trim() || DEFAULT_PASTOR });

  return {
    serviceType: data.serviceType || "주일오전예배",
    dateLabel: formatKoreanDate(data.serviceDate),
    scripture: normalizeScripture(data.scripture ?? ""),
    sermonTitle: data.sermonTitle?.trim() ?? "",
    order,
    announcements: lines(data.announcements),
  };
}
