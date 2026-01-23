import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCategorySummaries } from './summarizer.js';
import { saveSummaries as saveToDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 요약 데이터 저장소
let summaryData = {
  lastUpdated: null,
  summaries: []
};

// 데이터 파일 경로
const SUMMARY_FILE = path.join(__dirname, '../../data/summaries.json');

/**
 * 모든 카테고리 요약 생성
 * @param {Object} crawledData - 크롤링된 데이터
 */
export async function generateAllSummaries(crawledData) {
  console.log('\n========================================');
  console.log('[Summary] AI 요약 생성 시작:', new Date().toLocaleString());
  console.log('========================================\n');

  try {
    const summaries = await generateCategorySummaries(crawledData.categories);

    summaryData = {
      lastUpdated: new Date().toISOString(),
      summaries
    };

    // 파일 저장
    await saveToFile();

    console.log(`[Summary] ${summaries.length}개 카테고리 요약 생성 완료`);

    // 검증 통과/실패 통계
    const passed = summaries.filter(s => s.validationPassed).length;
    const failed = summaries.length - passed;
    console.log(`[Summary] 저작권 검증 - 통과: ${passed}, 실패: ${failed}`);

    return summaryData;

  } catch (error) {
    console.error('[Summary] 요약 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 모든 요약 가져오기
 */
export function getAllSummaries() {
  return summaryData;
}

/**
 * 카테고리별 요약 가져오기
 * @param {string} category - 카테고리명
 */
export function getSummaryByCategory(category) {
  return summaryData.summaries.find(s => s.category === category) || null;
}

/**
 * 검증 통과한 요약만 가져오기
 */
export function getValidatedSummaries() {
  return {
    ...summaryData,
    summaries: summaryData.summaries.filter(s => s.validationPassed)
  };
}

/**
 * 요약 통계
 */
export function getSummaryStats() {
  const total = summaryData.summaries.length;
  const validated = summaryData.summaries.filter(s => s.validationPassed).length;
  const fallback = summaryData.summaries.filter(s => s.isFallback).length;

  return {
    lastUpdated: summaryData.lastUpdated,
    total,
    validated,
    failed: total - validated,
    fallback,
    aiGenerated: total - fallback,
    categories: summaryData.summaries.map(s => ({
      category: s.category,
      validated: s.validationPassed,
      sourceCount: s.sources?.length || 0
    }))
  };
}

/**
 * 파일 및 데이터베이스에 저장
 */
async function saveToFile() {
  try {
    // JSON 파일 저장
    const dir = path.dirname(SUMMARY_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SUMMARY_FILE, JSON.stringify(summaryData, null, 2), 'utf-8');
    console.log('[Summary] 데이터 파일 저장 완료');

    // SQLite 데이터베이스 저장
    if (summaryData.summaries.length > 0) {
      saveToDatabase(summaryData.summaries);
    }
  } catch (error) {
    console.error('[Summary] 저장 실패:', error.message);
  }
}

/**
 * 파일에서 로드
 */
export async function loadSummariesFromFile() {
  try {
    const data = await fs.readFile(SUMMARY_FILE, 'utf-8');
    summaryData = JSON.parse(data);
    console.log('[Summary] 기존 요약 데이터 로드 완료');
    return summaryData;
  } catch (error) {
    console.log('[Summary] 기존 요약 데이터 없음');
    return null;
  }
}

/**
 * 특정 요약 재생성
 * @param {string} category - 카테고리
 * @param {Array} articles - 기사 배열
 */
export async function regenerateSummary(category, articles) {
  const { generateSummary } = await import('./summarizer.js');
  const { validateSummary } = await import('./copyrightValidator.js');

  // 최대 3번 재시도
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[Summary] ${category} 재생성 시도 ${attempt}/3`);

    const summary = await generateSummary(articles, category);
    const validation = validateSummary(summary, articles);

    summary.validationPassed = validation.isSafe;
    summary.validationDetails = validation.checks;

    if (validation.isSafe) {
      // 기존 요약 교체
      const index = summaryData.summaries.findIndex(s => s.category === category);
      if (index >= 0) {
        summaryData.summaries[index] = summary;
      } else {
        summaryData.summaries.push(summary);
      }

      summaryData.lastUpdated = new Date().toISOString();
      await saveToFile();

      return summary;
    }

    // 재시도 전 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`[Summary] ${category} 검증 통과 실패 - 원본 유지`);
  return null;
}
