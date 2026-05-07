import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

/**
 * POST /api/stats/pageview
 * 페이지 방문 기록 (비로그인 포함, 인증 불필요)
 */
router.post('/pageview', async (req, res) => {
  try {
    const { session_id, path, referrer, user_id } = req.body;
    if (!session_id || !path) return res.json({ success: false });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    const ua = req.headers['user-agent'] || '';

    await query(
      `INSERT INTO page_views (session_id, user_id, path, referrer, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session_id, user_id || null, path, referrer || null, ip, ua]
    );

    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

export default router;
