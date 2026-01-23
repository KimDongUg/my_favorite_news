/**
 * 이메일 서비스
 * Nodemailer를 사용한 이메일 발송
 */

import nodemailer from 'nodemailer';

// 이메일 설정
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const fromAddress = process.env.SMTP_FROM || 'MyNews <noreply@mynews.com>';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Transporter 생성
let transporter = null;

/**
 * 이메일 서비스 초기화
 */
export function initEmailService() {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.log('[Email] SMTP 설정 없음 - 이메일 서비스 비활성화 (콘솔 모드)');
    return false;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('[Email] 이메일 서비스 초기화 완료');
    return true;
  } catch (error) {
    console.error('[Email] 초기화 실패:', error.message);
    return false;
  }
}

/**
 * 이메일 서비스 사용 가능 여부
 */
export function isEmailEnabled() {
  return transporter !== null;
}

/**
 * 이메일 발송
 */
async function sendEmail(to, subject, html, text = null) {
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '') // HTML 태그 제거
  };

  // 개발 환경에서 SMTP 미설정 시 콘솔 출력
  if (!transporter) {
    console.log('\n========================================');
    console.log('[Email] 개발 모드 - 이메일 미리보기');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------');
    console.log(text || html.replace(/<[^>]*>/g, ''));
    console.log('========================================\n');
    return { messageId: 'dev-mode', preview: true };
  }

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`[Email] 발송 완료: ${to} (${result.messageId})`);
    return result;
  } catch (error) {
    console.error(`[Email] 발송 실패 (${to}):`, error.message);
    throw error;
  }
}

// ============================================
// 이메일 템플릿
// ============================================

/**
 * 기본 이메일 레이아웃
 */
function emailLayout(content, title = 'MyNews') {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">MyNews</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">개인 맞춤형 정보 대시보드</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                이 이메일은 MyNews에서 발송되었습니다.<br>
                본인이 요청하지 않았다면 이 이메일을 무시하세요.
              </p>
              <p style="margin: 10px 0 0; color: #ccc; font-size: 11px;">
                &copy; ${new Date().getFullYear()} MyNews. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 버튼 스타일
 */
function buttonStyle(color = '#667eea') {
  return `display: inline-block; padding: 14px 32px; background: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;`;
}

// ============================================
// 이메일 발송 함수
// ============================================

/**
 * 이메일 인증 메일 발송
 */
export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">이메일 인증</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      안녕하세요! MyNews에 가입해주셔서 감사합니다.<br>
      아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="${buttonStyle('#4CAF50')}">
        이메일 인증하기
      </a>
    </div>
    <p style="color: #999; font-size: 14px;">
      버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
      <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
    </p>
    <p style="color: #999; font-size: 13px; margin-top: 20px;">
      이 링크는 24시간 동안 유효합니다.
    </p>
  `;

  return sendEmail(
    email,
    '[MyNews] 이메일 인증을 완료해주세요',
    emailLayout(content, '이메일 인증')
  );
}

/**
 * 매직 링크 이메일 발송
 */
export async function sendMagicLinkEmail(email, token) {
  const magicUrl = `${frontendUrl}/auth/magic?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">간편 로그인</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      아래 버튼을 클릭하면 바로 로그인됩니다.<br>
      비밀번호가 필요없는 안전한 로그인 방식입니다.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicUrl}" style="${buttonStyle('#03C75A')}">
        매직 링크로 로그인
      </a>
    </div>
    <p style="color: #999; font-size: 14px;">
      버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
      <a href="${magicUrl}" style="color: #667eea; word-break: break-all;">${magicUrl}</a>
    </p>
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin-top: 20px;">
      <p style="margin: 0; color: #856404; font-size: 13px;">
        <strong>보안 안내:</strong><br>
        - 이 링크는 15분 동안만 유효합니다.<br>
        - 한 번만 사용할 수 있습니다.<br>
        - 다른 사람과 공유하지 마세요.
      </p>
    </div>
  `;

  return sendEmail(
    email,
    '[MyNews] 로그인 링크가 도착했습니다',
    emailLayout(content, '매직 링크 로그인')
  );
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">비밀번호 재설정</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      비밀번호 재설정을 요청하셨습니다.<br>
      아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="${buttonStyle('#FF5722')}">
        비밀번호 재설정
      </a>
    </div>
    <p style="color: #999; font-size: 14px;">
      버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="color: #999; font-size: 13px; margin-top: 20px;">
      이 링크는 1시간 동안 유효합니다.<br>
      본인이 요청하지 않았다면 이 이메일을 무시하세요. 비밀번호는 변경되지 않습니다.
    </p>
  `;

  return sendEmail(
    email,
    '[MyNews] 비밀번호 재설정',
    emailLayout(content, '비밀번호 재설정')
  );
}

/**
 * 환영 이메일 발송
 */
export async function sendWelcomeEmail(email, displayName) {
  const loginUrl = `${frontendUrl}/login`;

  const content = `
    <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">환영합니다, ${displayName}님!</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      MyNews에 가입해주셔서 감사합니다.<br>
      이제 맞춤형 뉴스와 정보를 받아보실 수 있습니다.
    </p>
    <div style="background-color: #f0f4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px; color: #667eea; font-size: 18px;">MyNews 주요 기능</h3>
      <ul style="margin: 0; padding-left: 20px; color: #666;">
        <li style="margin-bottom: 8px;">10개 카테고리의 최신 뉴스</li>
        <li style="margin-bottom: 8px;">AI가 요약한 핵심 내용</li>
        <li style="margin-bottom: 8px;">관심 카테고리 맞춤 설정</li>
        <li style="margin-bottom: 8px;">다크/라이트 테마 지원</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="${buttonStyle()}">
        MyNews 시작하기
      </a>
    </div>
    <p style="color: #999; font-size: 14px; text-align: center;">
      궁금한 점이 있으시면 언제든지 문의해주세요.
    </p>
  `;

  return sendEmail(
    email,
    '[MyNews] 가입을 환영합니다!',
    emailLayout(content, '환영합니다')
  );
}

/**
 * 로그인 알림 이메일 발송
 */
export async function sendLoginAlertEmail(email, deviceInfo) {
  const content = `
    <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">새로운 로그인 감지</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6;">
      회원님의 계정에 새로운 로그인이 있었습니다.
    </p>
    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; color: #666;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>시간:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${deviceInfo.time || new Date().toLocaleString('ko-KR')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>IP 주소:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${deviceInfo.ip || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>브라우저:</strong></td>
          <td style="padding: 8px 0;">${deviceInfo.userAgent || 'Unknown'}</td>
        </tr>
      </table>
    </div>
    <p style="color: #999; font-size: 14px;">
      본인이 아니라면 즉시 비밀번호를 변경하고 모든 세션에서 로그아웃해주세요.
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${frontendUrl}/settings/security" style="${buttonStyle('#FF5722')}">
        보안 설정 확인
      </a>
    </div>
  `;

  return sendEmail(
    email,
    '[MyNews] 새로운 로그인 알림',
    emailLayout(content, '보안 알림')
  );
}

export default {
  initEmailService,
  isEmailEnabled,
  sendVerificationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail
};
