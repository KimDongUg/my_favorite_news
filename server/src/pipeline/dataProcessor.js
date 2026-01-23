/**
 * 데이터 처리 파이프라인
 * 크롤링 → 그룹핑 → AI 요약 → 검증 → 저장
 */

import { crawlAllCategories, getCrawledData } from '../crawlers/crawlerManager.js';
import { generateAllSummaries, getSummaryStats } from '../ai/summaryManager.js';

// 파이프라인 상태
let pipelineStatus = {
  isRunning: false,
  lastRun: null,
  lastResult: null,
  history: []
};

/**
 * 전체 파이프라인 실행
 * @param {Object} options - 실행 옵션
 * @returns {Promise<Object>} 실행 결과
 */
export async function runPipeline(options = {}) {
  const {
    categories = null,  // 특정 카테고리만 처리 (null = 전체)
    skipCrawl = false,  // 크롤링 스킵 (기존 데이터 사용)
    force = false       // 강제 실행 (실행 중이어도)
  } = options;

  // 이미 실행 중인지 확인
  if (pipelineStatus.isRunning && !force) {
    return {
      success: false,
      error: '파이프라인이 이미 실행 중입니다',
      status: pipelineStatus
    };
  }

  const startTime = Date.now();
  pipelineStatus.isRunning = true;

  const result = {
    success: true,
    startTime: new Date().toISOString(),
    steps: [],
    stats: {}
  };

  try {
    // 1단계: 크롤링
    if (!skipCrawl) {
      console.log('[Pipeline] 1단계: 크롤링 시작');
      const crawlStart = Date.now();

      await crawlAllCategories();

      result.steps.push({
        step: 'crawl',
        status: 'completed',
        duration: Date.now() - crawlStart
      });
    } else {
      console.log('[Pipeline] 1단계: 크롤링 스킵 (기존 데이터 사용)');
      result.steps.push({
        step: 'crawl',
        status: 'skipped'
      });
    }

    // 2단계: 데이터 검증
    console.log('[Pipeline] 2단계: 데이터 검증');
    const crawledData = getCrawledData();

    if (!crawledData.categories || Object.keys(crawledData.categories).length === 0) {
      throw new Error('크롤링된 데이터가 없습니다');
    }

    const categoryCount = Object.keys(crawledData.categories).length;
    const totalItems = Object.values(crawledData.categories)
      .reduce((sum, items) => sum + items.length, 0);

    result.steps.push({
      step: 'validate',
      status: 'completed',
      categoryCount,
      totalItems
    });

    // 3단계: AI 요약 생성
    console.log('[Pipeline] 3단계: AI 요약 생성');
    const summaryStart = Date.now();

    // 특정 카테고리만 필터링
    let dataToProcess = crawledData;
    if (categories && Array.isArray(categories)) {
      dataToProcess = {
        ...crawledData,
        categories: Object.fromEntries(
          Object.entries(crawledData.categories)
            .filter(([cat]) => categories.includes(cat))
        )
      };
    }

    await generateAllSummaries(dataToProcess);

    result.steps.push({
      step: 'summarize',
      status: 'completed',
      duration: Date.now() - summaryStart
    });

    // 4단계: 결과 집계
    console.log('[Pipeline] 4단계: 결과 집계');
    const summaryStats = getSummaryStats();

    result.stats = {
      crawledCategories: categoryCount,
      crawledItems: totalItems,
      summariesGenerated: summaryStats.total,
      validationPassed: summaryStats.validated,
      validationFailed: summaryStats.failed,
      aiGenerated: summaryStats.aiGenerated,
      fallback: summaryStats.fallback
    };

    result.steps.push({
      step: 'aggregate',
      status: 'completed'
    });

    result.endTime = new Date().toISOString();
    result.totalDuration = Date.now() - startTime;

    console.log(`[Pipeline] 완료 (${result.totalDuration}ms)`);

  } catch (error) {
    result.success = false;
    result.error = error.message;
    result.endTime = new Date().toISOString();
    result.totalDuration = Date.now() - startTime;

    console.error('[Pipeline] 실패:', error.message);
  } finally {
    pipelineStatus.isRunning = false;
    pipelineStatus.lastRun = new Date().toISOString();
    pipelineStatus.lastResult = result;

    // 히스토리에 추가 (최대 10개 유지)
    pipelineStatus.history.unshift({
      timestamp: result.startTime,
      success: result.success,
      duration: result.totalDuration,
      stats: result.stats
    });
    if (pipelineStatus.history.length > 10) {
      pipelineStatus.history.pop();
    }
  }

  return result;
}

/**
 * 파이프라인 상태 조회
 */
export function getPipelineStatus() {
  return { ...pipelineStatus };
}

/**
 * 파이프라인 강제 중지 (현재는 플래그만 설정)
 */
export function stopPipeline() {
  if (pipelineStatus.isRunning) {
    console.log('[Pipeline] 중지 요청됨');
    // 실제 중지 로직은 각 단계에서 isRunning 체크로 구현
    pipelineStatus.isRunning = false;
    return { success: true, message: '파이프라인 중지됨' };
  }
  return { success: false, message: '실행 중인 파이프라인이 없습니다' };
}

/**
 * 특정 카테고리만 재처리
 */
export async function reprocessCategory(category) {
  console.log(`[Pipeline] ${category} 카테고리 재처리`);

  return runPipeline({
    categories: [category],
    skipCrawl: false
  });
}

export default {
  runPipeline,
  getPipelineStatus,
  stopPipeline,
  reprocessCategory
};
