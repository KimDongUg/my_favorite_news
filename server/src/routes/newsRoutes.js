import express from 'express';
import {
  getCrawledData,
  getCategoryData,
  crawlAllCategories,
  crawlCategory,
  getStats
} from '../crawlers/crawlerManager.js';

const router = express.Router();

/**
 * GET /api/news
 * 전체 뉴스 데이터 조회
 */
router.get('/', (req, res) => {
  try {
    const data = getCrawledData();
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
 * GET /api/news/category/:category
 * 특정 카테고리 뉴스 조회
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const items = getCategoryData(decodeURIComponent(category));

    res.json({
      success: true,
      category,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/news/stats
 * 크롤링 통계 조회
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getStats();
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
 * POST /api/news/crawl
 * 수동 크롤링 실행
 */
router.post('/crawl', async (req, res) => {
  try {
    console.log('[API] 수동 크롤링 요청');
    const data = await crawlAllCategories();

    res.json({
      success: true,
      message: '크롤링 완료',
      stats: getStats()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/news/crawl/:category
 * 특정 카테고리만 크롤링
 */
router.post('/crawl/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`[API] ${category} 크롤링 요청`);

    const items = await crawlCategory(decodeURIComponent(category));

    res.json({
      success: true,
      message: `${category} 크롤링 완료`,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
