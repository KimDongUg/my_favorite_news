/**
 * 게시판 API 서비스
 */

import { API_BASE_URL } from '../config/api';

const FEEDBACK_API = `${API_BASE_URL}/feedback`;

/**
 * 인증 헤더 생성
 */
function getAuthHeader() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  const res = await fetch(`${FEEDBACK_API}/categories`);
  return res.json();
}

/**
 * 게시글 목록 조회
 */
export async function getPosts({ category, search, sort, page, limit } = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${FEEDBACK_API}/posts?${params}`, {
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 게시글 상세 조회
 */
export async function getPost(id) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}`, {
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 게시글 작성
 */
export async function createPost({ title, content, category }) {
  const res = await fetch(`${FEEDBACK_API}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ title, content, category })
  });
  return res.json();
}

/**
 * 게시글 수정
 */
export async function updatePost(id, { title, content, category }) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ title, content, category })
  });
  return res.json();
}

/**
 * 게시글 삭제
 */
export async function deletePost(id) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 좋아요 토글
 */
export async function toggleLike(id) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}/like`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 해결 상태 토글 (관리자)
 */
export async function toggleResolve(id) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}/resolve`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 고정 상태 토글 (관리자)
 */
export async function togglePin(id) {
  const res = await fetch(`${FEEDBACK_API}/posts/${id}/pin`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 댓글 목록 조회
 */
export async function getComments(postId) {
  const res = await fetch(`${FEEDBACK_API}/posts/${postId}/comments`);
  return res.json();
}

/**
 * 댓글 작성
 */
export async function createComment(postId, content) {
  const res = await fetch(`${FEEDBACK_API}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ content })
  });
  return res.json();
}

/**
 * 댓글 삭제
 */
export async function deleteComment(id) {
  const res = await fetch(`${FEEDBACK_API}/comments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  return res.json();
}

/**
 * 관리자 통계 조회
 */
export async function getAdminStats() {
  const res = await fetch(`${FEEDBACK_API}/admin/stats`, {
    headers: getAuthHeader()
  });
  return res.json();
}

export default {
  getCategories,
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleResolve,
  togglePin,
  getComments,
  createComment,
  deleteComment,
  getAdminStats
};
