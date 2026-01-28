/**
 * Vercel Serverless Function: /api/wake-backend
 *
 * Render 백엔드를 깨우는 프록시 엔드포인트
 * - CORS 문제 회피
 * - 서버 사이드에서 백엔드 호출
 * - cron-job.org에서도 이 엔드포인트를 호출 가능
 */

// Render 백엔드 URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://mynewsback.onrender.com';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // AbortController로 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55초 (Vercel 60초 제한 고려)

    // 백엔드 health 엔드포인트 호출
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MyNews-WakeBackend/1.0',
      },
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (response.ok) {
      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'Backend is awake' };
      }

      return res.status(200).json({
        success: true,
        message: 'Backend is awake',
        latency: `${latency}ms`,
        backendStatus: response.status,
        backendData: data,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Backend responded with error',
        latency: `${latency}ms`,
        backendStatus: response.status,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return res.status(200).json({
        success: false,
        message: 'Backend is waking up (timeout)',
        latency: `${latency}ms`,
        error: 'Request timed out - backend may still be starting',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: false,
      message: 'Failed to reach backend',
      latency: `${latency}ms`,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
