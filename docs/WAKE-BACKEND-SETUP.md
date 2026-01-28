# Render 백엔드 자동 깨우기 설정 가이드

Render 무료 인스턴스는 15분간 비활성 시 spin down됩니다. 이 가이드에서는 백엔드를 자동으로 깨워 사용자 대기 시간을 줄이는 방법을 설명합니다.

## 구현된 기능

### 1. 클라이언트 사이드 자동 깨우기

사용자가 웹사이트에 접속하면 백그라운드에서 자동으로 백엔드를 깨웁니다.

**관련 파일:**
- `src/hooks/useWakeBackend.js` - 백엔드 깨우기 훅
- `src/components/WakeBackend.jsx` - 래퍼 컴포넌트
- `src/main.jsx` - 컴포넌트 적용

**동작 방식:**
- 세션당 1회만 실행 (sessionStorage로 중복 방지)
- 60초 타임아웃
- 에러 시 조용히 실패 (콘솔 로그만)
- 사용자 경험에 영향 없음 (비동기 실행)

### 2. Vercel Serverless Function

**엔드포인트:**
- `/api/health` - 프론트엔드 상태 확인 + 백엔드 깨우기
- `/api/wake-backend` - 백엔드 전용 깨우기

---

## cron-job.org 설정 (권장)

사용자가 접속하기 전에 미리 백엔드를 깨워두려면 cron-job.org를 사용하세요.

### Step 1: 회원가입
1. https://cron-job.org 접속
2. **Register** 클릭하여 무료 계정 생성
3. 이메일 인증 후 로그인

### Step 2: Cron Job 생성

로그인 후 **CREATE CRONJOB** 클릭

#### 기본 설정

| 필드 | 값 |
|------|-----|
| Title | MyNews Wake-up |
| URL | `https://myfavoritenews.vercel.app/api/wake-backend` |

#### 스케줄 설정 (KST 기준)

**오전 4:30, 5:00, 5:30 KST에 실행하려면 3개의 Job 생성:**

| Job | Minutes | Hours | Timezone |
|-----|---------|-------|----------|
| Wake 4:30 | 30 | 4 | Asia/Seoul |
| Wake 5:00 | 0 | 5 | Asia/Seoul |
| Wake 5:30 | 30 | 5 | Asia/Seoul |

> ⚠️ **중요:** Timezone을 반드시 `Asia/Seoul`로 설정하세요!

#### 고급 설정 (Advanced)

| 필드 | 값 |
|------|-----|
| Request Method | GET |
| Request Timeout | 60 seconds (유료) / 30 seconds (무료) |
| Enable job | ✓ 체크 |
| Save responses | ✓ 체크 (디버깅용) |

#### 알림 설정 (Notifications)

- ✓ Notify me of failed executions
- Failure threshold: 1 (첫 실패 시 즉시 알림)

### Step 3: 테스트

1. 생성된 Job에서 **▶ Test Run** 클릭
2. **History** 탭에서 실행 결과 확인
3. 성공 응답 예시:
```json
{
  "success": true,
  "message": "Backend is awake",
  "latency": "2345ms",
  "timestamp": "2024-01-15T19:30:00.000Z"
}
```

---

## 추가 보험: UptimeRobot 설정

5분마다 핑을 보내 낮 시간에도 spin down 방지

### Step 1: 회원가입
1. https://uptimerobot.com 접속
2. 무료 계정 생성

### Step 2: 모니터 추가

| 필드 | 값 |
|------|-----|
| Monitor Type | HTTP(s) |
| Friendly Name | MyNews Backend |
| URL | `https://mynewsback.onrender.com/api/health` |
| Monitoring Interval | 5 minutes |

---

## Vercel 환경변수 설정

Vercel 대시보드에서 환경변수를 설정하세요:

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 추가:

| Name | Value |
|------|-------|
| `BACKEND_URL` | `https://mynewsback.onrender.com` |

---

## 문제 해결

### 백엔드가 여전히 느리게 응답

1. Render 대시보드에서 인스턴스 상태 확인
2. cron-job.org History에서 실행 기록 확인
3. 무료 플랜 한계: 첫 요청 시 50초까지 지연 가능

### CORS 에러

클라이언트에서 직접 호출 시 CORS 에러가 발생하면:
- Vercel Function (`/api/wake-backend`)을 통해 호출
- 백엔드에 CORS 설정 확인

### cron-job.org 타임아웃

- 무료 플랜: 최대 30초
- 유료 플랜 ($8/년): 최대 60초
- 타임아웃이 발생해도 백엔드는 깨어나므로 무시 가능

---

## 권장 설정 조합

```
┌─────────────────────────────────────────────────────────────┐
│  1. cron-job.org: 아침 4:30, 5:00, 5:30 KST 스케줄         │
│  2. UptimeRobot: 5분마다 핑 (낮 시간 spin down 방지)        │
│  3. 클라이언트: 접속 시 자동 깨우기 (이미 구현됨)           │
│                                                             │
│  → 3중 보호로 spin down 가능성 최소화                       │
└─────────────────────────────────────────────────────────────┘
```
