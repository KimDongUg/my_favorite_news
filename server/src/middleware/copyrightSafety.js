/**
 * 저작권 안전 미들웨어
 * API 응답에 법적 안전장치 자동 적용
 */

import { copyrightPolicy, generateDisclaimer, generateAttribution } from '../legal/policies.js';

/**
 * 요약 응답에 저작권 안전장치 적용
 */
export function applyCopyrightSafety(req, res, next) {
  // 원본 json 메서드 저장
  const originalJson = res.json.bind(res);

  // json 메서드 오버라이드
  res.json = function(data) {
    // 요약 데이터가 있는 응답만 처리
    if (data && (data.summaries || data.summary || data.data?.summaries)) {
      const summaries = data.summaries || data.data?.summaries || (data.summary ? [data.summary] : []);

      const safeSummaries = summaries.map(summary => applySafetyToSummary(summary));

      // 수정된 데이터로 교체
      if (data.summaries) {
        data.summaries = safeSummaries;
      } else if (data.data?.summaries) {
        data.data.summaries = safeSummaries;
      } else if (data.summary) {
        data.summary = safeSummaries[0];
      }

      // 법적 고지 추가
      data.legalNotice = copyrightPolicy.userNotice;
      data.copyrightPolicy = copyrightPolicy.principles;
    }

    return originalJson(data);
  };

  next();
}

/**
 * 개별 요약에 안전장치 적용
 */
function applySafetyToSummary(summary) {
  return {
    ...summary,

    // 1. 출처 정보 확인 및 보강
    sources: summary.sources || [],

    // 2. 면책 문구 추가
    disclaimer: generateDisclaimer(summary.sources || []),

    // 3. 출처 명시
    attribution: generateAttribution(summary.sources || []),

    // 4. 저작권 검증 상태
    copyrightCompliant: summary.validationPassed === true,

    // 5. AI 생성 표시
    aiGenerated: !summary.isFallback,

    // 6. 생성 시간 (있으면 유지)
    generatedAt: summary.generatedAt || new Date().toISOString()
  };
}

/**
 * 출처 링크 필수 검증 미들웨어
 */
export function requireSourceLinks(req, res, next) {
  // 원본 json 메서드 저장
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (data && data.summaries) {
      // 출처 없는 요약 필터링
      const validSummaries = data.summaries.filter(s =>
        s.sources && s.sources.length > 0
      );

      const filtered = data.summaries.length - validSummaries.length;
      if (filtered > 0) {
        console.log(`[Safety] 출처 없는 ${filtered}개 요약 제외됨`);
      }

      data.summaries = validSummaries;
      data.filteredCount = filtered;
    }

    return originalJson(data);
  };

  next();
}

/**
 * 저작권 위반 요약 차단 미들웨어
 */
export function blockViolations(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (data && data.summaries) {
      // 검증 실패 요약 제외
      const safeSummaries = data.summaries.filter(s => s.validationPassed !== false);

      const blocked = data.summaries.length - safeSummaries.length;
      if (blocked > 0) {
        console.log(`[Safety] 저작권 위반 ${blocked}개 요약 차단됨`);
      }

      data.summaries = safeSummaries;
      data.blockedCount = blocked;
    }

    return originalJson(data);
  };

  next();
}

/**
 * API 응답 헤더에 저작권 정보 추가
 */
export function addCopyrightHeaders(req, res, next) {
  res.setHeader('X-Content-Type', 'AI-Generated-Summary');
  res.setHeader('X-Copyright-Policy', 'https://mynews.example.com/legal/copyright');
  res.setHeader('X-Source-Attribution', 'Required');

  next();
}

export default {
  applyCopyrightSafety,
  requireSourceLinks,
  blockViolations,
  addCopyrightHeaders
};
