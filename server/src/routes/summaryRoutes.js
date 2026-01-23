import express from 'express';
import {
  getAllSummaries,
  getSummaryByCategory,
  getValidatedSummaries,
  getSummaryStats,
  generateAllSummaries,
  regenerateSummary
} from '../ai/summaryManager.js';
import { getCrawledData } from '../crawlers/crawlerManager.js';

const router = express.Router();

/**
 * GET /api/summary
 * 모든 요약 조회
 */
router.get('/', (req, res) => {
  try {
    const { validated } = req.query;

    const data = validated === 'true'
      ? getValidatedSummaries()
      : getAllSummaries();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/summary/category/:category
 * 특정 카테고리 요약 조회
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const summary = getSummaryByCategory(decodeURIComponent(category));

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: '해당 카테고리 요약을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/summary/stats
 * 요약 통계 조회
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getSummaryStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/summary/generate
 * 모든 요약 생성
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('[API] 요약 생성 요청');

    const crawledData = getCrawledData();

    if (!crawledData.categories || Object.keys(crawledData.categories).length === 0) {
      return res.status(400).json({
        success: false,
        error: '크롤링된 데이터가 없습니다. 먼저 크롤링을 실행하세요.'
      });
    }

    const data = await generateAllSummaries(crawledData);

    res.json({
      success: true,
      message: '요약 생성 완료',
      stats: getSummaryStats()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/summary/regenerate/:category
 * 특정 카테고리 요약 재생성
 */
router.post('/regenerate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);

    console.log(`[API] ${decodedCategory} 요약 재생성 요청`);

    const crawledData = getCrawledData();
    const articles = crawledData.categories[decodedCategory];

    if (!articles || articles.length === 0) {
      return res.status(400).json({
        success: false,
        error: '해당 카테고리의 크롤링된 데이터가 없습니다'
      });
    }

    const summary = await regenerateSummary(decodedCategory, articles);

    if (summary) {
      res.json({
        success: true,
        message: '요약 재생성 완료',
        summary
      });
    } else {
      res.status(400).json({
        success: false,
        error: '저작권 검증을 통과하는 요약을 생성하지 못했습니다'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/summary/for-display
 * 프론트엔드 표시용 요약 (간소화된 형식)
 */
router.get('/for-display', (req, res) => {
  try {
    const data = getValidatedSummaries();

    // 프론트엔드용 간소화된 형식
    const displayData = data.summaries.map(s => ({
      category: s.category,
      title: s.aiTitle,
      summary: s.aiSummary,
      sourceCount: s.sources?.length || 0,
      mainSource: s.sources?.[0] || null,
      generatedAt: s.generatedAt
    }));

    res.json({
      success: true,
      lastUpdated: data.lastUpdated,
      summaries: displayData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
