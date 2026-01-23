/**
 * API 서비스
 * 백엔드 서버와 통신
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * API 요청 헬퍼
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] ${endpoint} 요청 실패:`, error);
    throw error;
  }
}

/**
 * 뉴스 API
 */
export const newsAPI = {
  // 모든 뉴스 가져오기
  getAll: () => fetchAPI('/news'),

  // 카테고리별 뉴스
  getByCategory: (category) => fetchAPI(`/news/category/${encodeURIComponent(category)}`),

  // 뉴스 통계
  getStats: () => fetchAPI('/news/stats'),

  // 수동 크롤링 트리거
  triggerCrawl: () => fetchAPI('/news/crawl', { method: 'POST' }),
};

/**
 * 요약 API
 */
export const summaryAPI = {
  // 모든 요약 가져오기
  getAll: () => fetchAPI('/summary'),

  // 검증된 요약만 가져오기
  getValidated: () => fetchAPI('/summary?validated=true'),

  // 카테고리별 요약
  getByCategory: (category) => fetchAPI(`/summary/category/${encodeURIComponent(category)}`),

  // 프론트엔드 표시용 요약
  getForDisplay: () => fetchAPI('/summary/for-display'),

  // 요약 통계
  getStats: () => fetchAPI('/summary/stats'),

  // 요약 생성 트리거
  generate: () => fetchAPI('/summary/generate', { method: 'POST' }),

  // 특정 카테고리 재생성
  regenerate: (category) => fetchAPI(`/summary/regenerate/${encodeURIComponent(category)}`, { method: 'POST' }),
};

/**
 * 헬스 체크
 */
export const healthAPI = {
  check: () => fetchAPI('/health'),
};

/**
 * 관리자 API
 */
export const adminAPI = {
  getStatus: () => fetchAPI('/admin/status'),
  getConfig: () => fetchAPI('/admin/config'),
  runPipeline: (options = {}) => fetchAPI('/admin/pipeline/run', {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  getPipelineStatus: () => fetchAPI('/admin/pipeline/status'),
};

export default {
  news: newsAPI,
  summary: summaryAPI,
  health: healthAPI,
  admin: adminAPI,
};
