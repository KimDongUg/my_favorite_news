import { sources } from '../config/sources.js';
import { crawlMultipleRssFeeds } from './rssCrawler.js';
import { delay } from '../utils/helpers.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 크롤링된 데이터 저장소
let crawledData = {
  lastUpdated: null,
  categories: {}
};

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, '../../data/crawled-news.json');

/**
 * 모든 카테고리 크롤링
 */
export async function crawlAllCategories() {
  console.log('\n========================================');
  console.log('[Crawler] 전체 크롤링 시작:', new Date().toLocaleString());
  console.log('========================================\n');

  const categories = Object.keys(sources);
  const results = {};

  for (const category of categories) {
    const categorySources = sources[category];

    if (!categorySources || categorySources.length === 0) {
      console.log(`[Crawler] ${category}: 소스 없음, 스킵`);
      continue;
    }

    try {
      const items = await crawlMultipleRssFeeds(categorySources, category);
      results[category] = items;
      console.log(`[Crawler] ${category}: ${items.length}개 아이템 수집 완료`);

      // 카테고리 간 딜레이
      await delay(1000);

    } catch (error) {
      console.error(`[Crawler] ${category} 크롤링 실패:`, error.message);
      results[category] = [];
    }
  }

  // 결과 저장
  crawledData = {
    lastUpdated: new Date().toISOString(),
    categories: results
  };

  // 파일로 저장
  await saveToFile();

  console.log('\n========================================');
  console.log('[Crawler] 전체 크롤링 완료:', new Date().toLocaleString());
  console.log('========================================\n');

  return crawledData;
}

/**
 * 특정 카테고리만 크롤링
 * @param {string} category - 카테고리명
 */
export async function crawlCategory(category) {
  const categorySources = sources[category];

  if (!categorySources) {
    throw new Error(`카테고리를 찾을 수 없습니다: ${category}`);
  }

  const items = await crawlMultipleRssFeeds(categorySources, category);

  crawledData.categories[category] = items;
  crawledData.lastUpdated = new Date().toISOString();

  await saveToFile();

  return items;
}

/**
 * 크롤링 데이터 가져오기
 */
export function getCrawledData() {
  return crawledData;
}

/**
 * 특정 카테고리 데이터 가져오기
 * @param {string} category - 카테고리명
 */
export function getCategoryData(category) {
  return crawledData.categories[category] || [];
}

/**
 * 파일에 저장
 */
async function saveToFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(crawledData, null, 2), 'utf-8');
    console.log('[Crawler] 데이터 파일 저장 완료');
  } catch (error) {
    console.error('[Crawler] 파일 저장 실패:', error.message);
  }
}

/**
 * 파일에서 로드
 */
export async function loadFromFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    crawledData = JSON.parse(data);
    console.log('[Crawler] 기존 데이터 로드 완료');
    return crawledData;
  } catch (error) {
    console.log('[Crawler] 기존 데이터 없음, 새로 시작');
    return null;
  }
}

/**
 * 통계 정보
 */
export function getStats() {
  const stats = {
    lastUpdated: crawledData.lastUpdated,
    totalItems: 0,
    byCategory: {}
  };

  for (const [category, items] of Object.entries(crawledData.categories)) {
    const count = items.length;
    stats.byCategory[category] = count;
    stats.totalItems += count;
  }

  return stats;
}
