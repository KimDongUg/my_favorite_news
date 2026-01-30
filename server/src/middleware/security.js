/**
 * 보안 미들웨어
 * Helmet, Rate Limiting, 보안 헤더
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Helmet 보안 헤더 설정
 * CORS와 충돌하지 않도록 설정
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "https://accounts.google.com",
        "https://myfavoritenews.vercel.app",
        "https://*.vercel.app"
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // 외부 리소스 허용
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false, // CORS 허용을 위해 비활성화
});

/**
 * 일반 API Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100번 요청
  message: {
    error: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 헬스체크는 제외
    return req.path === '/api/health';
  }
});

/**
 * 로그인 Rate Limiter (더 엄격함)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번 시도
  message: {
    error: '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해주세요.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 검증 비활성화 (로컬 개발 환경)
  validate: false
});

/**
 * 회원가입 Rate Limiter
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // 최대 5번
  message: {
    error: '너무 많은 회원가입 시도가 있었습니다. 1시간 후 다시 시도해주세요.',
    code: 'SIGNUP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 매직 링크 / 비밀번호 재설정 Rate Limiter
 */
export const emailActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // 최대 5번
  message: {
    error: '너무 많은 이메일 요청이 있었습니다. 1시간 후 다시 시도해주세요.',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 검증 비활성화 (로컬 개발 환경)
  validate: false
});

/**
 * API Rate Limiter (인증된 사용자)
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 60, // 분당 60번
  message: {
    error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 보안 헤더 추가 미들웨어
 */
export function addSecurityHeaders(req, res, next) {
  // XSS 방지
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 권한 정책
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

/**
 * SQL Injection 방지 (기본 필터링)
 */
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // 기본적인 SQL injection 패턴 제거
      return obj
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  // body, query, params 정화
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
}

/**
 * 의심스러운 요청 로깅
 */
export function suspiciousRequestLogger(req, res, next) {
  const suspiciousPatterns = [
    /(<script|javascript:|data:text\/html)/i,
    /(union\s+select|insert\s+into|drop\s+table)/i,
    /(\.\.\/|\.\.\\)/,
    /(\%00|\x00)/,
  ];

  const fullUrl = `${req.method} ${req.originalUrl}`;
  const body = JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      console.warn(`[Security] 의심스러운 요청 감지: ${req.ip} - ${fullUrl}`);
      console.warn(`[Security] Body: ${body.substring(0, 200)}`);
      break;
    }
  }

  next();
}

export default {
  helmetMiddleware,
  generalLimiter,
  loginLimiter,
  signupLimiter,
  emailActionLimiter,
  apiLimiter,
  addSecurityHeaders,
  sanitizeInput,
  suspiciousRequestLogger,
};
