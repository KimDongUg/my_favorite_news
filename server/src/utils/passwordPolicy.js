/**
 * 비밀번호 보안 정책
 */

// 일반적으로 사용되는 취약한 비밀번호 목록
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123',
  '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'qwertyuiop',
  'abc123', 'abc12345', 'abcd1234',
  'iloveyou', 'admin', 'welcome',
  'monkey', 'dragon', 'master',
  'letmein', 'login', 'princess',
  'sunshine', 'passw0rd', 'shadow',
  'superman', 'michael', 'football',
  'baseball', 'trustno1', 'whatever',
  // 한국어 패턴
  'qlalfqjsgh', // 비밀번호
  'dkssudgktpdy', // 안녕하세요
  'thdnfemfla', // 솔로계정
];

// 키보드 패턴
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn',
  '123456', '654321', '012345',
  'qazwsx', 'wsxedc', 'rfvtgb',
];

/**
 * 비밀번호 강도 검증
 * @param {string} password - 검증할 비밀번호
 * @param {object} options - 검증 옵션
 * @returns {object} - { isValid, score, errors, suggestions }
 */
export function validatePasswordStrength(password, options = {}) {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    preventCommon = true,
    preventKeyboardPatterns = true,
    email = null, // 이메일과 유사한지 체크
  } = options;

  const errors = [];
  const suggestions = [];
  let score = 0;

  // 1. 길이 검사
  if (password.length < minLength) {
    errors.push(`최소 ${minLength}자 이상이어야 합니다.`);
  } else if (password.length >= minLength) {
    score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  if (password.length > maxLength) {
    errors.push(`최대 ${maxLength}자까지 가능합니다.`);
  }

  // 2. 대문자 검사
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 최소 1개 포함해야 합니다.');
    suggestions.push('대문자를 추가해보세요.');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // 3. 소문자 검사
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 최소 1개 포함해야 합니다.');
    suggestions.push('소문자를 추가해보세요.');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // 4. 숫자 검사
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다.');
    suggestions.push('숫자를 추가해보세요.');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // 5. 특수문자 검사
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자(!@#$%^&* 등)를 최소 1개 포함해야 합니다.');
    suggestions.push('특수문자를 추가해보세요.');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // 6. 일반적인 비밀번호 체크
  if (preventCommon && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('너무 흔한 비밀번호입니다.');
    score = Math.min(score, 20);
  }

  // 7. 키보드 패턴 체크
  if (preventKeyboardPatterns) {
    const lowerPassword = password.toLowerCase();
    for (const pattern of KEYBOARD_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        errors.push('키보드 패턴 사용은 피해주세요.');
        suggestions.push('연속된 키 패턴 대신 무작위 조합을 사용하세요.');
        score = Math.max(score - 20, 0);
        break;
      }
    }
  }

  // 8. 연속 문자 체크 (3개 이상)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('같은 문자를 3번 이상 연속 사용할 수 없습니다.');
    score = Math.max(score - 10, 0);
  }

  // 9. 이메일 포함 여부 체크
  if (email) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailPrefix) && emailPrefix.length >= 3) {
      errors.push('비밀번호에 이메일 주소를 포함할 수 없습니다.');
      score = Math.max(score - 20, 0);
    }
  }

  // 10. 순차적 숫자/문자 체크
  if (/012|123|234|345|456|567|678|789|890/.test(password) ||
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    suggestions.push('연속된 숫자나 문자 대신 무작위 조합을 사용하세요.');
    score = Math.max(score - 10, 0);
  }

  // 강도 등급 결정
  let strength;
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 60) {
    strength = 'good';
  } else if (score >= 40) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 100),
    strength,
    errors,
    suggestions: errors.length === 0 ? [] : suggestions,
  };
}

/**
 * 비밀번호 강도 점수만 반환 (간단한 검사)
 */
export function getPasswordScore(password) {
  const result = validatePasswordStrength(password, {
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  });
  return result.score;
}

/**
 * 비밀번호가 기본 요구사항을 충족하는지 빠르게 확인
 */
export function isPasswordValid(password) {
  const result = validatePasswordStrength(password);
  return result.isValid;
}

/**
 * 비밀번호 생성 제안
 */
export function generatePasswordSuggestion() {
  const chars = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower: 'abcdefghjkmnpqrstuvwxyz',
    numbers: '23456789',
    special: '!@#$%^&*',
  };

  const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];

  let password = '';

  // 최소 요구사항 충족
  password += getRandomChar(chars.upper);
  password += getRandomChar(chars.lower);
  password += getRandomChar(chars.numbers);
  password += getRandomChar(chars.special);

  // 나머지 8자 추가 (총 12자)
  const allChars = chars.upper + chars.lower + chars.numbers + chars.special;
  for (let i = 0; i < 8; i++) {
    password += getRandomChar(allChars);
  }

  // 셔플
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
}

/**
 * 비밀번호 정책 설명 반환
 */
export function getPasswordPolicyDescription() {
  return {
    minLength: 8,
    requirements: [
      '최소 8자 이상',
      '대문자 1개 이상',
      '소문자 1개 이상',
      '숫자 1개 이상',
      '특수문자 1개 이상 (!@#$%^&* 등)',
    ],
    restrictions: [
      '일반적인 비밀번호 사용 불가',
      '키보드 패턴 사용 불가',
      '같은 문자 3번 이상 연속 사용 불가',
      '이메일 주소 포함 불가',
    ],
  };
}

export default {
  validatePasswordStrength,
  getPasswordScore,
  isPasswordValid,
  generatePasswordSuggestion,
  getPasswordPolicyDescription,
};
