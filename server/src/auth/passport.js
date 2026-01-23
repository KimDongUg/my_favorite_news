/**
 * Passport.js 전략 설정
 * OAuth 2.0 소셜 로그인 지원 (Google, Kakao, Naver, Apple)
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import { Strategy as LocalStrategy } from 'passport-local';
import { oauthConfig } from '../config/auth.js';
import * as User from '../models/User.js';

/**
 * Passport 초기화
 */
export function initializePassport() {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    try {
      const user = User.findUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // ============================================
  // Local Strategy (이메일/비밀번호 로그인)
  // ============================================
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = User.findUserByEmail(email);

        if (!user) {
          return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        const isValid = await User.verifyPassword(user, password);

        if (!isValid) {
          return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // ============================================
  // Google Strategy
  // ============================================
  if (oauthConfig.google.clientID) {
    passport.use(new GoogleStrategy(
      {
        clientID: oauthConfig.google.clientID,
        clientSecret: oauthConfig.google.clientSecret,
        callbackURL: oauthConfig.google.callbackURL,
        scope: oauthConfig.google.scope
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await handleOAuthCallback('google', profile, {
            accessToken,
            refreshToken,
            email: profile.emails?.[0]?.value,
            emailVerified: profile.emails?.[0]?.verified || false,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value
          });
          done(null, result);
        } catch (error) {
          console.error('[Auth] Google OAuth 오류:', error);
          done(error);
        }
      }
    ));
    console.log('[Auth] Google OAuth 전략 등록됨');
  } else {
    console.log('[Auth] Google OAuth 설정 없음 - 스킵');
  }

  // ============================================
  // Kakao Strategy
  // ============================================
  if (oauthConfig.kakao.clientID) {
    passport.use(new KakaoStrategy(
      {
        clientID: oauthConfig.kakao.clientID,
        clientSecret: oauthConfig.kakao.clientSecret || '',
        callbackURL: oauthConfig.kakao.callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const kakaoAccount = profile._json?.kakao_account || {};
          const kakaoProfile = kakaoAccount.profile || {};

          const result = await handleOAuthCallback('kakao', profile, {
            accessToken,
            refreshToken,
            email: kakaoAccount.email,
            emailVerified: kakaoAccount.is_email_verified || false,
            displayName: profile.displayName || kakaoProfile.nickname,
            avatarUrl: kakaoProfile.profile_image_url || kakaoProfile.thumbnail_image_url
          });
          done(null, result);
        } catch (error) {
          console.error('[Auth] Kakao OAuth 오류:', error);
          done(error);
        }
      }
    ));
    console.log('[Auth] Kakao OAuth 전략 등록됨');
  } else {
    console.log('[Auth] Kakao OAuth 설정 없음 - 스킵');
  }

  // ============================================
  // Naver Strategy
  // ============================================
  if (oauthConfig.naver.clientID) {
    passport.use(new NaverStrategy(
      {
        clientID: oauthConfig.naver.clientID,
        clientSecret: oauthConfig.naver.clientSecret,
        callbackURL: oauthConfig.naver.callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await handleOAuthCallback('naver', profile, {
            accessToken,
            refreshToken,
            email: profile.email,
            emailVerified: true, // Naver는 이메일 인증 필수
            displayName: profile.name || profile.nickname,
            avatarUrl: profile.profileImage
          });
          done(null, result);
        } catch (error) {
          console.error('[Auth] Naver OAuth 오류:', error);
          done(error);
        }
      }
    ));
    console.log('[Auth] Naver OAuth 전략 등록됨');
  } else {
    console.log('[Auth] Naver OAuth 설정 없음 - 스킵');
  }

  console.log('[Auth] Passport 초기화 완료');
}

/**
 * OAuth 콜백 공통 처리
 */
async function handleOAuthCallback(provider, profile, data) {
  const providerUserId = profile.id;

  // 1. 기존 사용자 찾기 (프로바이더로)
  let user = User.findUserByProvider(provider, providerUserId);

  if (user) {
    // 기존 사용자 - 토큰 업데이트
    User.linkAuthProvider(user.id, provider, {
      providerUserId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });
    User.updateLastLogin(user.id);
    console.log(`[Auth] ${provider} 기존 사용자 로그인: ${user.email}`);
    return user;
  }

  // 2. 이메일로 기존 사용자 찾기
  if (data.email) {
    user = User.findUserByEmail(data.email);

    if (user) {
      // 기존 계정에 프로바이더 연결
      User.linkAuthProvider(user.id, provider, {
        providerUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });
      User.updateLastLogin(user.id);
      console.log(`[Auth] ${provider} 기존 이메일 계정에 연결: ${user.email}`);
      return user;
    }
  }

  // 3. 신규 사용자 생성
  const userData = {
    email: data.email || `${provider}_${providerUserId}@placeholder.local`,
    emailVerified: data.emailVerified || false,
    displayName: data.displayName || `${provider} User`,
    avatarUrl: data.avatarUrl || null,
    role: 'user'
  };

  user = User.createUser(userData);
  console.log(`[Auth] ${provider} 신규 사용자 생성: ${user.email}`);

  // 프로바이더 연결
  User.linkAuthProvider(user.id, provider, {
    providerUserId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  });

  return user;
}

/**
 * 사용 가능한 OAuth 프로바이더 목록
 */
export function getAvailableProviders() {
  const providers = [];

  if (oauthConfig.google.clientID) {
    providers.push({
      id: 'google',
      name: 'Google',
      icon: 'google',
      color: '#4285F4',
      enabled: true
    });
  }

  if (oauthConfig.kakao.clientID) {
    providers.push({
      id: 'kakao',
      name: 'Kakao',
      icon: 'kakao',
      color: '#FEE500',
      enabled: true
    });
  }

  if (oauthConfig.naver.clientID) {
    providers.push({
      id: 'naver',
      name: 'Naver',
      icon: 'naver',
      color: '#03C75A',
      enabled: true
    });
  }

  if (oauthConfig.apple.clientID) {
    providers.push({
      id: 'apple',
      name: 'Apple',
      icon: 'apple',
      color: '#000000',
      enabled: true
    });
  }

  return providers;
}

export { handleOAuthCallback };

export default {
  initializePassport,
  handleOAuthCallback,
  getAvailableProviders
};
