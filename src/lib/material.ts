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
  "praiseMain",
  "offeringHymn",
  "hymnThree",
  "hymnFour",
  "specialSong",
  "responsiveReading",
  "prayer",
  "scripture",
  "sermonTitle",
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

export const OPTION_DEFAULTS = {
  fontSize: "40",
  oddColor: "#000000",
  evenColor: "#ffd966",
};

export const EMPTY: MaterialData = {
  serviceDate: "",
  serviceType: "주일오전예배",
  praiseMain: "",
  offeringHymn: "",
  hymnThree: "",
  hymnFour: "",
  specialSong: "remove",
  responsiveReading: "",
  prayer: "",
  scripture: "",
  sermonTitle: "",
  announcements: "",
  notes: "",
  rrFontSize: OPTION_DEFAULTS.fontSize,
  rrOddColor: OPTION_DEFAULTS.oddColor,
  rrEvenColor: OPTION_DEFAULTS.evenColor,
  scriptureFontSize: OPTION_DEFAULTS.fontSize,
  scriptureOddColor: OPTION_DEFAULTS.oddColor,
  scriptureEvenColor: OPTION_DEFAULTS.evenColor,
};

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
  scripture: "고린도전서 8장 1절 ~ 13절",
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

function optionLine(fontSize: string, oddColor: string, evenColor: string): string {
  const options: string[] = [];
  if (fontSize) options.push(`글자크기 ${fontSize}`);
  if (oddColor) options.push(`홀수절 ${oddColor}`);
  if (evenColor) options.push(`짝수절 ${evenColor}`);
  return options.length ? options.join(", ") + "." : "";
}

function numberedBlock(text: string): string {
  return lines(text)
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
}

export function buildMaterial(data: MaterialData): string {
  const chunks: string[] = [];
  chunks.push("### 찬양");
  chunks.push(numberedBlock(data.praiseMain));
  chunks.push("\n### 찬송-2 (봉헌찬송)");
  chunks.push(data.offeringHymn);
  chunks.push("\n### 교독문");
  chunks.push(data.responsiveReading);
  chunks.push(optionLine(data.rrFontSize, data.rrOddColor, data.rrEvenColor));
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
  chunks.push(data.scripture);
  chunks.push(
    optionLine(data.scriptureFontSize, data.scriptureOddColor, data.scriptureEvenColor),
  );
  chunks.push("\n### 설교");
  chunks.push(data.sermonTitle);
  chunks.push("\n### 찬송-4");
  chunks.push(data.hymnFour);
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
    .map((line) => line.replace(/^\d+\.\s*/, ""))
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

function parseOptionValues(option: string) {
  const font = option.match(/글자크기\s*(\d+)/);
  const odd = option.match(/홀수절\s*(#[0-9a-fA-F]{6})/);
  const even = option.match(/짝수절\s*(#[0-9a-fA-F]{6})/);
  return {
    fontSize: font ? font[1] : OPTION_DEFAULTS.fontSize,
    oddColor: odd ? odd[1] : OPTION_DEFAULTS.oddColor,
    evenColor: even ? even[1] : OPTION_DEFAULTS.evenColor,
  };
}

export function parseMaterialText(text: string, base: MaterialData = EMPTY): MaterialData {
  const sections = sectionMap(text);
  const next: MaterialData = { ...base };

  if (sections["찬양"] !== undefined) next.praiseMain = stripNumbering(sections["찬양"]);
  if (sections["찬송-2 (봉헌찬송)"] !== undefined)
    next.offeringHymn = sections["찬송-2 (봉헌찬송)"];
  if (sections["찬송-3"] !== undefined) next.hymnThree = sections["찬송-3"];
  if (sections["찬송-4"] !== undefined) next.hymnFour = sections["찬송-4"];
  if (sections["기도"] !== undefined) next.prayer = sections["기도"];
  if (sections["광고"] !== undefined) next.announcements = sections["광고"];
  if (sections["설교"] !== undefined) next.sermonTitle = sections["설교"];
  next.notes = sections["추가 요청"] ?? "";

  if (sections["특송 슬라이드 제거"] !== undefined) {
    next.specialSong = "remove";
  } else if (sections["특송"] !== undefined) {
    next.specialSong = /확인/.test(sections["특송"]) ? "none" : "keep";
  }

  if (sections["교독문"] !== undefined) {
    const parsed = splitContentAndOption(sections["교독문"]);
    next.responsiveReading = parsed.content;
    const opt = parseOptionValues(parsed.option);
    next.rrFontSize = opt.fontSize;
    next.rrOddColor = opt.oddColor;
    next.rrEvenColor = opt.evenColor;
  }

  if (sections["성경본문"] !== undefined) {
    const parsed = splitContentAndOption(sections["성경본문"]);
    next.scripture = parsed.content;
    const opt = parseOptionValues(parsed.option);
    next.scriptureFontSize = opt.fontSize;
    next.scriptureOddColor = opt.oddColor;
    next.scriptureEvenColor = opt.evenColor;
  }

  return next;
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

  if (!/(장|서)\s*\d+장\s*\d+절/.test(data.scripture ?? "")) {
    issues.push(["warn", "성경본문 형식이 자동 조회에 애매할 수 있습니다. 예: 고린도전서 8장 1절 ~ 13절"]);
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
    order.push({ label: "성경봉독", content: data.scripture.trim(), who: "다 같이" });
  }
  if (data.sermonTitle?.trim()) {
    order.push({ label: "설 교", content: data.sermonTitle.trim(), who: "" });
  }
  if (data.offeringHymn?.trim()) {
    order.push({ label: "봉헌찬송", content: data.offeringHymn.trim(), who: "다 같이" });
  }
  if (data.hymnFour?.trim()) {
    order.push({ label: "찬 송", content: data.hymnFour.trim(), who: "다 같이" });
  }
  order.push({ label: "축 도", content: "", who: "" });

  return {
    serviceType: data.serviceType || "주일오전예배",
    dateLabel: formatKoreanDate(data.serviceDate),
    scripture: data.scripture?.trim() ?? "",
    sermonTitle: data.sermonTitle?.trim() ?? "",
    order,
    announcements: lines(data.announcements),
  };
}
