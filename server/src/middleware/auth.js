/**
 * 인증 미들웨어
 * JWT 검증, 권한 확인
 */

import { verifyAccessToken, findSession } from '../auth/tokenService.js';
import * as User from '../models/User.js';

/**
 * JWT 토큰 검증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하여 검증
 */
export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // 토큰 검증
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: '유효하지 않거나 만료된 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    // 유저 정보를 요청에 추가
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('[Auth] 토큰 검증 오류:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '토큰이 만료되었습니다.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(403).json({
      error: '유효하지 않은 토큰입니다.',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    // 오류가 있어도 통과 (선택적 인증)
    next();
  }
}

/**
 * 역할 기반 권한 확인 미들웨어
 * @param {string[]} allowedRoles - 허용된 역할 배열
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '인증이 필요합니다.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: '이 작업을 수행할 권한이 없습니다.',
        code: 'INSUFFICIENT_PERMISSIONS'
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
 * 프리미엄 사용자 이상 미들웨어
 */
export function requirePremium(req, res, next) {
  return requireRole('premium', 'admin')(req, res, next);
}

/**
 * 이메일 인증 필수 미들웨어
 */
export async function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: '인증이 필요합니다.',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  try {
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: '이메일 인증이 필요합니다.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('[Auth] 이메일 인증 확인 오류:', error.message);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * 세션 유효성 확인 미들웨어
 * 리프레시 토큰의 세션이 유효한지 확인
 */
export function validateSession(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: '세션 정보가 없습니다.',
        code: 'SESSION_REQUIRED'
      });
    }

    const session = findSession(refreshToken);

    if (!session) {
      return res.status(401).json({
        error: '세션이 만료되었거나 유효하지 않습니다.',
        code: 'INVALID_SESSION'
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('[Auth] 세션 검증 오류:', error.message);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * API 키 검증 미들웨어 (서비스 간 통신용)
 */
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API 키가 필요합니다.',
      code: 'API_KEY_REQUIRED'
    });
  }

  // 환경 변수에서 유효한 API 키 목록 확인
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');

  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: '유효하지 않은 API 키입니다.',
      code: 'INVALID_API_KEY'
    });
  }

  next();
}

/**
 * 요청 사용자 정보 로깅 (디버깅용)
 */
export function logUserRequest(req, res, next) {
  if (req.user) {
    console.log(`[Auth] 인증된 요청: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`);
  }
  next();
}

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requirePremium,
  requireEmailVerified,
  validateSession,
  validateApiKey,
  logUserRequest,
};
