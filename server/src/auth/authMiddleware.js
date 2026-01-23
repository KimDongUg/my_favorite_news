/**
 * 인증 미들웨어 (PostgreSQL)
 * JWT 토큰 검증 및 권한 확인
 */

import { verifyAccessToken } from './tokenService.js';
import * as User from '../models/User.js';

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 검증
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: '유효하지 않거나 만료된 토큰입니다.',
      code: 'INVALID_TOKEN'
    });
  }

  // 사용자 정보 조회
  const user = await User.findUserById(decoded.sub);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '사용자를 찾을 수 없습니다.',
      code: 'USER_NOT_FOUND'
    });
  }

  // Request에 사용자 정보 추가
  req.user = user;
  req.tokenPayload = decoded;

  next();
}

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (decoded) {
    const user = await User.findUserById(decoded.sub);
    if (user) {
      req.user = user;
      req.tokenPayload = decoded;
    }
  }

  next();
}

/**
 * 역할 기반 권한 확인 미들웨어
 * @param {...string} allowedRoles - 허용된 역할들
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다.',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * 관리자 전용 미들웨어
 */
export function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * 프리미엄 이상 사용자 미들웨어
 */
export function requirePremium(req, res, next) {
  return requireRole('premium', 'admin')(req, res, next);
}

/**
 * 이메일 인증 확인 미들웨어
 */
export function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: '이메일 인증이 필요합니다.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
}

/**
 * Rate Limiting 미들웨어 (간단 구현)
 */
const rateLimitStore = new Map();

export function rateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15분
  const max = options.max || 100;
  const message = options.message || 'Too many requests';
  const keyGenerator = options.keyGenerator || ((req) => req.ip);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // 기존 기록 정리
    if (rateLimitStore.has(key)) {
      const record = rateLimitStore.get(key);
      if (now - record.startTime > windowMs) {
        rateLimitStore.delete(key);
      }
    }

    // 현재 기록 가져오기 또는 생성
    let record = rateLimitStore.get(key);
    if (!record) {
      record = { count: 0, startTime: now };
      rateLimitStore.set(key, record);
    }

    record.count++;

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((record.startTime + windowMs - now) / 1000)
      });
    }

    // 응답 헤더에 Rate Limit 정보 추가
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + windowMs) / 1000));

    next();
  };
}

/**
 * CSRF 토큰 검증 미들웨어 (상태 변경 요청용)
 */
export function csrfProtection(req, res, next) {
  // GET, HEAD, OPTIONS는 검증 제외
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionCsrf = req.session?.csrfToken;

  // 개발 환경에서는 CSRF 검증 스킵
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (!csrfToken || csrfToken !== sessionCsrf) {
    return res.status(403).json({
      success: false,
      error: 'CSRF 토큰이 유효하지 않습니다.',
      code: 'CSRF_INVALID'
    });
  }

  next();
}

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin,
  requirePremium,
  requireEmailVerified,
  rateLimit,
  csrfProtection
};
