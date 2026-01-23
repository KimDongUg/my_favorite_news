/**
 * API 요청 로깅 미들웨어
 */

// 로그 색상 (콘솔용)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// HTTP 메서드별 색상
const methodColors = {
  GET: colors.green,
  POST: colors.yellow,
  PUT: colors.blue,
  DELETE: colors.red,
  PATCH: colors.magenta
};

/**
 * 요청 로깅 미들웨어
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const methodColor = methodColors[req.method] || colors.reset;
    const statusColor = res.statusCode >= 400 ? colors.red :
                        res.statusCode >= 300 ? colors.yellow : colors.green;

    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const log = [
      `${colors.dim}[${timestamp}]${colors.reset}`,
      `${methodColor}${req.method}${colors.reset}`,
      req.originalUrl,
      `${statusColor}${res.statusCode}${colors.reset}`,
      `${colors.dim}${duration}ms${colors.reset}`
    ].join(' ');

    console.log(log);
  });

  next();
}

/**
 * 에러 로깅 미들웨어
 */
export function errorLogger(err, req, res, next) {
  const timestamp = new Date().toISOString();

  console.error(`${colors.red}[ERROR]${colors.reset} ${timestamp}`);
  console.error(`  Path: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);

  if (process.env.NODE_ENV !== 'production') {
    console.error(`  Stack: ${err.stack}`);
  }

  next(err);
}

/**
 * 에러 응답 핸들러
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

/**
 * 404 핸들러
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.originalUrl
  });
}

/**
 * 간단한 로거 유틸리티
 */
export const logger = {
  info: (message, ...args) => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
  },
  success: (message, ...args) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.dim}[DEBUG]${colors.reset} ${message}`, ...args);
    }
  }
};

export default {
  requestLogger,
  errorLogger,
  errorHandler,
  notFoundHandler,
  logger
};
