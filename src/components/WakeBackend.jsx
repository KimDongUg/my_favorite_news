/**
 * WakeBackend - 백엔드 자동 깨우기 컴포넌트
 *
 * 앱 최상위에 배치하여 사용자 접속 시 Render 백엔드를 깨웁니다.
 * UI를 렌더링하지 않으며, 백그라운드에서 조용히 동작합니다.
 */

import { useWakeBackend } from '../hooks/useWakeBackend';

const WakeBackend = () => {
  // 백엔드 깨우기 훅 실행
  useWakeBackend({ enabled: true });

  // UI 없음
  return null;
};

export default WakeBackend;
