import axios from 'axios';
import { crawlConfig } from '../config/sources.js';
import { extractDomain } from './helpers.js';

// robots.txt 캐시
const robotsCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

/**
 * robots.txt 파싱
 * @param {string} robotsTxt - robots.txt 내용
 * @returns {Object} 파싱된 규칙
 */
function parseRobotsTxt(robotsTxt) {
  const rules = {
    disallow: [],
    allow: [],
    crawlDelay: null
  };

  let currentUserAgent = null;
  const lines = robotsTxt.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();

    // 주석 제거
    const commentIndex = trimmedLine.indexOf('#');
    const cleanLine = commentIndex >= 0
      ? trimmedLine.substring(0, commentIndex).trim()
      : trimmedLine;

    if (!cleanLine) continue;

    // User-agent 확인
    if (cleanLine.startsWith('user-agent:')) {
      const agent = cleanLine.replace('user-agent:', '').trim();
      currentUserAgent = agent;
    }

    // * 또는 우리 봇에 적용되는 규칙만 수집
    if (currentUserAgent === '*' || currentUserAgent === 'mynewsbot') {
      if (cleanLine.startsWith('disallow:')) {
        const path = cleanLine.replace('disallow:', '').trim();
        if (path) rules.disallow.push(path);
      } else if (cleanLine.startsWith('allow:')) {
        const path = cleanLine.replace('allow:', '').trim();
        if (path) rules.allow.push(path);
      } else if (cleanLine.startsWith('crawl-delay:')) {
        const delay = parseInt(cleanLine.replace('crawl-delay:', '').trim());
        if (!isNaN(delay)) rules.crawlDelay = delay * 1000;
      }
    }
  }

  return rules;
}

/**
 * URL이 크롤링 허용되는지 확인
 * @param {string} url - 확인할 URL
 * @returns {Promise<boolean>} 허용 여부
 */
export async function isAllowedToCrawl(url) {
  try {
    const domain = extractDomain(url);
    if (!domain) return false;

    // 캐시 확인
    const cacheKey = domain;
    const cached = robotsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return checkRules(url, cached.rules);
    }

    // robots.txt 가져오기
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': crawlConfig.userAgent
      }
    });

    const rules = parseRobotsTxt(response.data);

    // 캐시에 저장
    robotsCache.set(cacheKey, {
      rules,
      timestamp: Date.now()
    });

    return checkRules(url, rules);

  } catch (error) {
    // robots.txt가 없거나 접근 불가능하면 허용으로 간주
    console.log(`[Robots] robots.txt 확인 불가: ${url}`);
    return true;
  }
}

/**
 * URL이 규칙에 맞는지 확인
 * @param {string} url - URL
 * @param {Object} rules - robots.txt 규칙
 * @returns {boolean} 허용 여부
 */
function checkRules(url, rules) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Allow 규칙 먼저 확인
    for (const allowPath of rules.allow) {
      if (path.startsWith(allowPath)) {
        return true;
      }
    }

    // Disallow 규칙 확인
    for (const disallowPath of rules.disallow) {
      if (disallowPath === '/' || path.startsWith(disallowPath)) {
        return false;
      }
    }

    return true;

  } catch {
    return true;
  }
}

/**
 * 크롤링 딜레이 가져오기
 * @param {string} url - URL
 * @returns {number|null} 딜레이 (밀리초)
 */
export function getCrawlDelay(url) {
  const domain = extractDomain(url);
  const cached = robotsCache.get(domain);

  if (cached && cached.rules.crawlDelay) {
    return cached.rules.crawlDelay;
  }

  return null;
}
