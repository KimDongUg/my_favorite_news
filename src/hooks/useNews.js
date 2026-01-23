/**
 * 뉴스 데이터 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { newsAPI } from '../services/api';

// 기본 새로고침 간격 (5분)
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * 뉴스 데이터 가져오기 Hook
 */
export function useNews(options = {}) {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    autoRefresh = true,
  } = options;

  const [news, setNews] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await newsAPI.getAll();

      if (response.success) {
        // 카테고리별로 그룹핑
        const grouped = response.data?.categories || {};
        setNews(grouped);
        setStats(response.data?.stats || null);
      }
    } catch (err) {
      console.error('[useNews] 뉴스 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();

    if (autoRefresh) {
      const interval = setInterval(fetchNews, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNews, autoRefresh, refreshInterval]);

  return { news, stats, loading, error, refresh: fetchNews };
}

/**
 * 카테고리별 뉴스 Hook
 */
export function useNewsByCategory(category, options = {}) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    if (!category) return;

    try {
      setLoading(true);
      const response = await newsAPI.getByCategory(category);

      if (response.success) {
        setNews(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, error, refresh: fetchNews };
}

export default useNews;
