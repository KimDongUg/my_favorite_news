/**
 * 인증 설정
 */

// 환경 변수 확인 (이 파일이 import될 때)
import 'dotenv/config';

// JWT 설정
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'mynews-access-secret-key-change-in-production',
    expiresIn: '15m'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'mynews-refresh-secret-key-change-in-production',
    expiresIn: '7d'
  }
};

// 세션 설정
export const sessionConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

// OAuth 프로바이더 설정
export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  kakao: {
    clientID: process.env.KAKAO_CLIENT_ID || '',
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:3001/api/auth/kakao/callback'
  },
  naver: {
    clientID: process.env.NAVER_CLIENT_ID || '',
    clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:3001/api/auth/naver/callback'
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID || '',
    teamID: process.env.APPLE_TEAM_ID || '',
    keyID: process.env.APPLE_KEY_ID || '',
    callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3001/api/auth/apple/callback'
  }
};

// 비밀번호 정책
export const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  saltRounds: 12
};

// Rate Limiting 설정
export const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 5번 시도
    message: '너무 많은 로그인 시도입니다. 15분 후에 다시 시도해주세요.'
  },
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'API 요청 한도를 초과했습니다.'
  },
  magicLink: {
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 3번
    message: '매직 링크 요청 한도를 초과했습니다. 1시간 후에 다시 시도해주세요.'
  }
};

// 매직 링크 설정
export const magicLinkConfig = {
  expiresIn: 15 * 60 * 1000, // 15분
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

// CORS 설정
export const corsConfig = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// 사용자 기본 설정
export const defaultUserPreferences = {
  preferred_categories: ['뉴스', '스포츠', 'IT', '연예', '건강'],
  theme: 'light',
  language: 'ko',
  notification_enabled: true
};

export default {
  jwtConfig,
  sessionConfig,
  oauthConfig,
  passwordPolicy,
  rateLimitConfig,
  magicLinkConfig,
  corsConfig,
  defaultUserPreferences
};
