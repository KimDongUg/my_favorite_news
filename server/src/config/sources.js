// 크롤링 소스 설정
// 우선순위: RSS 피드 > 공개 API > robots.txt 허용 범위 내 크롤링

export const sources = {
  뉴스: [
    {
      name: '연합뉴스',
      url: 'https://www.yonhapnewstv.co.kr/browse/feed/',
      type: 'rss',
      enabled: true
    },
    {
      name: 'KBS 뉴스',
      url: 'http://world.kbs.co.kr/rss/rss_news.htm?lang=k',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News Korea',
      url: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  스포츠: [
    {
      name: 'ESPN',
      url: 'https://www.espn.com/espn/rss/news',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News Sports',
      url: 'https://news.google.com/rss/search?q=%EC%8A%A4%ED%8F%AC%EC%B8%A0&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  연예: [
    {
      name: 'Google News Entertainment',
      url: 'https://news.google.com/rss/search?q=%EC%97%B0%EC%98%88&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  반려동물: [
    {
      name: 'Google News Pets',
      url: 'https://news.google.com/rss/search?q=%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  IT: [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News Tech',
      url: 'https://news.google.com/rss/search?q=IT+%EA%B8%B0%EC%88%A0&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  건강: [
    {
      name: 'Google News Health',
      url: 'https://news.google.com/rss/search?q=%EA%B1%B4%EA%B0%95&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  여행: [
    {
      name: 'Google News Travel',
      url: 'https://news.google.com/rss/search?q=%EC%97%AC%ED%96%89&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  음식: [
    {
      name: 'Google News Food',
      url: 'https://news.google.com/rss/search?q=%EC%9D%8C%EC%8B%9D+%EB%A7%9B%EC%A7%91&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  경제: [
    {
      name: 'Google News Economy',
      url: 'https://news.google.com/rss/search?q=%EA%B2%BD%EC%A0%9C+%EA%B8%88%EC%9C%B5&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  교육: [
    {
      name: 'Google News Education',
      url: 'https://news.google.com/rss/search?q=%EA%B5%90%EC%9C%A1&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ]
};

// 크롤링 설정
export const crawlConfig = {
  // 크롤링 간격 (밀리초)
  crawlInterval: 30 * 60 * 1000, // 30분

  // 요청 간 딜레이 (서버 부하 방지)
  requestDelay: 2000, // 2초

  // User-Agent
  userAgent: 'MyNewsBot/1.0 (+https://mynews.example.com/bot)',

  // 카테고리당 최대 아이템 수
  maxItemsPerCategory: 10,

  // 타임아웃
  timeout: 10000 // 10초
};
