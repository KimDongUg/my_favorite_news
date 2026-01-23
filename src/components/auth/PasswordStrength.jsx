/**
 * 비밀번호 강도 표시 컴포넌트
 */

import { useMemo } from 'react';

/**
 * 비밀번호 강도 검증
 */
function validatePassword(password) {
  const errors = [];
  let score = 0;

  // 길이 검사
  if (password.length < 8) {
    errors.push('8자 이상');
  } else {
    score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // 대문자
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자 포함');
  } else {
    score += 15;
  }

  // 소문자
  if (!/[a-z]/.test(password)) {
    errors.push('소문자 포함');
  } else {
    score += 15;
  }

  // 숫자
  if (!/[0-9]/.test(password)) {
    errors.push('숫자 포함');
  } else {
    score += 15;
  }

  // 특수문자
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자 포함');
  } else {
    score += 15;
  }

  // 강도 등급
  let strength;
  let label;
  if (score >= 80) {
    strength = 'strong';
    label = '강함';
  } else if (score >= 60) {
    strength = 'good';
    label = '양호';
  } else if (score >= 40) {
    strength = 'fair';
    label = '보통';
  } else {
    strength = 'weak';
    label = '약함';
  }

  return {
    score: Math.min(score, 100),
    strength,
    label,
    errors,
    isValid: errors.length === 0,
  };
}

export default function PasswordStrength({ password, showRequirements = true }) {
  const validation = useMemo(() => {
    if (!password) {
      return { score: 0, strength: 'none', label: '', errors: [], isValid: false };
    }
    return validatePassword(password);
  }, [password]);

  if (!password) return null;

  const strengthColors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    good: '#22c55e',
    strong: '#10b981',
  };

  return (
    <div className="password-strength">
      {/* 강도 바 */}
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: `${validation.score}%`,
            backgroundColor: strengthColors[validation.strength] || '#e2e8f0',
          }}
        />
      </div>

      {/* 강도 라벨 */}
      <div className="strength-info">
        <span
          className="strength-label"
          style={{ color: strengthColors[validation.strength] }}
        >
          {validation.label}
        </span>

        {/* 충족 안된 요구사항 */}
        {showRequirements && validation.errors.length > 0 && (
          <span className="strength-requirements">
            필요: {validation.errors.join(', ')}
          </span>
        )}
      </div>

      <style>{`
        .password-strength {
          margin-top: 0.5rem;
        }

        .strength-bar-container {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-bar {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .strength-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.375rem;
          font-size: 0.75rem;
        }

        .strength-label {
          font-weight: 600;
        }

        .strength-requirements {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
