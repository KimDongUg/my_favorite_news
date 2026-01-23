/**
 * AI 요약 데이터 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { summaryAPI } from '../services/api';

// 기본 새로고침 간격 (5분)
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * 요약 데이터 가져오기 Hook
 * @param {Object} options - 옵션
 * @param {boolean} options.validated - 검증된 요약만 가져올지 여부
 * @param {number} options.refreshInterval - 자동 새로고침 간격 (ms)
 * @param {boolean} options.autoRefresh - 자동 새로고침 활성화
 */
export function useSummaries(options = {}) {
  const {
    validated = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    autoRefresh = true,
  } = options;

  const [summaries, setSummaries] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 데이터 가져오기
  const fetchSummaries = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = validated
        ? await summaryAPI.getValidated()
        : await summaryAPI.getAll();

      if (response.success) {
        setSummaries(response.data?.summaries || response.summaries || []);
        setLastUpdated(response.data?.lastUpdated || response.lastUpdated || new Date().toISOString());
      } else {
        throw new Error(response.error || '데이터를 가져올 수 없습니다');
      }
    } catch (err) {
      console.error('[useSummaries] 요약 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [validated]);

  // 수동 새로고침
  const refresh = useCallback(() => {
    fetchSummaries(true);
  }, [fetchSummaries]);

  // 초기 로드
  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('[useSummaries] 자동 새로고침');
      fetchSummaries(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSummaries]);

  // 카테고리별로 그룹핑된 데이터
  const summariesByCategory = summaries.reduce((acc, summary) => {
    acc[summary.category] = summary;
    return acc;
  }, {});

  return {
    summaries,
    summariesByCategory,
    lastUpdated,
    loading,
    error,
    isRefreshing,
    refresh,
  };
}

/**
 * 프론트엔드 표시용 요약 Hook
 */
export function useDisplaySummaries(options = {}) {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    autoRefresh = true,
  } = options;

  const [summaries, setSummaries] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await summaryAPI.getForDisplay();

      if (response.success) {
        setSummaries(response.summaries || []);
        setLastUpdated(response.lastUpdated);
      }
    } catch (err) {
      console.error('[useDisplaySummaries] 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { summaries, lastUpdated, loading, error, refresh: fetchData };
}

export default useSummaries;
