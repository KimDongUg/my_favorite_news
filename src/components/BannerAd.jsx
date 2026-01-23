import { memo, useState, useEffect } from 'react';

const bannerAds = [
  {
    id: 1,
    title: '봄맞이 특별 할인!',
    subtitle: '최대 50% OFF',
    description: '인기 브랜드 전 상품 할인 중',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    link: '#',
  },
  {
    id: 2,
    title: '신규 가입 이벤트',
    subtitle: '첫 구매 무료배송',
    description: '지금 바로 회원가입하세요',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    link: '#',
  },
  {
    id: 3,
    title: '프리미엄 구독 서비스',
    subtitle: '광고 없이 즐기세요',
    description: '첫 달 무료 체험',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    link: '#',
  },
];

const BannerAd = memo(function BannerAd() {
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % bannerAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const ad = bannerAds[currentAd];

  return (
    <div className="banner-ad-container">
      <a
        href={ad.link}
        className="banner-ad"
        style={{ background: ad.bgColor }}
        aria-label={`광고: ${ad.title}`}
      >
        <div className="banner-content">
          <span className="banner-badge">AD</span>
          <div className="banner-text">
            <h3 className="banner-title">{ad.title}</h3>
            <p className="banner-subtitle">{ad.subtitle}</p>
            <p className="banner-description">{ad.description}</p>
          </div>
          <button className="banner-cta">자세히 보기 →</button>
        </div>
      </a>

      <div className="banner-dots">
        {bannerAds.map((_, index) => (
          <button
            key={index}
            className={`banner-dot ${index === currentAd ? 'active' : ''}`}
            onClick={() => setCurrentAd(index)}
            aria-label={`광고 ${index + 1}번으로 이동`}
          />
        ))}
      </div>
    </div>
  );
});

export default BannerAd;
