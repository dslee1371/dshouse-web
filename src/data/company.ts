/**
 * 사업자·연락처 정보 단일 소스.
 *
 * 푸터와 개인정보처리방침이 같은 값을 참조하도록 여기에 모읍니다.
 * 값이 바뀌면 이 파일만 고치면 됩니다.
 *
 * 값이 비어 있으면 푸터에서 해당 항목이 자동으로 숨겨집니다(businessLines 참고).
 */

export const company = {
  /** 상호 */
  name: "이동수하우스",
  /** 대표자 */
  owner: "장은애",
  /** 사업자등록번호 */
  businessNumber: "676-46-00839",
  /** 사업장 주소 */
  address: "서울시 중랑구 용마산로 670 203동 2302호",
  /** 대표 이메일 — TODO: 도메인 이메일 권장 (예: hello@dsdshouse.com) */
  email: "qwer013777@gmail.com",
  /** 대표 전화 */
  phone: "010-6645-0137",
} as const;

/** 개인정보 보호책임자 */
export const privacyOfficer = {
  name: company.owner,
  title: "대표",
  email: company.email,
  phone: company.phone,
} as const;

/**
 * 개인정보 처리위탁 및 국외 이전 현황.
 * 문의 폼이 외부 서비스로 전송되므로 반드시 고지해야 하는 항목입니다.
 */
export const dataProcessors = [
  {
    name: "Formspree, Inc.",
    country: "미국",
    purpose: "문의 폼 접수 및 이메일 전달",
    items: "이름, 이메일 주소, 문의 내용",
    method: "문의 전송 시 네트워크를 통한 전송",
    retention: "위탁 계약 종료 시 또는 문의 처리 완료 후 파기",
    contact: "https://formspree.io/legal/privacy-policy/",
  },
] as const;

/** 방침 시행일 — 내용을 고칠 때마다 갱신하세요. */
export const privacyEffectiveDate = "2026-08-13";

/**
 * 푸터에 표기할 사업자 항목.
 * 상호는 푸터 제목에서 이미 보여주므로 여기서는 제외하고,
 * 값이 비어 있는 항목은 걸러냅니다.
 */
export function businessLines() {
  const lines: { label: string; value: string }[] = [
    { label: "대표자", value: company.owner },
    { label: "사업자등록번호", value: company.businessNumber },
    { label: "주소", value: company.address },
  ];
  return lines.filter((line) => line.value.trim().length > 0);
}
