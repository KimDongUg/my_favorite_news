import Parser from 'rss-parser';
import { crawlConfig } from '../config/sources.js';
import { generateId, delay, cleanText } from '../utils/helpers.js';

const parser = new Parser({
  timeout: crawlConfig.timeout,
  headers: {
    'User-Agent': crawlConfig.userAgent
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

/**
 * RSS 피드에서 뉴스 크롤링
 * @param {Object} source - 소스 정보
 * @param {string} category - 카테고리명
 * @returns {Promise<Array>} 크롤링된 아이템 배열
 */
export async function crawlRssFeed(source, category) {
  try {
    console.log(`[RSS] 크롤링 시작: ${source.name} (${category})`);

    const feed = await parser.parseURL(source.url);
    const items = [];

    const maxItems = Math.min(
      feed.items.length,
      crawlConfig.maxItemsPerCategory
    );

    for (let i = 0; i < maxItems; i++) {
      const item = feed.items[i];

      const crawledItem = {
        id: generateId(),
        category,
        originalTitle: cleanText(item.title || ''),
        originalUrl: item.link || '',
        sourceName: source.name,
        publishedDate: item.pubDate || item.isoDate || new Date().toISOString(),
        snippet: cleanText(item.contentSnippet || item.content || item.description || ''),
        rawContent: cleanText(
          item.contentEncoded ||
          item.content ||
          item.description ||
          ''
        ),
        imageUrl: extractImageUrl(item),
        crawledAt: new Date().toISOString()
      };

      items.push(crawledItem);
    }

    console.log(`[RSS] 크롤링 완료: ${source.name} - ${items.length}개 아이템`);
    return items;

  } catch (error) {
    console.error(`[RSS] 크롤링 실패: ${source.name}`, error.message);
    return [];
  }
}

/**
 * 이미지 URL 추출
 */
function extractImageUrl(item) {
  // media:content에서 추출
  if (item.media && item.media.$) {
    return item.media.$.url;
  }

  // media:thumbnail에서 추출
  if (item.thumbnail && item.thumbnail.$) {
    return item.thumbnail.$.url;
  }

  // enclosure에서 추출
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // content에서 img 태그 추출
  const content = item.contentEncoded || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return null;
}

/**
 * 여러 RSS 소스에서 크롤링
 * @param {Array} sources - 소스 배열
 * @param {string} category - 카테고리명
 * @returns {Promise<Array>} 모든 크롤링 결과
 */
export async function crawlMultipleRssFeeds(sources, category) {
  const allItems = [];

  for (const source of sources) {
    if (!source.enabled || source.type !== 'rss') continue;

    const items = await crawlRssFeed(source, category);
    allItems.push(...items);

    // 요청 간 딜레이
    await delay(crawlConfig.requestDelay);
  }

  // 최신순 정렬
  allItems.sort((a, b) =>
    new Date(b.publishedDate) - new Date(a.publishedDate)
  );

  return allItems;
}
