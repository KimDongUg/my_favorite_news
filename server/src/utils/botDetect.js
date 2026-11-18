import { isbot } from 'isbot';

/**
 * User-Agent로 봇 여부 판정. UA가 비어 있으면 봇으로 본다.
 */
export function isBotUserAgent(ua) {
  if (!ua || !String(ua).trim()) return true;
  return isbot(ua);
}
