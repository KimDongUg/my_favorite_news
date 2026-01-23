/**
 * 저작권 컴플라이언스 체커
 * 요약의 저작권 안전성을 종합 검증
 */

import { validateSummary } from '../ai/copyrightValidator.js';

// 위반 로그 저장소
let violationLogs = [];
let auditHistory = [];

/**
 * 저작권 컴플라이언스 체커 클래스
 */
export class CopyrightComplianceChecker {
  constructor(options = {}) {
    this.maxQuoteLength = options.maxQuoteLength || 15;
    this.maxSimilarityScore = options.maxSimilarityScore || 0.6;
    this.minTransformationRatio = options.minTransformationRatio || 0.5;
  }

  /**
   * 15단어 이상 직접 인용 체크
   */
  checkLongQuotes(summary, originalTexts) {
    const summaryWords = this.tokenize(summary);
    const originalText = originalTexts.join(' ');
    const originalWords = this.tokenize(originalText);

    for (let i = 0; i <= summaryWords.length - this.maxQuoteLength; i++) {
      const phrase = summaryWords.slice(i, i + this.maxQuoteLength).join(' ');

      if (originalWords.join(' ').includes(phrase)) {
        return {
          violation: true,
          phrase: phrase.substring(0, 50) + '...',
          reason: `${this.maxQuoteLength}단어 이상 직접 인용 감지`,
          position: i
        };
      }
    }

    return { violation: false };
  }

  /**
   * 문장 구조 유사도 체크 (코사인 유사도)
   */
  checkStructureSimilarity(summary, originalTexts) {
    const summaryVector = this.getWordVector(summary);
    let maxSimilarity = 0;

    for (const original of originalTexts) {
      const originalVector = this.getWordVector(original);
      const similarity = this.cosineSimilarity(summaryVector, originalVector);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return {
      violation: maxSimilarity > this.maxSimilarityScore,
      score: maxSimilarity,
      threshold: this.maxSimilarityScore,
      reason: maxSimilarity > this.maxSimilarityScore
        ? `원문과 구조 과도하게 유사 (${(maxSimilarity * 100).toFixed(1)}%)`
        : null
    };
  }

  /**
   * 재작성 여부 검증
   */
  checkRewriting(summary, originalTexts) {
    const summaryWords = new Set(this.tokenize(summary));
    let matchedCount = 0;

    const allOriginalWords = new Set();
    for (const original of originalTexts) {
      this.tokenize(original).forEach(w => allOriginalWords.add(w));
    }

    for (const word of summaryWords) {
      if (allOriginalWords.has(word)) {
        matchedCount++;
      }
    }

    const transformationRatio = 1 - (matchedCount / summaryWords.size);

    return {
      isRewritten: transformationRatio >= this.minTransformationRatio,
      transformationRatio,
      threshold: this.minTransformationRatio,
      reason: transformationRatio < this.minTransformationRatio
        ? `변형도 부족 (${(transformationRatio * 100).toFixed(1)}%)`
        : null
    };
  }

  /**
   * 출처 링크 존재 여부 확인
   */
  checkSourceLinks(summary) {
    const hasSources = summary.sources && summary.sources.length > 0;
    const hasValidUrls = hasSources && summary.sources.every(s => s.url && s.url.startsWith('http'));

    return {
      hasSourceLinks: hasSources,
      hasValidUrls,
      sourceCount: summary.sources?.length || 0,
      reason: !hasSources ? '출처 링크 없음' : (!hasValidUrls ? '유효하지 않은 출처 URL' : null)
    };
  }

  /**
   * 종합 검증
   */
  async validate(summary, originalArticles) {
    const originalTexts = originalArticles.map(a =>
      `${a.originalTitle || ''} ${a.snippet || ''} ${a.rawContent || ''}`
    );

    const summaryText = `${summary.aiTitle} ${summary.aiSummary}`;

    const checks = {
      longQuotes: this.checkLongQuotes(summaryText, originalTexts),
      structureSimilarity: this.checkStructureSimilarity(summaryText, originalTexts),
      rewriting: this.checkRewriting(summaryText, originalTexts),
      sourceLinks: this.checkSourceLinks(summary)
    };

    const passed =
      !checks.longQuotes.violation &&
      !checks.structureSimilarity.violation &&
      checks.rewriting.isRewritten &&
      checks.sourceLinks.hasSourceLinks;

    const result = {
      passed,
      checks,
      summaryId: summary.id,
      category: summary.category,
      timestamp: new Date().toISOString(),
      violations: []
    };

    // 위반 사항 수집
    if (checks.longQuotes.violation) {
      result.violations.push({
        type: 'long_quote',
        reason: checks.longQuotes.reason,
        details: checks.longQuotes.phrase
      });
    }
    if (checks.structureSimilarity.violation) {
      result.violations.push({
        type: 'high_similarity',
        reason: checks.structureSimilarity.reason,
        score: checks.structureSimilarity.score
      });
    }
    if (!checks.rewriting.isRewritten) {
      result.violations.push({
        type: 'insufficient_rewriting',
        reason: checks.rewriting.reason,
        ratio: checks.rewriting.transformationRatio
      });
    }
    if (!checks.sourceLinks.hasSourceLinks) {
      result.violations.push({
        type: 'missing_sources',
        reason: checks.sourceLinks.reason
      });
    }

    // 위반 로그 저장
    if (!passed) {
      this.logViolation(result);
    }

    return result;
  }

  /**
   * 위반 로그 저장
   */
  logViolation(result) {
    violationLogs.push({
      ...result,
      loggedAt: new Date().toISOString()
    });

    // 최대 1000개 유지
    if (violationLogs.length > 1000) {
      violationLogs = violationLogs.slice(-500);
    }

    console.log(`[Compliance] 위반 감지: ${result.category} - ${result.violations.length}개 항목`);
  }

  /**
   * 텍스트 토큰화
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * 단어 벡터 생성
   */
  getWordVector(text) {
    const words = this.tokenize(text);
    const vector = {};
    for (const word of words) {
      vector[word] = (vector[word] || 0) + 1;
    }
    return vector;
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(vec1, vec2) {
    const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const word of allWords) {
      const v1 = vec1[word] || 0;
      const v2 = vec2[word] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

/**
 * 위반 로그 조회
 */
export function getViolationLogs(options = {}) {
  const { limit = 50, category = null, since = null } = options;

  let logs = [...violationLogs];

  if (category) {
    logs = logs.filter(log => log.category === category);
  }

  if (since) {
    const sinceDate = new Date(since);
    logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
  }

  return logs.slice(-limit).reverse();
}

/**
 * 컴플라이언스 통계
 */
export function getComplianceStats() {
  const total = violationLogs.length;
  const byCategory = {};
  const byViolationType = {};

  for (const log of violationLogs) {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;

    for (const violation of log.violations) {
      byViolationType[violation.type] = (byViolationType[violation.type] || 0) + 1;
    }
  }

  return {
    totalViolations: total,
    byCategory,
    byViolationType,
    lastViolation: violationLogs[violationLogs.length - 1]?.timestamp || null
  };
}

/**
 * 전체 요약 감사 실행
 */
export async function auditAllSummaries(summaries, articles) {
  const checker = new CopyrightComplianceChecker();
  const results = {
    total: summaries.length,
    passed: 0,
    failed: 0,
    violations: [],
    auditedAt: new Date().toISOString()
  };

  for (const summary of summaries) {
    const categoryArticles = articles[summary.category] || [];
    const result = await checker.validate(summary, categoryArticles);

    if (result.passed) {
      results.passed++;
    } else {
      results.failed++;
      results.violations.push({
        id: summary.id,
        category: summary.category,
        aiTitle: summary.aiTitle,
        violations: result.violations
      });
    }
  }

  // 감사 기록 저장
  auditHistory.push(results);
  if (auditHistory.length > 100) {
    auditHistory = auditHistory.slice(-50);
  }

  return results;
}

/**
 * 감사 히스토리 조회
 */
export function getAuditHistory(limit = 10) {
  return auditHistory.slice(-limit).reverse();
}

/**
 * 위반 로그 초기화
 */
export function clearViolationLogs() {
  violationLogs = [];
  console.log('[Compliance] 위반 로그 초기화됨');
}

export default CopyrightComplianceChecker;
