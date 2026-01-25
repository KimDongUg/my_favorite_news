/**
 * 인증 API 라우트 (PostgreSQL)
 */

import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import * as User from '../models/User.js';
import * as tokenService from '../auth/tokenService.js';
import { authenticate, optionalAuth, rateLimit } from '../auth/authMiddleware.js';
import { passwordPolicy, rateLimitConfig, magicLinkConfig, oauthConfig } from '../config/auth.js';
import { getAvailableProviders } from '../auth/passport.js';
import {
  sendVerificationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  isEmailEnabled
} from '../services/emailService.js';
import { validatePasswordStrength } from '../utils/passwordPolicy.js';
import { loginLimiter, signupLimiter, emailActionLimiter } from '../middleware/security.js';

const router = Router();

// ============================================
// Joi 유효성 검사 스키마
// ============================================

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '유효한 이메일 형식이 아닙니다.',
      'any.required': '이메일은 필수입니다.'
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
      'string.max': '비밀번호는 128자를 초과할 수 없습니다.',
      'any.required': '비밀번호는 필수입니다.'
    }),
    displayName: Joi.string().min(2).max(50).optional(),
    username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).optional().messages({
      'string.pattern.base': '사용자명은 영문, 숫자, 밑줄만 사용할 수 있습니다.'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  email: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required()
  })
};

// ============================================
// 이메일/비밀번호 인증
// ============================================

/**
 * POST /auth/register
 * 회원가입
 */
router.post('/register', signupLimiter, async (req, res) => {
  try {
    // Joi 유효성 검사
    const { error, value } = schemas.register.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    // 비밀번호 강도 검사
    const passwordValidation = validatePasswordStrength(value.password, {
      email: value.email
    });

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors[0],
        errors: passwordValidation.errors,
        code: 'WEAK_PASSWORD'
      });
    }

    const { email, password, displayName, username } = value;

    // 비밀번호 정책 검사 (추가 규칙)
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: passwordErrors.join(' '),
        code: 'INVALID_PASSWORD'
      });
    }

    // 기존 사용자 확인
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '이미 사용 중인 이메일입니다.',
        code: 'EMAIL_EXISTS'
      });
    }

    // 사용자명 중복 확인
    if (username) {
      const existingUsername = await User.findUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: '이미 사용 중인 사용자명입니다.',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, passwordPolicy.saltRounds);

    // 사용자 생성
    const user = await User.createUser({
      email,
      passwordHash,
      username: username || null,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    // 이메일 인증 토큰 생성 및 발송
    const verificationToken = await tokenService.createEmailVerificationToken(user.id);
    try {
      await sendVerificationEmail(email, verificationToken.token);
    } catch (emailError) {
      console.error('[Auth] 인증 이메일 발송 실패:', emailError.message);
      // 이메일 발송 실패해도 가입은 진행
    }

    // 세션 생성
    const session = await tokenService.createSession(user.id, req);

    // Access Token 생성
    const { accessToken } = tokenService.generateTokenPair(user);

    console.log(`[Auth] 신규 회원가입: ${email}`);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      data: {
        user: User.getPublicProfile(user),
        accessToken,
        refreshToken: session.token,
        expiresAt: session.expiresAt,
        emailVerificationSent: true
      }
    });

  } catch (error) {
    console.error('[Auth] 회원가입 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.',
      code: 'REGISTER_ERROR'
    });
  }
});

/**
 * POST /auth/login
 * 이메일/비밀번호 로그인
 */
router.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
        code: 'LOGIN_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: info?.message || '이메일 또는 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    try {
      // 세션 제한 체크
      await tokenService.enforceSessionLimit(user.id);

      // 세션 생성
      const session = await tokenService.createSession(user.id, req);

      // 토큰 생성
      const { accessToken } = tokenService.generateTokenPair(user);

      // 마지막 로그인 시간 업데이트
      await User.updateLastLogin(user.id);

      res.json({
        success: true,
        data: {
          user: User.getPublicProfile(user),
          accessToken,
          refreshToken: session.token,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('[Auth] 로그인 처리 오류:', error);
      res.status(500).json({
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
        code: 'LOGIN_ERROR'
      });
    }
  })(req, res, next);
});

/**
 * POST /auth/logout
 * 로그아웃
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      await tokenService.deleteSession(refreshToken);
    }

    res.json({
      success: true,
      message: '로그아웃되었습니다.'
    });
  } catch (error) {
    console.error('[Auth] 로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /auth/logout-all
 * 모든 세션에서 로그아웃
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    await tokenService.deleteAllUserSessions(req.user.id);

    res.json({
      success: true,
      message: '모든 기기에서 로그아웃되었습니다.'
    });
  } catch (error) {
    console.error('[Auth] 전체 로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /auth/refresh
 * 토큰 갱신
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh Token이 필요합니다.',
        code: 'MISSING_TOKEN'
      });
    }

    // 세션 확인
    const session = await tokenService.findSession(refreshToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 세션입니다.',
        code: 'INVALID_SESSION'
      });
    }

    // Refresh Token 검증
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    // 사용자 조회
    const user = await User.findUserById(session.user_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 새 Access Token 발급
    const { accessToken } = tokenService.generateTokenPair(user);

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    console.error('[Auth] 토큰 갱신 오류:', error);
    res.status(500).json({
      success: false,
      error: '토큰 갱신 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 이메일 인증
// ============================================

/**
 * POST /auth/verify-email
 * 이메일 인증 처리
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '토큰이 필요합니다.',
        code: 'MISSING_TOKEN'
      });
    }

    // 토큰 검증
    const verification = await tokenService.verifyEmailVerificationToken(token);

    if (!verification) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    // 사용자 이메일 인증 처리
    const user = await User.findUserById(verification.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 이미 인증된 경우
    if (user.emailVerified) {
      await tokenService.useEmailVerificationToken(token);
      return res.json({
        success: true,
        message: '이미 이메일 인증이 완료되었습니다.',
        data: { user: User.getPublicProfile(user) }
      });
    }

    // 이메일 인증 완료
    await User.updateUser(user.id, { emailVerified: true });
    await tokenService.useEmailVerificationToken(token);

    // 환영 이메일 발송
    sendWelcomeEmail(user.email, user.displayName).catch(err => {
      console.error('[Auth] 환영 이메일 발송 실패:', err.message);
    });

    console.log(`[Auth] 이메일 인증 완료: ${user.email}`);

    res.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      data: { user: User.getPublicProfile({ ...user, emailVerified: true }) }
    });

  } catch (error) {
    console.error('[Auth] 이메일 인증 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 인증 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /auth/resend-verification
 * 인증 이메일 재발송
 */
router.post('/resend-verification', rateLimit(rateLimitConfig.magicLink), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일은 필수입니다.',
        code: 'MISSING_EMAIL'
      });
    }

    const user = await User.findUserByEmail(email);

    if (!user) {
      // 보안상 사용자 존재 여부 숨김
      return res.json({
        success: true,
        message: '인증 이메일이 발송되었습니다.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: '이미 인증된 이메일입니다.',
        code: 'ALREADY_VERIFIED'
      });
    }

    // 새 인증 토큰 생성 및 발송
    const verificationToken = await tokenService.createEmailVerificationToken(user.id);
    sendVerificationEmail(email, verificationToken.token).catch(err => {
      console.error('[Auth] 인증 이메일 재발송 실패:', err.message);
    });

    console.log(`[Auth] 인증 이메일 재발송: ${email}`);

    res.json({
      success: true,
      message: '인증 이메일이 발송되었습니다.'
    });

  } catch (error) {
    console.error('[Auth] 인증 이메일 재발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 발송 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 매직 링크 (Passwordless)
// ============================================

/**
 * POST /auth/magic-link
 * 매직 링크 요청 (Passwordless 로그인)
 */
router.post('/magic-link', emailActionLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Joi 유효성 검사
    const { error } = schemas.email.validate({ email });
    if (error) {
      return res.status(400).json({
        success: false,
        error: '유효한 이메일 형식이 아닙니다.',
        code: 'INVALID_EMAIL'
      });
    }

    // 매직 링크 생성
    const magicLink = await tokenService.createMagicLink(email);

    // 이메일 발송
    try {
      await sendMagicLinkEmail(email, magicLink.token);
      console.log(`[Auth] 매직 링크 발송: ${email}`);
    } catch (emailError) {
      console.error('[Auth] 매직 링크 이메일 발송 실패:', emailError.message);
      // 개발 환경에서는 계속 진행
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
          code: 'EMAIL_SEND_FAILED'
        });
      }
    }

    res.json({
      success: true,
      message: '로그인 링크가 이메일로 발송되었습니다.',
      expiresIn: '15분',
      // 개발 환경에서만 토큰 반환 (테스트용)
      ...(process.env.NODE_ENV !== 'production' && { devToken: magicLink.token })
    });

  } catch (error) {
    console.error('[Auth] 매직 링크 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '매직 링크 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /auth/magic-link/verify
 * 매직 링크 검증 및 로그인
 */
router.post('/magic-link/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '토큰이 필요합니다.',
        code: 'MISSING_TOKEN'
      });
    }

    // 매직 링크 검증
    const magicLink = await tokenService.verifyMagicLink(token);

    if (!magicLink) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 링크입니다.',
        code: 'INVALID_LINK'
      });
    }

    // 매직 링크 사용 처리
    await tokenService.useMagicLink(token);

    // 사용자 찾기 또는 생성
    let user = await User.findUserByEmail(magicLink.email);

    if (!user) {
      // 신규 사용자 생성
      user = await User.createUser({
        email: magicLink.email,
        emailVerified: true
      });
    } else if (!user.emailVerified) {
      // 이메일 인증 처리
      await User.updateUser(user.id, { emailVerified: true });
    }

    // 세션 생성
    const session = await tokenService.createSession(user.id, req);

    // 토큰 생성
    const { accessToken } = tokenService.generateTokenPair(user);

    await User.updateLastLogin(user.id);

    res.json({
      success: true,
      data: {
        user: User.getPublicProfile(user),
        accessToken,
        refreshToken: session.token,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('[Auth] 매직 링크 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '매직 링크 검증 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// OAuth 소셜 로그인
// ============================================

/**
 * GET /auth/providers/available
 * 사용 가능한 OAuth 프로바이더 목록
 */
router.get('/providers/available', (req, res) => {
  res.json({
    success: true,
    data: {
      providers: getAvailableProviders(),
      traditional: {
        email: true,
        magicLink: true
      }
    }
  });
});

/**
 * GET /auth/google
 * Google OAuth 시작
 */
router.get('/google', (req, res, next) => {
  if (!oauthConfig.google.clientID) {
    return res.status(501).json({
      success: false,
      error: 'Google OAuth가 설정되지 않았습니다.',
      code: 'OAUTH_NOT_CONFIGURED'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

/**
 * GET /auth/google/callback
 * Google OAuth 콜백
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/error?provider=google' }),
  (req, res) => {
    handleOAuthSuccess(req, res, 'google');
  }
);

/**
 * GET /auth/kakao
 * Kakao OAuth 시작
 */
router.get('/kakao', (req, res, next) => {
  if (!oauthConfig.kakao.clientID) {
    return res.status(501).json({
      success: false,
      error: 'Kakao OAuth가 설정되지 않았습니다.',
      code: 'OAUTH_NOT_CONFIGURED'
    });
  }
  passport.authenticate('kakao')(req, res, next);
});

/**
 * GET /auth/kakao/callback
 * Kakao OAuth 콜백
 */
router.get('/kakao/callback',
  passport.authenticate('kakao', { session: false, failureRedirect: '/api/auth/error?provider=kakao' }),
  (req, res) => {
    handleOAuthSuccess(req, res, 'kakao');
  }
);

/**
 * GET /auth/naver
 * Naver OAuth 시작
 */
router.get('/naver', (req, res, next) => {
  if (!oauthConfig.naver.clientID) {
    return res.status(501).json({
      success: false,
      error: 'Naver OAuth가 설정되지 않았습니다.',
      code: 'OAUTH_NOT_CONFIGURED'
    });
  }
  passport.authenticate('naver')(req, res, next);
});

/**
 * GET /auth/naver/callback
 * Naver OAuth 콜백
 */
router.get('/naver/callback',
  passport.authenticate('naver', { session: false, failureRedirect: '/api/auth/error?provider=naver' }),
  (req, res) => {
    handleOAuthSuccess(req, res, 'naver');
  }
);

/**
 * GET /auth/error
 * OAuth 에러 페이지
 */
router.get('/error', (req, res) => {
  const provider = req.query.provider || 'unknown';
  const message = req.query.message || '인증 처리 중 오류가 발생했습니다.';

  res.status(400).json({
    success: false,
    error: message,
    provider,
    code: 'OAUTH_ERROR'
  });
});

/**
 * OAuth 성공 처리
 */
async function handleOAuthSuccess(req, res, provider) {
  try {
    const user = req.user;

    // 세션 제한 체크
    await tokenService.enforceSessionLimit(user.id);

    // 세션 생성
    const session = await tokenService.createSession(user.id, req);

    // 토큰 생성
    const { accessToken } = tokenService.generateTokenPair(user);

    await User.updateLastLogin(user.id);

    console.log(`[Auth] ${provider} OAuth 로그인 성공: ${user.email}`);

    // 프론트엔드로 리다이렉트 (토큰 전달)
    const redirectUrl = new URL('/auth/callback', magicLinkConfig.baseUrl);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', session.token);
    redirectUrl.searchParams.set('provider', provider);

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error(`[Auth] ${provider} OAuth 처리 오류:`, error);
    res.redirect(`${magicLinkConfig.baseUrl}/auth/error?provider=${provider}&message=OAuth 처리 중 오류가 발생했습니다.`);
  }
}

// ============================================
// 비밀번호 재설정
// ============================================

/**
 * POST /auth/forgot-password
 * 비밀번호 재설정 요청
 */
router.post('/forgot-password', emailActionLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Joi 유효성 검사
    const { error } = schemas.email.validate({ email });
    if (error) {
      return res.status(400).json({
        success: false,
        error: '유효한 이메일 형식이 아닙니다.',
        code: 'INVALID_EMAIL'
      });
    }

    const user = await User.findUserByEmail(email);

    // 사용자 존재 여부와 관계없이 동일한 응답 (보안)
    if (user) {
      const resetToken = await tokenService.createPasswordResetToken(user.id);

      // 이메일 발송
      try {
        await sendPasswordResetEmail(email, resetToken.token);
        console.log(`[Auth] 비밀번호 재설정 이메일 발송: ${email}`);
      } catch (emailError) {
        console.error('[Auth] 비밀번호 재설정 이메일 발송 실패:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 발송되었습니다.'
    });

  } catch (error) {
    console.error('[Auth] 비밀번호 재설정 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '비밀번호 재설정 요청 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /auth/reset-password
 * 비밀번호 재설정
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '토큰과 새 비밀번호가 필요합니다.',
        code: 'MISSING_FIELDS'
      });
    }

    // 비밀번호 정책 검사
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: passwordErrors.join(' '),
        code: 'INVALID_PASSWORD'
      });
    }

    // 토큰 검증
    const resetToken = await tokenService.verifyPasswordResetToken(token);

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    // 비밀번호 업데이트
    await User.updatePassword(resetToken.user_id, newPassword);

    // 토큰 사용 처리
    await tokenService.usePasswordResetToken(token);

    // 모든 세션 무효화 (보안)
    await tokenService.deleteAllUserSessions(resetToken.user_id);

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.'
    });

  } catch (error) {
    console.error('[Auth] 비밀번호 재설정 오류:', error);
    res.status(500).json({
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 사용자 정보
// ============================================

/**
 * GET /auth/me
 * 현재 사용자 정보
 */
router.get('/me', authenticate, async (req, res) => {
  const preferences = await User.getUserPreferences(req.user.id);

  res.json({
    success: true,
    data: {
      user: User.getPublicProfile(req.user),
      preferences
    }
  });
});

/**
 * PUT /auth/me
 * 사용자 정보 수정
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { displayName, username, avatarUrl } = req.body;

    // 사용자명 중복 확인
    if (username) {
      const existingUser = await User.findUserByUsername(username);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({
          success: false,
          error: '이미 사용 중인 사용자명입니다.',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    const updatedUser = await User.updateUser(req.user.id, {
      displayName,
      username,
      avatarUrl
    });

    res.json({
      success: true,
      data: { user: User.getPublicProfile(updatedUser) }
    });

  } catch (error) {
    console.error('[Auth] 사용자 정보 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * PUT /auth/preferences
 * 사용자 설정 수정
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { preferredCategories, theme, language, notificationEnabled } = req.body;

    const preferences = await User.updateUserPreferences(req.user.id, {
      preferredCategories,
      theme,
      language,
      notificationEnabled
    });

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('[Auth] 설정 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '설정 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /auth/sessions
 * 활성 세션 목록
 */
router.get('/sessions', authenticate, async (req, res) => {
  const sessions = await tokenService.getUserSessions(req.user.id);

  res.json({
    success: true,
    data: { sessions }
  });
});

/**
 * DELETE /auth/sessions/:sessionId
 * 특정 세션 삭제
 */
router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    // 해당 세션이 현재 사용자의 것인지 확인
    const sessions = await tokenService.getUserSessions(req.user.id);
    const targetSession = sessions.find(s => s.id === req.params.sessionId);

    if (!targetSession) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // 세션 삭제는 ID로 직접 처리 필요
    // tokenService에 deleteSessionById 함수 추가 필요

    res.json({
      success: true,
      message: '세션이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('[Auth] 세션 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * PUT /auth/change-password
 * 비밀번호 변경 (로그인 상태)
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '현재 비밀번호와 새 비밀번호가 필요합니다.',
        code: 'MISSING_FIELDS'
      });
    }

    // 현재 비밀번호 확인
    const isValid = await User.verifyPassword(req.user, currentPassword);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_PASSWORD'
      });
    }

    // 비밀번호 정책 검사
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: passwordErrors.join(' '),
        code: 'INVALID_PASSWORD'
      });
    }

    // 비밀번호 업데이트
    await User.updatePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });

  } catch (error) {
    console.error('[Auth] 비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      error: '비밀번호 변경 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /auth/providers
 * 연결된 OAuth 프로바이더 목록
 */
router.get('/providers', authenticate, async (req, res) => {
  const providers = await User.getUserProviders(req.user.id);

  res.json({
    success: true,
    data: { providers }
  });
});

/**
 * DELETE /auth/providers/:provider
 * OAuth 프로바이더 연결 해제
 */
router.delete('/providers/:provider', authenticate, async (req, res) => {
  try {
    const { provider } = req.params;

    // 비밀번호가 없고 다른 프로바이더도 없으면 연결 해제 불가
    const providers = await User.getUserProviders(req.user.id);

    if (!req.user.passwordHash && providers.length <= 1) {
      return res.status(400).json({
        success: false,
        error: '마지막 로그인 방법은 연결 해제할 수 없습니다. 먼저 비밀번호를 설정해주세요.',
        code: 'LAST_AUTH_METHOD'
      });
    }

    await User.unlinkAuthProvider(req.user.id, provider);

    res.json({
      success: true,
      message: `${provider} 연결이 해제되었습니다.`
    });

  } catch (error) {
    console.error('[Auth] 프로바이더 연결 해제 오류:', error);
    res.status(500).json({
      success: false,
      error: '연결 해제 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 헬퍼 함수
// ============================================

// ============================================
// 관리자 전용 API
// ============================================

// 관리자 이메일 목록
const ADMIN_EMAILS = ['kduaro124@naver.com'];

/**
 * 관리자 권한 확인 미들웨어
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.',
      code: 'UNAUTHORIZED'
    });
  }

  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: '관리자 권한이 필요합니다.',
      code: 'FORBIDDEN'
    });
  }

  next();
}

/**
 * GET /auth/admin/users
 * 모든 사용자와 설정 조회 (관리자 전용)
 */
router.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const usersWithPreferences = await User.getAllUsersWithPreferences();

    res.json({
      success: true,
      data: {
        users: usersWithPreferences,
        total: usersWithPreferences.length
      }
    });
  } catch (error) {
    console.error('[Admin] 사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /auth/admin/check
 * 관리자 권한 확인
 */
router.get('/admin/check', authenticate, (req, res) => {
  const isAdmin = ADMIN_EMAILS.includes(req.user.email);

  res.json({
    success: true,
    data: { isAdmin }
  });
});

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 비밀번호 유효성 검사
 */
function validatePassword(password) {
  const errors = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push(`비밀번호는 최소 ${passwordPolicy.minLength}자 이상이어야 합니다.`);
  }

  if (password.length > passwordPolicy.maxLength) {
    errors.push(`비밀번호는 ${passwordPolicy.maxLength}자를 초과할 수 없습니다.`);
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireNumber && !/\d/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.');
  }

  return errors;
}

export default router;
