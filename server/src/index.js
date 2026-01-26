// 🔥 환경 변수를 가장 먼저 로드 (ES 모듈에서 중요!)
import 'dotenv/config';

// 환경 변수 로드 확인 (서버 시작 시 출력)
console.log('=== 환경 변수 로드 확인 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('KAKAO_CLIENT_ID:', process.env.KAKAO_CLIENT_ID || '❌ 없음');
console.log('KAKAO_CLIENT_SECRET:', process.env.KAKAO_CLIENT_SECRET ? `있음 (길이: ${process.env.KAKAO_CLIENT_SECRET.length})` : '❌ 없음');
console.log('KAKAO_CALLBACK_URL:', process.env.KAKAO_CALLBACK_URL || '❌ 없음');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ 없음');
console.log('===========================');

import express from 'express';
import cors from 'cors';
import passport from 'passport';

// 라우트
import newsRoutes from './routes/newsRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

// 크롤러 & 요약
import { loadFromFile, getCrawledData } from './crawlers/crawlerManager.js';
import { loadSummariesFromFile, getSummaryStats, getAllSummaries } from './ai/summaryManager.js';

// 파이프라인 & 스케줄러
import { runPipeline, getPipelineStatus } from './pipeline/dataProcessor.js';
import { initScheduler, getScheduleStatus, addSchedule } from './scheduler/cronManager.js';

// 데이터베이스
import { initDatabase, getDBStats, getDatabase } from './db/database.js';

// 인증
import { initializePassport } from './auth/passport.js';
import * as tokenService from './auth/tokenService.js';
import * as User from './models/User.js';
import { createAuthTables } from './db/authSchema.js';
import { createFeedbackTables } from './db/feedbackSchema.js';
import { initEmailService } from './services/emailService.js';

// 미들웨어
import {
  requestLogger,
  errorLogger,
  errorHandler,
  notFoundHandler
} from './middleware/logger.js';
import { applyCopyrightSafety, addCopyrightHeaders } from './middleware/copyrightSafety.js';

// 보안 미들웨어
import {
  helmetMiddleware,
  generalLimiter,
  addSecurityHeaders,
  suspiciousRequestLogger
} from './middleware/security.js';

// 세션 관리
import * as sessionManager from './services/sessionManager.js';

// 컴플라이언스
import { auditAllSummaries, getComplianceStats } from './compliance/complianceChecker.js';

// 환경변수는 이미 맨 위에서 로드됨 (import 'dotenv/config')

const app = express();
const PORT = process.env.PORT || 3001;

// 보안 미들웨어 (가장 먼저 적용)
app.use(helmetMiddleware);
app.use(addSecurityHeaders);

// CORS 설정 - 모든 Vercel 도메인 허용
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우 (같은 origin, Postman 등) 허용
    if (!origin) return callback(null, true);

    // localhost 개발 환경 모두 허용
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    // 모든 vercel.app 도메인 허용 (프로덕션 + 프리뷰)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // FRONTEND_URL 허용
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    // 그 외는 로그만 남기고 허용 (디버깅용)
    console.log(`[CORS] 알 수 없는 origin (허용): ${origin}`);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// OPTIONS 프리플라이트 요청 처리
app.options('*', cors());

// 기본 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 & 보안 검사
app.use(requestLogger);
app.use(suspiciousRequestLogger);
app.use(addCopyrightHeaders);

// Rate Limiting (일반)
app.use(generalLimiter);

// Passport 초기화
app.use(passport.initialize());

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);  // OAuth 콜백용 (/auth/google/callback)
app.use('/api/news', newsRoutes);
app.use('/api/summary', applyCopyrightSafety, summaryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/feedback', feedbackRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
  const complianceStats = getComplianceStats();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pipeline: getPipelineStatus(),
    summary: getSummaryStats(),
    database: getDBStats(),
    scheduler: getScheduleStatus(),
    compliance: complianceStats,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// 루트 경로 - API 문서
app.get('/', (req, res) => {
  res.json({
    name: 'MyNews API Server',
    version: '5.0.0',
    features: [
      'RSS Crawling',
      'AI Summary',
      'Copyright Validation',
      'SQLite Storage',
      'Pipeline Automation',
      'Compliance Monitoring',
      'User Authentication',
      'OAuth Social Login',
      'Magic Link Passwordless',
      'Security Hardening',
      'Rate Limiting',
      'Session Management'
    ],
    security: {
      helmet: 'enabled',
      rateLimiting: 'enabled',
      cors: 'configured',
      jwt: 'enabled',
      passwordPolicy: 'enforced'
    },
    endpoints: {
      // 헬스
      health: 'GET /api/health',

      // 인증 API
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      logoutAll: 'POST /api/auth/logout-all',
      refreshToken: 'POST /api/auth/refresh',
      magicLink: 'POST /api/auth/magic-link',
      magicLinkVerify: 'POST /api/auth/magic-link/verify',
      googleOAuth: 'GET /api/auth/google',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password',
      currentUser: 'GET /api/auth/me',
      updateUser: 'PUT /api/auth/me',
      updatePreferences: 'PUT /api/auth/preferences',
      userSessions: 'GET /api/auth/sessions',
      changePassword: 'PUT /api/auth/change-password',
      connectedProviders: 'GET /api/auth/providers',

      // 뉴스 API
      allNews: 'GET /api/news',
      categoryNews: 'GET /api/news/category/:category',
      newsStats: 'GET /api/news/stats',
      manualCrawl: 'POST /api/news/crawl',

      // 요약 API
      allSummaries: 'GET /api/summary',
      categorySummary: 'GET /api/summary/category/:category',
      summaryStats: 'GET /api/summary/stats',
      generateSummaries: 'POST /api/summary/generate',
      regenerateSummary: 'POST /api/summary/regenerate/:category',
      displaySummaries: 'GET /api/summary/for-display',

      // 관리자 API
      adminStatus: 'GET /api/admin/status',
      adminConfig: 'GET /api/admin/config',
      pipelineRun: 'POST /api/admin/pipeline/run',
      pipelineStop: 'POST /api/admin/pipeline/stop',
      pipelineStatus: 'GET /api/admin/pipeline/status',
      pipelineReprocess: 'POST /api/admin/pipeline/reprocess/:category',
      adminLogs: 'GET /api/admin/logs',
      adminCleanup: 'POST /api/admin/cleanup',
      dbStats: 'GET /api/admin/db/stats',

      // 컴플라이언스 API
      complianceStats: 'GET /api/compliance/stats',
      complianceViolations: 'GET /api/compliance/violations',
      complianceAudit: 'POST /api/compliance/audit',
      auditHistory: 'GET /api/compliance/audit/history',
      validateCategory: 'POST /api/compliance/validate/:category',
      regenerateViolation: 'POST /api/compliance/regenerate/:category',
      compliancePolicy: 'GET /api/compliance/policy',
      complianceChecklist: 'GET /api/compliance/checklist',
      legalPage: 'GET /api/compliance/legal/:page'
    }
  });
});

// 에러 핸들링
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

/**
 * 주간 감사 실행
 */
async function runWeeklyAudit() {
  console.log('[Audit] 주간 컴플라이언스 감사 시작');

  try {
    const summaryData = getAllSummaries();
    const crawledData = getCrawledData();

    if (summaryData.summaries?.length > 0) {
      const result = await auditAllSummaries(
        summaryData.summaries,
        crawledData.categories || {}
      );

      console.log('[Audit] 감사 완료:');
      console.log(`  - 전체: ${result.total}`);
      console.log(`  - 통과: ${result.passed}`);
      console.log(`  - 실패: ${result.failed}`);

      if (result.violations.length > 0) {
        console.log('[Audit] 위반 사항:');
        result.violations.forEach(v => {
          console.log(`  - ${v.category}: ${v.violations.map(vv => vv.type).join(', ')}`);
        });
      }
    }
  } catch (error) {
    console.error('[Audit] 감사 실패:', error.message);
  }
}

/**
 * 만료된 세션/토큰 정리
 */
function cleanupExpiredTokens() {
  console.log('[Auth] 만료된 토큰 정리 시작');
  try {
    const sessionCount = tokenService.cleanupExpiredSessions();
    tokenService.cleanupExpiredMagicLinks();
    tokenService.cleanupExpiredEmailVerifications();
    console.log(`[Auth] 정리 완료 (세션: ${sessionCount}개)`);
  } catch (error) {
    console.error('[Auth] 토큰 정리 실패:', error.message);
  }
}

// 서버 시작
async function startServer() {
  try {
    console.log('\n========================================');
    console.log('  MyNews API Server v5.0');
    console.log('  with Security & Auth & Compliance');
    console.log('========================================\n');

    // 1. 데이터베이스 초기화 (PostgreSQL)
    console.log('[Server] 데이터베이스 초기화...');
    await initDatabase();

    // 2. 인증 테이블 생성 및 서비스 초기화
    console.log('[Server] 인증 시스템 초기화...');
    await createAuthTables();

    // 3. 게시판 테이블 생성
    console.log('[Server] 게시판 테이블 초기화...');
    await createFeedbackTables();

    // PostgreSQL은 database.js의 query 함수를 사용하므로 setDatabase는 호환성 유지용
    tokenService.setDatabase(null);
    User.setDatabase(null);
    sessionManager.setDatabase(null);

    // 3. Passport 초기화
    initializePassport();

    // 4. 이메일 서비스 초기화
    console.log('[Server] 이메일 서비스 초기화...');
    initEmailService();

    // 6. 기존 데이터 로드 (JSON 파일에서)
    console.log('[Server] 기존 데이터 로드...');
    await loadFromFile();
    await loadSummariesFromFile();

    // 7. 스케줄러 초기화
    console.log('[Server] 스케줄러 초기화...');
    initScheduler();

    // 8. 주간 감사 스케줄 추가 (매주 일요일 자정)
    addSchedule('weeklyAudit', '0 0 * * 0', runWeeklyAudit, '주간 컴플라이언스 감사');

    // 9. 토큰 정리 스케줄 추가 (매시간)
    addSchedule('tokenCleanup', '0 * * * *', cleanupExpiredTokens, '만료된 토큰 정리');

    // 10. 서버 시작
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('  Server Ready!');
      console.log(`  Port: ${PORT}`);
      console.log(`  Time: ${new Date().toLocaleString()}`);
      console.log(`  API Key: ${process.env.ANTHROPIC_API_KEY ? '설정됨 ✓' : '없음 (기본 요약 사용)'}`);
      console.log(`  Auth: 활성화됨 ✓`);
      console.log('========================================\n');

      // 9. 초기 파이프라인 실행 (서버 시작 후 5초 뒤)
      setTimeout(async () => {
        console.log('[Server] 초기 파이프라인 실행...');
        await runPipeline();
      }, 5000);
    });

  } catch (error) {
    console.error('[Server] 시작 실패:', error);
    process.exit(1);
  }
}

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n[Server] 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] 종료 중...');
  process.exit(0);
});

startServer();
