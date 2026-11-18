import express from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../db/database.js';
import { optionalAuth } from '../auth/authMiddleware.js';
import { isAdminUser } from '../config/admin.js';
import { isBotUserAgent } from '../utils/botDetect.js';

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PATH = 500;
const MAX_REFERRER = 1000;
const MAX_UA = 1000;

// IP당 분당 30건. 초과 시 본문 없이 429 (app.set('trust proxy', 1) 로 실제 IP 기준)
export const pageviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).end(),
});

/**
 * 입력 검증. 문제가 있으면 오류 메시지, 없으면 null
 */
export function validatePageview(body) {
  const { session_id, visitor_id, path, referrer, user_id } = body || {};
  if (typeof session_id !== 'string' || !UUID_RE.test(session_id)) return 'invalid session_id';
  if (visitor_id != null && (typeof visitor_id !== 'string' || !UUID_RE.test(visitor_id))) return 'invalid visitor_id';
  if (typeof path !== 'string' || path.length === 0 || path.length > MAX_PATH) return 'invalid path';
  if (referrer != null && typeof referrer !== 'string') return 'invalid referrer';
  if (user_id != null && (typeof user_id !== 'string' || user_id.length > 100)) return 'invalid user_id';
  return null;
}

/**
 * POST /api/stats/pageview
 * 페이지 방문 기록 (비로그인 포함). 성공 시 204.
 */
router.post('/pageview', pageviewLimiter, optionalAuth, async (req, res) => {
  const error = validatePageview(req.body);
  if (error) return res.status(400).json({ success: false, error });

  try {
    const { session_id, visitor_id, path, referrer, user_id } = req.body;
    const ua = (req.headers['user-agent'] || '').slice(0, MAX_UA);
    const ip = req.ip || '';

    await query(
      `INSERT INTO page_views
         (session_id, visitor_id, user_id, path, referrer, ip_address, user_agent, is_bot, is_admin, visited_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() AT TIME ZONE 'UTC')`,
      [
        session_id,
        visitor_id || null,
        req.user?.id || user_id || null,
        path,
        referrer ? referrer.slice(0, MAX_REFERRER) : null,
        ip,
        ua,
        isBotUserAgent(ua),
        isAdminUser(req.user),
      ]
    );

    res.status(204).end();
  } catch (err) {
    console.error('[Stats] pageview 기록 실패:', err.message);
    res.status(500).end();
  }
});

export default router;
