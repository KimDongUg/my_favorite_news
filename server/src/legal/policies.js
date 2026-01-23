/**
 * 저작권 정책 및 법적 문서
 */

/**
 * 저작권 정책
 */
export const copyrightPolicy = {
  // 핵심 원칙
  principles: [
    "모든 요약은 AI가 사실을 재서술한 것입니다",
    "원문 문장을 그대로 사용하지 않습니다",
    "모든 요약에 원본 출처 링크를 제공합니다",
    "15단어 이상의 직접 인용을 금지합니다",
    "여러 출처를 종합하여 재구성합니다"
  ],

  // 사용자 공지
  userNotice: `본 웹사이트의 모든 요약 콘텐츠는 인공지능이 공개된 여러 출처를 참고하여 재작성한 것입니다. 각 요약에는 원본 기사 링크가 포함되어 있으며, 상세한 내용은 원본 출처를 참조해 주시기 바랍니다.`,

  // 이용약관
  termsOfService: `
    1. 서비스 설명
    본 서비스는 공개된 뉴스 소스를 AI가 요약하여 제공하는 정보 집계 서비스입니다.

    2. 콘텐츠 저작권
    - 요약 콘텐츠: AI가 생성한 요약문의 저작권은 본 서비스에 있습니다.
    - 원본 콘텐츠: 원본 기사의 저작권은 해당 언론사에 있습니다.
    - 출처 표기: 모든 요약에는 원본 출처가 명시됩니다.

    3. 면책 조항
    - 본 서비스는 정보 제공 목적으로만 운영됩니다.
    - 요약의 정확성을 보장하지 않으며, 중요한 결정은 원본을 확인하시기 바랍니다.
    - AI 요약 과정에서 발생할 수 있는 오류에 대해 책임지지 않습니다.

    4. 저작권자 권리
    - 저작권자는 언제든지 콘텐츠 삭제를 요청할 수 있습니다.
    - 삭제 요청은 contact@mynews.example.com으로 접수해 주세요.
    - 요청 접수 후 72시간 내에 처리됩니다.
  `,

  // 개인정보 처리방침
  privacyPolicy: `
    1. 수집 정보
    - 로그 정보: IP 주소, 브라우저 정보, 접속 시간
    - 사용 정보: 조회한 카테고리, 클릭한 기사

    2. 정보 사용 목적
    - 서비스 제공 및 개선
    - 이용 통계 분석

    3. 정보 보유 기간
    - 로그 정보: 30일
    - 익명화된 통계: 영구 보관

    4. 제3자 제공
    - 법적 요청이 있는 경우를 제외하고 제3자에게 제공하지 않습니다.
  `,

  // DMCA 정책
  dmcaPolicy: `
    저작권 침해 신고 절차

    1. 신고 방법
    이메일: dmca@mynews.example.com

    2. 필요 정보
    - 저작권자 또는 대리인 정보
    - 침해 콘텐츠 URL
    - 원본 콘텐츠 정보
    - 서명 (전자 서명 가능)

    3. 처리 절차
    - 신고 접수 후 24시간 내 확인
    - 유효한 신고의 경우 72시간 내 콘텐츠 제거
    - 처리 결과 통보

    4. 이의 제기
    콘텐츠 제거에 이의가 있는 경우 14일 내에 이의를 제기할 수 있습니다.
  `
};

/**
 * 면책 문구 생성
 */
export function generateDisclaimer(sources) {
  if (!sources || sources.length === 0) {
    return "본 내용은 AI가 생성한 요약입니다.";
  }

  const sourceNames = sources.map(s => s.name).filter(Boolean);
  const uniqueNames = [...new Set(sourceNames)];

  if (uniqueNames.length === 0) {
    return "본 내용은 AI가 공개 정보를 종합하여 재작성한 요약입니다.";
  }

  return `본 내용은 ${uniqueNames.join(', ')} 등의 공개 정보를 AI가 종합하여 재작성한 요약입니다.`;
}

/**
 * 출처 표기 생성
 */
export function generateAttribution(sources) {
  if (!sources || sources.length === 0) {
    return "";
  }

  const validSources = sources.filter(s => s.name);
  if (validSources.length === 0) {
    return "";
  }

  return `출처: ${validSources.map(s => s.name).join(', ')}`;
}

/**
 * 저작권 위반 대응 절차
 */
export const violationResponse = {
  // 자동 감지 시
  onAutoDetection: {
    action: "즉시 비활성화",
    notification: "관리자 알림",
    regeneration: "3회 재시도 후 fallback"
  },

  // 저작권자 요청 시
  onCopyrightRequest: {
    acknowledgment: "24시간 내 접수 확인",
    review: "48시간 내 검토 완료",
    action: "72시간 내 조치 완료",
    appeal: "14일 이내 이의 제기 가능"
  },

  // 반복 위반 시
  onRepeatViolation: {
    source: "해당 소스 크롤링 중단",
    review: "수동 검토 필요",
    reporting: "월간 리포트 포함"
  }
};

/**
 * 법적 페이지 콘텐츠
 */
export const legalPages = {
  about: {
    title: "서비스 소개",
    content: `
      MyNews는 AI 기술을 활용하여 다양한 뉴스 소스를 실시간으로 수집하고
      사용자에게 요약된 정보를 제공하는 서비스입니다.

      주요 특징:
      - AI 기반 실시간 뉴스 요약
      - 10개 카테고리 맞춤형 정보
      - 원본 출처 링크 제공
      - 저작권 안전 검증 시스템
    `
  },

  copyright: {
    title: "저작권 정책",
    content: copyrightPolicy.termsOfService
  },

  privacy: {
    title: "개인정보 처리방침",
    content: copyrightPolicy.privacyPolicy
  },

  dmca: {
    title: "DMCA 정책",
    content: copyrightPolicy.dmcaPolicy
  }
};

/**
 * 컴플라이언스 체크리스트
 */
export const complianceChecklist = {
  content: {
    no_verbatim_copy: "원문 문장 그대로 사용 안함",
    no_structure_copy: "원문 흐름 따라가지 않음",
    multi_source_synthesis: "여러 기사 종합 재서술",
    fact_based: "사실 중심 재구성",
    no_long_quotes: "15단어 이상 직접 인용 없음"
  },

  technical: {
    auto_similarity_check: "자동 유사도 검증",
    ai_rewriting_validation: "AI 재작성 검증",
    realtime_monitoring: "실시간 모니터링"
  },

  legal: {
    source_links: "원본 링크 제공",
    attribution: "출처 명시",
    disclaimer: "면책 조항 표시",
    terms_of_service: "이용약관 명시"
  },

  operational: {
    periodic_audit: "정기 감사 시스템",
    immediate_removal: "위반 발견시 즉시 삭제",
    copyright_response: "저작권자 요청시 대응 프로세스"
  }
};

export default {
  copyrightPolicy,
  generateDisclaimer,
  generateAttribution,
  violationResponse,
  legalPages,
  complianceChecklist
};
