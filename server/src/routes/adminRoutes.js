import express from 'express';
import { runPipeline, getPipelineStatus, stopPipeline, reprocessCategory } from '../pipeline/dataProcessor.js';
import { getDBStats, getPipelineLogs, cleanupOldData } from '../db/database.js';
import { getStats as getCrawlerStats } from '../crawlers/crawlerManager.js';
import { getSummaryStats } from '../ai/summaryManager.js';

const router = express.Router();

/**
 * GET /api/admin/status
 * 전체 시스템 상태 조회
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      pipeline: getPipelineStatus(),
      crawler: getCrawlerStats(),
      summary: getSummaryStats(),
      database: getDBStats()
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/pipeline/run
 * 파이프라인 수동 실행
 */
router.post('/pipeline/run', async (req, res) => {
  try {
    const { categories, skipCrawl, force } = req.body;

    console.log('[Admin] 파이프라인 수동 실행 요청');

    const result = await runPipeline({
      categories,
      skipCrawl: skipCrawl === true,
      force: force === true
    });

    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/pipeline/stop
 * 파이프라인 중지
 */
router.post('/pipeline/stop', (req, res) => {
  try {
    const result = stopPipeline();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/pipeline/status
 * 파이프라인 상태 조회
 */
router.get('/pipeline/status', (req, res) => {
  try {
    const status = getPipelineStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/pipeline/reprocess/:category
 * 특정 카테고리 재처리
 */
router.post('/pipeline/reprocess/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);

    console.log(`[Admin] ${decodedCategory} 카테고리 재처리 요청`);

    const result = await reprocessCategory(decodedCategory);

    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/logs
 * 파이프라인 실행 로그 조회
 */
router.get('/logs', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = getPipelineLogs(parseInt(limit));

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/cleanup
 * 오래된 데이터 정리
 */
router.post('/cleanup', (req, res) => {
  try {
    const { daysToKeep = 7 } = req.body;

    console.log(`[Admin] 데이터 정리 요청 (${daysToKeep}일 이전 삭제)`);

    const result = cleanupOldData(parseInt(daysToKeep));

    res.json({
      success: true,
      message: '데이터 정리 완료',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/db/stats
 * 데이터베이스 통계
 */
router.get('/db/stats', (req, res) => {
  try {
    const stats = getDBStats();
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
 * POST /api/admin/crawl
 * 크롤링만 실행 (요약 제외)
 */
router.post('/crawl', async (req, res) => {
  try {
    console.log('[Admin] 크롤링 수동 실행 요청');

    const result = await runPipeline({
      skipCrawl: false
    });

    res.json({
      success: result.success,
      message: '크롤링 완료',
      stats: result.stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/config
 * 현재 설정 조회
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development',
        crawlInterval: '30분',
        categories: ['뉴스', '스포츠', '연예', '반려동물', 'IT', '건강', '여행', '음식', '경제', '교육']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
