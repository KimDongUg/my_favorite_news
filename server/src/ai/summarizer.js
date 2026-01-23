import { generateId } from '../utils/helpers.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * AI 요약 프롬프트 생성
 * @param {Array} articles - 요약할 기사 배열
 * @param {string} category - 카테고리
 * @returns {string} 프롬프트
 */
function createSummaryPrompt(articles, category) {
  const articlesText = articles
    .map((article, index) => {
      return `[기사 ${index + 1}]
제목: ${article.originalTitle}
내용: ${article.snippet || article.rawContent}
출처: ${article.sourceName}`;
    })
    .join('\n\n');

  return `당신은 뉴스 요약 전문가입니다. 다음 ${category} 관련 기사들을 요약해주세요.

**중요 규칙 (저작권 보호)**:
1. 원문 문장을 절대 그대로 사용하지 말 것
2. 사실 중심으로 완전히 재서술할 것
3. 원문의 문장 구조를 따라가지 말 것
4. 여러 출처가 있다면 종합하여 재구성할 것
5. 15단어 이상 연속된 원문 인용 금지

**출력 형식 (JSON)**:
{
  "title": "사건 중심의 새로운 제목 (15자 내외)",
  "summary": "사실 중심 재서술 요약 (80자 이내, 2-3문장)"
}

**입력 기사들**:
${articlesText}

JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

/**
 * Claude API를 사용하여 요약 생성
 * @param {Array} articles - 요약할 기사 배열
 * @param {string} category - 카테고리
 * @returns {Promise<Object>} 생성된 요약
 */
export async function generateSummary(articles, category) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[AI] API 키 없음 - 기본 요약 사용');
    return createFallbackSummary(articles, category);
  }

  try {
    const prompt = createSummaryPrompt(articles, category);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // JSON 파싱
    const parsed = JSON.parse(content);

    return {
      id: generateId(),
      category,
      aiTitle: parsed.title,
      aiSummary: parsed.summary,
      sources: articles.map(a => ({
        url: a.originalUrl,
        name: a.sourceName,
        originalTitle: a.originalTitle,
        publishedDate: a.publishedDate
      })),
      generatedAt: new Date().toISOString(),
      validationPassed: null // 나중에 검증
    };

  } catch (error) {
    console.error('[AI] 요약 생성 실패:', error.message);
    return createFallbackSummary(articles, category);
  }
}

/**
 * API 키 없을 때 사용하는 기본 요약
 */
function createFallbackSummary(articles, category) {
  // 첫 번째 기사 기반 간단 요약
  const mainArticle = articles[0];

  return {
    id: generateId(),
    category,
    aiTitle: mainArticle.originalTitle,
    aiSummary: truncateText(mainArticle.snippet || mainArticle.rawContent, 80),
    sources: articles.map(a => ({
      url: a.originalUrl,
      name: a.sourceName,
      originalTitle: a.originalTitle,
      publishedDate: a.publishedDate
    })),
    generatedAt: new Date().toISOString(),
    validationPassed: true,
    isFallback: true
  };
}

/**
 * 텍스트 자르기
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * 카테고리별 대표 기사들 요약 생성
 * @param {Object} categoryData - 카테고리별 기사 데이터
 * @returns {Promise<Array>} 요약 배열
 */
export async function generateCategorySummaries(categoryData) {
  const summaries = [];

  for (const [category, articles] of Object.entries(categoryData)) {
    if (!articles || articles.length === 0) continue;

    // 상위 3개 기사만 요약에 사용
    const topArticles = articles.slice(0, 3);

    console.log(`[AI] ${category} 요약 생성 중...`);
    const summary = await generateSummary(topArticles, category);

    // 저작권 검증 (fallback 요약은 검증 스킵)
    if (!summary.isFallback) {
      const validation = validateSummary(summary, topArticles);
      summary.validationPassed = validation.isSafe;
      summary.validationDetails = validation.checks;
    }

    summaries.push(summary);

    // API 호출 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return summaries;
}

// 저작권 검증 함수는 별도 모듈에서 import
import { validateSummary } from './copyrightValidator.js';
