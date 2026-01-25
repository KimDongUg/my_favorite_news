// 크롤링 소스 설정
// 우선순위: RSS 피드 > 공개 API > robots.txt 허용 범위 내 크롤링

export const sources = {
  '속보': [
    {
      name: '연합뉴스 속보',
      url: 'https://www.yonhapnewstv.co.kr/browse/feed/',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News 속보',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '정치': [
    {
      name: 'Google News 정치',
      url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtdHZLQUFQAQ?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '국회뉴스',
      url: 'https://news.google.com/rss/search?q=%EC%A0%95%EC%B9%98+%EA%B5%AD%ED%9A%8C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '경제·금융': [
    {
      name: 'Google News 경제',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '금융 뉴스',
      url: 'https://news.google.com/rss/search?q=%EA%B8%88%EC%9C%B5+%EC%A3%BC%EC%8B%9D&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '범죄·법': [
    {
      name: 'Google News 사건사고',
      url: 'https://news.google.com/rss/search?q=%EC%82%AC%EA%B1%B4%EC%82%AC%EA%B3%A0+%EB%B2%94%EC%A3%84&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '법원 재판',
      url: 'https://news.google.com/rss/search?q=%EC%9E%AC%ED%8C%90+%ED%8C%90%EA%B2%B0&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '국내': [
    {
      name: 'KBS 뉴스',
      url: 'http://world.kbs.co.kr/rss/rss_news.htm?lang=k',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News 국내',
      url: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '국제': [
    {
      name: 'Google News 국제',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: 'BBC Korea',
      url: 'https://feeds.bbci.co.uk/korean/rss.xml',
      type: 'rss',
      enabled: true
    }
  ],
  '건강': [
    {
      name: 'Google News 건강',
      url: 'https://news.google.com/rss/search?q=%EA%B1%B4%EA%B0%95+%EC%9D%98%EB%A3%8C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '의료 뉴스',
      url: 'https://news.google.com/rss/search?q=%EB%B3%91%EC%9B%90+%EC%B9%98%EB%A3%8C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '연예·문화': [
    {
      name: 'Google News 연예',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '문화 뉴스',
      url: 'https://news.google.com/rss/search?q=%EC%98%81%ED%99%94+%EB%93%9C%EB%9D%BC%EB%A7%88+%EC%9D%8C%EC%95%85&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '스포츠': [
    {
      name: 'Google News 스포츠',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: 'ESPN',
      url: 'https://www.espn.com/espn/rss/news',
      type: 'rss',
      enabled: true
    }
  ],
  'IT·기술': [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      type: 'rss',
      enabled: true
    },
    {
      name: 'Google News IT',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '라이프': [
    {
      name: 'Google News 라이프스타일',
      url: 'https://news.google.com/rss/search?q=%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC+%ED%8C%A8%EC%85%98&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '취미 트렌드',
      url: 'https://news.google.com/rss/search?q=%EC%B7%A8%EB%AF%B8+%ED%8A%B8%EB%A0%8C%EB%93%9C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '교육': [
    {
      name: 'Google News 교육',
      url: 'https://news.google.com/rss/search?q=%EA%B5%90%EC%9C%A1+%EC%9E%85%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '대학 뉴스',
      url: 'https://news.google.com/rss/search?q=%EB%8C%80%ED%95%99+%EC%88%98%EB%8A%A5&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '환경': [
    {
      name: 'Google News 환경',
      url: 'https://news.google.com/rss/search?q=%ED%99%98%EA%B2%BD+%EA%B8%B0%ED%9B%84&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '기후변화',
      url: 'https://news.google.com/rss/search?q=%EA%B8%B0%ED%9B%84%EB%B3%80%ED%99%94+%ED%83%84%EC%86%8C%EC%A4%91%EB%A6%BD&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '칼럼·사설': [
    {
      name: 'Google News 칼럼',
      url: 'https://news.google.com/rss/search?q=%EC%B9%BC%EB%9F%BC+%EC%82%AC%EC%84%A4+%EA%B8%B0%EA%B3%A0&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '오피니언',
      url: 'https://news.google.com/rss/search?q=%EC%98%A4%ED%94%BC%EB%8B%88%EC%96%B8+%EC%A3%BC%EC%9E%A5&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '여행': [
    {
      name: 'Google News 여행',
      url: 'https://news.google.com/rss/search?q=%EC%97%AC%ED%96%89+%EA%B4%80%EA%B4%91&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '지역 문화',
      url: 'https://news.google.com/rss/search?q=%EC%A7%80%EC%97%AD%EB%AC%B8%ED%99%94+%EC%B6%95%EC%A0%9C&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '음식': [
    {
      name: 'Google News 음식',
      url: 'https://news.google.com/rss/search?q=%EC%9D%8C%EC%8B%9D+%EB%A7%9B%EC%A7%91&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '레시피',
      url: 'https://news.google.com/rss/search?q=%EB%A0%88%EC%8B%9C%ED%94%BC+%EC%9A%94%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '휴먼스토리': [
    {
      name: 'Google News 휴먼',
      url: 'https://news.google.com/rss/search?q=%EA%B0%90%EB%8F%99+%EC%8A%A4%ED%86%A0%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '사회 이야기',
      url: 'https://news.google.com/rss/search?q=%ED%9C%B4%EB%A8%BC%EC%8A%A4%ED%86%A0%EB%A6%AC+%EB%AF%B8%EB%8B%B4&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '과학': [
    {
      name: 'Google News 과학',
      url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '우주 과학',
      url: 'https://news.google.com/rss/search?q=%EC%9A%B0%EC%A3%BC+NASA+%EA%B3%BC%ED%95%99&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '취업·직장': [
    {
      name: 'Google News 취업',
      url: 'https://news.google.com/rss/search?q=%EC%B7%A8%EC%97%85+%EC%B1%84%EC%9A%A9&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '직장 커리어',
      url: 'https://news.google.com/rss/search?q=%EC%A7%81%EC%9E%A5%EC%9D%B8+%EC%BB%A4%EB%A6%AC%EC%96%B4&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    }
  ],
  '재테크': [
    {
      name: 'Google News 재테크',
      url: 'https://news.google.com/rss/search?q=%EC%9E%AC%ED%85%8C%ED%81%AC+%ED%88%AC%EC%9E%90&hl=ko&gl=KR&ceid=KR:ko',
      type: 'rss',
      enabled: true
    },
    {
      name: '자산관리',
      url: 'https://news.google.com/rss/search?q=%EC%A0%88%EC%95%BD+%EC%9E%90%EC%82%B0%EA%B4%80%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko',
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
