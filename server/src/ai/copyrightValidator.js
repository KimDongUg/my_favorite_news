/**
 * 저작권 안전 요약 검증 시스템
 * - 15단어 이상 직접 인용 체크
 * - 문장 구조 유사도 체크
 * - 최소 변형도 체크
 */

/**
 * 요약의 저작권 안전성 검증
 * @param {Object} summary - AI 생성 요약
 * @param {Array} originalArticles - 원본 기사 배열
 * @returns {Object} 검증 결과
 */
export function validateSummary(summary, originalArticles) {
  const summaryText = `${summary.aiTitle} ${summary.aiSummary}`;

  // 모든 원본 텍스트 합치기
  const originalTexts = originalArticles.map(a =>
    `${a.originalTitle} ${a.snippet || ''} ${a.rawContent || ''}`
  );

  const checks = {
    // 1. 15단어 이상 직접 인용 체크
    hasLongQuote: checkLongQuotes(summaryText, originalTexts),

    // 2. 문장 구조 유사도 체크 (n-gram 기반)
    similarityScore: calculateNGramSimilarity(summaryText, originalTexts),

    // 3. 최소 변형도 체크
    transformationRatio: calculateTransformationRatio(summaryText, originalTexts),

    // 4. 연속 단어 일치 체크
    maxConsecutiveMatch: findMaxConsecutiveMatch(summaryText, originalTexts)
  };

  // 안전 여부 판정
  const isSafe =
    !checks.hasLongQuote &&
    checks.similarityScore < 0.6 &&
    checks.transformationRatio > 0.5 &&
    checks.maxConsecutiveMatch < 15;

  return {
    isSafe,
    checks,
    message: isSafe
      ? '저작권 검증 통과'
      : getFailureMessage(checks)
  };
}

/**
 * 15단어 이상 직접 인용 체크
 */
function checkLongQuotes(summary, originalTexts) {
  const summaryWords = tokenize(summary);

  for (const original of originalTexts) {
    const originalWords = tokenize(original);

    // 슬라이딩 윈도우로 15단어 연속 일치 확인
    for (let i = 0; i <= summaryWords.length - 15; i++) {
      const window = summaryWords.slice(i, i + 15).join(' ');

      if (originalWords.join(' ').includes(window)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * N-gram 기반 유사도 계산
 */
function calculateNGramSimilarity(summary, originalTexts) {
  const summaryNGrams = getNGrams(summary, 3);
  let maxSimilarity = 0;

  for (const original of originalTexts) {
    const originalNGrams = getNGrams(original, 3);
    const similarity = jaccardSimilarity(summaryNGrams, originalNGrams);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  return maxSimilarity;
}

/**
 * 변형 비율 계산
 */
function calculateTransformationRatio(summary, originalTexts) {
  const summaryWords = new Set(tokenize(summary));
  let matchedWords = 0;

  const allOriginalWords = new Set();
  for (const original of originalTexts) {
    tokenize(original).forEach(w => allOriginalWords.add(w));
  }

  for (const word of summaryWords) {
    if (allOriginalWords.has(word)) {
      matchedWords++;
    }
  }

  // 새로운 단어 비율
  const newWordsRatio = 1 - (matchedWords / summaryWords.size);
  return newWordsRatio;
}

/**
 * 최대 연속 일치 단어 수 찾기
 */
function findMaxConsecutiveMatch(summary, originalTexts) {
  const summaryWords = tokenize(summary);
  let maxMatch = 0;

  for (const original of originalTexts) {
    const originalText = tokenize(original).join(' ');

    for (let windowSize = summaryWords.length; windowSize > 0; windowSize--) {
      for (let i = 0; i <= summaryWords.length - windowSize; i++) {
        const window = summaryWords.slice(i, i + windowSize).join(' ');

        if (originalText.includes(window)) {
          maxMatch = Math.max(maxMatch, windowSize);
          break;
        }
      }
      if (maxMatch >= windowSize) break;
    }
  }

  return maxMatch;
}

/**
 * 텍스트 토큰화
 */
function tokenize(text) {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * N-gram 생성
 */
function getNGrams(text, n) {
  const words = tokenize(text);
  const ngrams = new Set();

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Jaccard 유사도 계산
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * 검증 실패 메시지 생성
 */
function getFailureMessage(checks) {
  const messages = [];

  if (checks.hasLongQuote) {
    messages.push('15단어 이상 직접 인용 감지');
  }
  if (checks.similarityScore >= 0.6) {
    messages.push(`문장 유사도 높음 (${(checks.similarityScore * 100).toFixed(1)}%)`);
  }
  if (checks.transformationRatio <= 0.5) {
    messages.push(`변형도 부족 (${(checks.transformationRatio * 100).toFixed(1)}%)`);
  }
  if (checks.maxConsecutiveMatch >= 15) {
    messages.push(`연속 ${checks.maxConsecutiveMatch}단어 일치`);
  }

  return messages.join(', ');
}

/**
 * 요약 재생성 필요 여부 판단
 */
export function needsRegeneration(validationResult) {
  return !validationResult.isSafe;
}

/**
 * 안전한 요약 예시 체크 (디버깅용)
 */
export function debugValidation(summary, originalArticles) {
  const result = validateSummary(summary, originalArticles);

  console.log('\n=== 저작권 검증 결과 ===');
  console.log('안전 여부:', result.isSafe ? '✅ 통과' : '❌ 실패');
  console.log('상세 체크:');
  console.log('  - 15단어 인용:', result.checks.hasLongQuote ? '❌' : '✅');
  console.log('  - 유사도:', `${(result.checks.similarityScore * 100).toFixed(1)}%`);
  console.log('  - 변형도:', `${(result.checks.transformationRatio * 100).toFixed(1)}%`);
  console.log('  - 최대 연속 일치:', `${result.checks.maxConsecutiveMatch}단어`);
  console.log('메시지:', result.message);
  console.log('========================\n');

  return result;
}
