/**
 * Vercel Serverless Function: /api/health
 *
 * 프론트엔드 헬스체크 엔드포인트
 * - Vercel 프론트엔드 상태 확인
 * - 동시에 Render 백엔드도 깨우기
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://mynewsback.onrender.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  // 백그라운드에서 백엔드 깨우기 (응답 기다리지 않음)
  const backendPromise = fetch(`${BACKEND_URL}/api/health`, {
    method: 'GET',
    headers: { 'User-Agent': 'MyNews-HealthCheck/1.0' },
  }).catch(() => null);

  // 즉시 응답
  const response = {
    status: 'healthy',
    service: 'mynews-frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? `${Math.round(process.uptime())}s` : 'N/A',
  };

  // 백엔드 상태도 확인하고 응답에 포함 (최대 5초 대기)
  try {
    const backendResult = await Promise.race([
      backendPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (backendResult && backendResult.ok) {
      response.backend = {
        status: 'healthy',
        latency: `${Date.now() - startTime}ms`,
      };
    } else {
      response.backend = {
        status: 'waking',
        message: 'Backend may be spinning up',
      };
    }
  } catch {
    response.backend = {
      status: 'unknown',
      message: 'Backend check timed out',
    };
  }

  return res.status(200).json(response);
}
