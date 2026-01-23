/**
 * 스케줄링 관리
 * 크롤링 및 요약 자동화
 */

import cron from 'node-cron';
import { runPipeline } from '../pipeline/dataProcessor.js';
import { cleanupOldData } from '../db/database.js';

// 활성 스케줄 저장
const activeSchedules = new Map();

// 스케줄 설정
const defaultSchedules = {
  // 파이프라인 (크롤링 + 요약) - 30분마다
  pipeline: {
    expression: '*/30 * * * *',
    description: '크롤링 및 요약 생성 (30분 간격)',
    enabled: true
  },
  // 데이터 정리 - 매일 새벽 3시
  cleanup: {
    expression: '0 3 * * *',
    description: '오래된 데이터 정리 (매일 03:00)',
    enabled: true
  }
};

/**
 * 스케줄러 초기화
 */
export function initScheduler(options = {}) {
  const schedules = { ...defaultSchedules, ...options };

  console.log('[Scheduler] 스케줄러 초기화');

  // 파이프라인 스케줄
  if (schedules.pipeline.enabled) {
    const pipelineJob = cron.schedule(
      schedules.pipeline.expression,
      async () => {
        console.log('[Cron] 정기 파이프라인 실행...');
        await runPipeline();
      },
      { scheduled: true }
    );
    activeSchedules.set('pipeline', {
      job: pipelineJob,
      ...schedules.pipeline
    });
    console.log(`[Scheduler] 파이프라인: ${schedules.pipeline.description}`);
  }

  // 데이터 정리 스케줄
  if (schedules.cleanup.enabled) {
    const cleanupJob = cron.schedule(
      schedules.cleanup.expression,
      async () => {
        console.log('[Cron] 데이터 정리 실행...');
        cleanupOldData(7); // 7일 이전 데이터 삭제
      },
      { scheduled: true }
    );
    activeSchedules.set('cleanup', {
      job: cleanupJob,
      ...schedules.cleanup
    });
    console.log(`[Scheduler] 정리: ${schedules.cleanup.description}`);
  }

  return activeSchedules;
}

/**
 * 스케줄 상태 조회
 */
export function getScheduleStatus() {
  const status = {};

  for (const [name, schedule] of activeSchedules) {
    status[name] = {
      expression: schedule.expression,
      description: schedule.description,
      enabled: schedule.enabled,
      running: schedule.job?.running || false
    };
  }

  return status;
}

/**
 * 특정 스케줄 시작
 */
export function startSchedule(name) {
  const schedule = activeSchedules.get(name);
  if (schedule?.job) {
    schedule.job.start();
    console.log(`[Scheduler] ${name} 스케줄 시작`);
    return true;
  }
  return false;
}

/**
 * 특정 스케줄 중지
 */
export function stopSchedule(name) {
  const schedule = activeSchedules.get(name);
  if (schedule?.job) {
    schedule.job.stop();
    console.log(`[Scheduler] ${name} 스케줄 중지`);
    return true;
  }
  return false;
}

/**
 * 모든 스케줄 중지
 */
export function stopAllSchedules() {
  for (const [name, schedule] of activeSchedules) {
    if (schedule.job) {
      schedule.job.stop();
    }
  }
  console.log('[Scheduler] 모든 스케줄 중지');
}

/**
 * 스케줄 표현식 유효성 검사
 */
export function validateCronExpression(expression) {
  return cron.validate(expression);
}

/**
 * 새 스케줄 추가
 */
export function addSchedule(name, expression, callback, description = '') {
  if (!validateCronExpression(expression)) {
    throw new Error('Invalid cron expression');
  }

  // 기존 스케줄 있으면 중지
  if (activeSchedules.has(name)) {
    stopSchedule(name);
  }

  const job = cron.schedule(expression, callback, { scheduled: true });

  activeSchedules.set(name, {
    job,
    expression,
    description,
    enabled: true
  });

  console.log(`[Scheduler] 새 스케줄 추가: ${name} (${expression})`);
  return true;
}

export default {
  initScheduler,
  getScheduleStatus,
  startSchedule,
  stopSchedule,
  stopAllSchedules,
  validateCronExpression,
  addSchedule
};
