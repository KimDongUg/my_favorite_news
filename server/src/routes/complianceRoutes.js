import express from 'express';
import {
  CopyrightComplianceChecker,
  getViolationLogs,
  getComplianceStats,
  auditAllSummaries,
  getAuditHistory,
  clearViolationLogs
} from '../compliance/complianceChecker.js';
import { getAllSummaries } from '../ai/summaryManager.js';
import { getCrawledData } from '../crawlers/crawlerManager.js';
import { copyrightPolicy, legalPages, complianceChecklist } from '../legal/policies.js';
import { regenerateSummary } from '../ai/summaryManager.js';

const router = express.Router();

/**
 * GET /api/compliance/stats
 * 컴플라이언스 통계
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getComplianceStats();
    const summaryData = getAllSummaries();

    const total = summaryData.summaries?.length || 0;
    const passed = summaryData.summaries?.filter(s => s.validationPassed).length || 0;
    const failed = total - passed;

    res.json({
      success: true,
      stats: {
        totalSummaries: total,
        passedValidation: passed,
        failedValidation: failed,
        passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : 'N/A',
        violations: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/compliance/violations
 * 위반 목록 조회
 */
router.get('/violations', (req, res) => {
  try {
    const { limit = 50, category, since } = req.query;

    const logs = getViolationLogs({
      limit: parseInt(limit),
      category,
      since
    });

    // 현재 검증 실패한 요약 목록도 포함
    const summaryData = getAllSummaries();
    const failedSummaries = summaryData.summaries
      ?.filter(s => !s.validationPassed)
      .map(s => ({
        id: s.id,
        category: s.category,
        aiTitle: s.aiTitle,
        validationDetails: s.validationDetails,
        generatedAt: s.generatedAt
      })) || [];

    res.json({
      success: true,
      total: logs.length + failedSummaries.length,
      violations: logs,
      failedSummaries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/compliance/audit
 * 전체 감사 실행
 */
router.post('/audit', async (req, res) => {
  try {
    console.log('[Compliance] 전체 감사 시작');

    const summaryData = getAllSummaries();
    const crawledData = getCrawledData();

    if (!summaryData.summaries || summaryData.summaries.length === 0) {
      return res.status(400).json({
        success: false,
        error: '감사할 요약 데이터가 없습니다'
      });
    }

    const result = await auditAllSummaries(
      summaryData.summaries,
      crawledData.categories || {}
    );

    console.log(`[Compliance] 감사 완료: ${result.passed}/${result.total} 통과`);

    res.json({
      success: true,
      message: '감사 완료',
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
 * GET /api/compliance/audit/history
 * 감사 이력 조회
 */
router.get('/audit/history', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const history = getAuditHistory(parseInt(limit));

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/compliance/validate/:category
 * 특정 카테고리 검증
 */
router.post('/validate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);

    const summaryData = getAllSummaries();
    const summary = summaryData.summaries?.find(s => s.category === decodedCategory);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: '해당 카테고리 요약을 찾을 수 없습니다'
      });
    }

    const crawledData = getCrawledData();
    const articles = crawledData.categories?.[decodedCategory] || [];

    const checker = new CopyrightComplianceChecker();
    const result = await checker.validate(summary, articles);

    res.json({
      success: true,
      category: decodedCategory,
      validation: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/compliance/regenerate/:category
 * 위반 요약 재생성
 */
router.post('/regenerate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category);

    console.log(`[Compliance] ${decodedCategory} 재생성 요청`);

    const crawledData = getCrawledData();
    const articles = crawledData.categories?.[decodedCategory];

    if (!articles || articles.length === 0) {
      return res.status(400).json({
        success: false,
        error: '해당 카테고리의 크롤링 데이터가 없습니다'
      });
    }

    const newSummary = await regenerateSummary(decodedCategory, articles);

    if (newSummary && newSummary.validationPassed) {
      res.json({
        success: true,
        message: '재생성 완료',
        summary: newSummary
      });
    } else {
      res.status(400).json({
        success: false,
        error: '검증을 통과하는 요약 생성 실패'
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
 * DELETE /api/compliance/violations
 * 위반 로그 초기화
 */
router.delete('/violations', (req, res) => {
  try {
    clearViolationLogs();
    res.json({
      success: true,
      message: '위반 로그 초기화 완료'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/compliance/policy
 * 저작권 정책 조회
 */
router.get('/policy', (req, res) => {
  try {
    res.json({
      success: true,
      policy: copyrightPolicy,
      checklist: complianceChecklist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/compliance/checklist
 * 컴플라이언스 체크리스트 상태
 */
router.get('/checklist', (req, res) => {
  try {
    const summaryData = getAllSummaries();
    const total = summaryData.summaries?.length || 0;
    const validated = summaryData.summaries?.filter(s => s.validationPassed).length || 0;
    const withSources = summaryData.summaries?.filter(s => s.sources?.length > 0).length || 0;

    const status = {
      content: {
        no_verbatim_copy: validated === total,
        no_structure_copy: validated === total,
        multi_source_synthesis: withSources === total,
        fact_based: true,
        no_long_quotes: validated === total
      },
      technical: {
        auto_similarity_check: true,
        ai_rewriting_validation: true,
        realtime_monitoring: true
      },
      legal: {
        source_links: withSources === total,
        attribution: withSources === total,
        disclaimer: true,
        terms_of_service: true
      },
      operational: {
        periodic_audit: true,
        immediate_removal: true,
        copyright_response: true
      }
    };

    const allPassed = Object.values(status).every(category =>
      Object.values(category).every(v => v === true)
    );

    res.json({
      success: true,
      allPassed,
      checklist: complianceChecklist,
      status,
      summary: {
        total,
        validated,
        withSources
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/legal/:page
 * 법적 페이지 콘텐츠
 */
router.get('/legal/:page', (req, res) => {
  try {
    const { page } = req.params;
    const pageContent = legalPages[page];

    if (!pageContent) {
      return res.status(404).json({
        success: false,
        error: '페이지를 찾을 수 없습니다',
        availablePages: Object.keys(legalPages)
      });
    }

    res.json({
      success: true,
      page: pageContent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
