/**
 * 게시판 API 라우트
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/database.js';
import { postCategories } from '../db/feedbackSchema.js';
import { optionalAuth, authenticate, requireAdmin } from '../auth/authMiddleware.js';

const router = express.Router();

/**
 * 카테고리 목록 조회
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: postCategories
  });
});

/**
 * 게시글 목록 조회
 */
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'latest',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = 'WHERE is_deleted = FALSE';
    const params = [];
    let paramIndex = 1;

    // 카테고리 필터
    if (category && category !== 'all') {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    // 검색어 필터
    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 정렬
    let orderClause = 'ORDER BY is_pinned DESC, ';
    switch (sort) {
      case 'popular':
        orderClause += 'likes DESC, views DESC';
        break;
      case 'comments':
        orderClause += 'comment_count DESC';
        break;
      case 'oldest':
        orderClause += 'created_at ASC';
        break;
      default:
        orderClause += 'created_at DESC';
    }

    // 전체 개수 조회
    const countResult = await query(
      `SELECT COUNT(*) as total FROM posts ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    // 게시글 목록 조회
    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT id, title, category, author_id, author_name, likes, views, comment_count,
              is_resolved, is_pinned, created_at, updated_at
       FROM posts
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    res.json({
      success: true,
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Feedback] 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: '게시글 목록을 불러올 수 없습니다.' });
  }
});

/**
 * 게시글 상세 조회
 */
router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 조회수 증가
    await query(
      'UPDATE posts SET views = views + 1 WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    // 게시글 조회
    const result = await query(
      `SELECT p.*, u.role as author_role
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = $1 AND p.is_deleted = FALSE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    const post = result.rows[0];

    // 사용자의 좋아요 여부 확인
    let userLiked = false;
    if (req.user) {
      const likeResult = await query(
        'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      userLiked = likeResult.rows.length > 0;
    }

    res.json({
      success: true,
      post: {
        ...post,
        userLiked
      }
    });
  } catch (error) {
    console.error('[Feedback] 상세 조회 실패:', error);
    res.status(500).json({ success: false, error: '게시글을 불러올 수 없습니다.' });
  }
});

/**
 * 게시글 작성
 */
router.post('/posts', authenticate, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const user = req.user;

    // 유효성 검사
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: '제목을 입력해주세요.' });
    }
    if (title.length > 100) {
      return res.status(400).json({ success: false, error: '제목은 100자 이내로 입력해주세요.' });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: '내용을 입력해주세요.' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ success: false, error: '내용은 5000자 이내로 입력해주세요.' });
    }

    const validCategory = postCategories.find(c => c.id === category);
    if (!validCategory) {
      return res.status(400).json({ success: false, error: '올바른 카테고리를 선택해주세요.' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO posts (id, title, content, category, author_id, author_name, author_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, title.trim(), content.trim(), category, user.id, user.displayName || user.username, user.email]
    );

    res.status(201).json({
      success: true,
      message: '게시글이 작성되었습니다.',
      postId: id
    });
  } catch (error) {
    console.error('[Feedback] 게시글 작성 실패:', error);
    res.status(500).json({ success: false, error: '게시글 작성에 실패했습니다.' });
  }
});

/**
 * 게시글 수정
 */
router.put('/posts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const user = req.user;

    // 게시글 조회
    const postResult = await query(
      'SELECT author_id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    // 권한 확인 (작성자 또는 관리자)
    if (postResult.rows[0].author_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
    }

    // 유효성 검사
    if (title && title.length > 100) {
      return res.status(400).json({ success: false, error: '제목은 100자 이내로 입력해주세요.' });
    }
    if (content && content.length > 5000) {
      return res.status(400).json({ success: false, error: '내용은 5000자 이내로 입력해주세요.' });
    }

    await query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           updated_at = NOW()
       WHERE id = $4`,
      [title?.trim(), content?.trim(), category, id]
    );

    res.json({ success: true, message: '게시글이 수정되었습니다.' });
  } catch (error) {
    console.error('[Feedback] 게시글 수정 실패:', error);
    res.status(500).json({ success: false, error: '게시글 수정에 실패했습니다.' });
  }
});

/**
 * 게시글 삭제
 */
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 게시글 조회
    const postResult = await query(
      'SELECT author_id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    // 권한 확인 (작성자 또는 관리자)
    if (postResult.rows[0].author_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
    }

    // 소프트 삭제
    await query(
      'UPDATE posts SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('[Feedback] 게시글 삭제 실패:', error);
    res.status(500).json({ success: false, error: '게시글 삭제에 실패했습니다.' });
  }
});

/**
 * 좋아요 토글
 */
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 게시글 존재 확인
    const postResult = await query(
      'SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    // 좋아요 여부 확인
    const likeResult = await query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [id, user.id]
    );

    let liked;
    if (likeResult.rows.length > 0) {
      // 좋아요 취소
      await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, user.id]);
      await query('UPDATE posts SET likes = likes - 1 WHERE id = $1', [id]);
      liked = false;
    } else {
      // 좋아요 추가
      await query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [id, user.id]);
      await query('UPDATE posts SET likes = likes + 1 WHERE id = $1', [id]);
      liked = true;
    }

    // 현재 좋아요 수 조회
    const countResult = await query('SELECT likes FROM posts WHERE id = $1', [id]);

    res.json({
      success: true,
      liked,
      likes: countResult.rows[0]?.likes || 0
    });
  } catch (error) {
    console.error('[Feedback] 좋아요 실패:', error);
    res.status(500).json({ success: false, error: '좋아요 처리에 실패했습니다.' });
  }
});

/**
 * 게시글 해결 상태 토글 (관리자)
 */
router.post('/posts/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE posts SET is_resolved = NOT is_resolved, updated_at = NOW() WHERE id = $1 RETURNING is_resolved',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      isResolved: result.rows[0].is_resolved
    });
  } catch (error) {
    console.error('[Feedback] 해결 상태 변경 실패:', error);
    res.status(500).json({ success: false, error: '상태 변경에 실패했습니다.' });
  }
});

/**
 * 게시글 고정 토글 (관리자)
 */
router.post('/posts/:id/pin', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE posts SET is_pinned = NOT is_pinned, updated_at = NOW() WHERE id = $1 RETURNING is_pinned',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      isPinned: result.rows[0].is_pinned
    });
  } catch (error) {
    console.error('[Feedback] 고정 상태 변경 실패:', error);
    res.status(500).json({ success: false, error: '상태 변경에 실패했습니다.' });
  }
});

// ========== 댓글 API ==========

/**
 * 댓글 목록 조회
 */
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await query(
      `SELECT c.*, u.role as author_role
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1 AND c.is_deleted = FALSE
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error('[Feedback] 댓글 조회 실패:', error);
    res.status(500).json({ success: false, error: '댓글을 불러올 수 없습니다.' });
  }
});

/**
 * 댓글 작성
 */
router.post('/posts/:postId/comments', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const user = req.user;

    // 유효성 검사
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: '댓글 내용을 입력해주세요.' });
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, error: '댓글은 500자 이내로 입력해주세요.' });
    }

    // 게시글 존재 확인
    const postResult = await query(
      'SELECT id FROM posts WHERE id = $1 AND is_deleted = FALSE',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    }

    const id = uuidv4();
    const isAdminReply = user.role === 'admin';

    await query(
      `INSERT INTO comments (id, post_id, content, author_id, author_name, is_admin_reply)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, postId, content.trim(), user.id, user.displayName || user.username, isAdminReply]
    );

    // 댓글 수 증가
    await query(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
      [postId]
    );

    res.status(201).json({
      success: true,
      message: '댓글이 작성되었습니다.',
      commentId: id,
      isAdminReply
    });
  } catch (error) {
    console.error('[Feedback] 댓글 작성 실패:', error);
    res.status(500).json({ success: false, error: '댓글 작성에 실패했습니다.' });
  }
});

/**
 * 댓글 삭제
 */
router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 댓글 조회
    const commentResult = await query(
      'SELECT author_id, post_id FROM comments WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다.' });
    }

    // 권한 확인 (작성자 또는 관리자)
    if (commentResult.rows[0].author_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
    }

    // 소프트 삭제
    await query(
      'UPDATE comments SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );

    // 댓글 수 감소
    await query(
      'UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1',
      [commentResult.rows[0].post_id]
    );

    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('[Feedback] 댓글 삭제 실패:', error);
    res.status(500).json({ success: false, error: '댓글 삭제에 실패했습니다.' });
  }
});

// ========== 관리자 API ==========

/**
 * 관리자 - 전체 통계
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const totalPosts = await query('SELECT COUNT(*) as count FROM posts WHERE is_deleted = FALSE');
    const totalComments = await query('SELECT COUNT(*) as count FROM comments WHERE is_deleted = FALSE');
    const unresolvedPosts = await query('SELECT COUNT(*) as count FROM posts WHERE is_deleted = FALSE AND is_resolved = FALSE AND category IN (\'bug\', \'question\')');
    const categoryStats = await query(`
      SELECT category, COUNT(*) as count
      FROM posts
      WHERE is_deleted = FALSE
      GROUP BY category
    `);

    res.json({
      success: true,
      stats: {
        totalPosts: parseInt(totalPosts.rows[0]?.count || 0),
        totalComments: parseInt(totalComments.rows[0]?.count || 0),
        unresolvedPosts: parseInt(unresolvedPosts.rows[0]?.count || 0),
        byCategory: categoryStats.rows
      }
    });
  } catch (error) {
    console.error('[Feedback] 통계 조회 실패:', error);
    res.status(500).json({ success: false, error: '통계를 불러올 수 없습니다.' });
  }
});

export default router;
