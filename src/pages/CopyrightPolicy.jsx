import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function CopyrightPolicy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← 홈으로</Link>
        <h1>저작권 모니터링 정책</h1>
        <p className="version-info">버전 1.0 | 시행일: 2026년 1월 25일</p>
      </header>

      <main className="legal-content">
        <nav className="legal-toc">
          <h3>목차</h3>
          <ol>
            <li><a href="#purpose">정책 목적</a></li>
            <li><a href="#usage">저작물 이용 방식</a></li>
            <li><a href="#protection">저작권자 보호 조치</a></li>
            <li><a href="#monitoring">모니터링 체계</a></li>
            <li><a href="#report">침해 신고 절차</a></li>
            <li><a href="#partnership">협력 언론사 관계</a></li>
            <li><a href="#contact">연락처</a></li>
          </ol>
        </nav>

        <section id="purpose" className="legal-section">
          <h2>1. 정책 목적</h2>
          <p>
            본 정책은 뉴스 큐레이션 서비스 "내가 좋아하는 세상 정보"가 뉴스 콘텐츠 수집 및
            큐레이션 과정에서 발생할 수 있는 저작권 침해를 예방하고, 신속하게 대응하기 위한
            체계를 수립하기 위해 제정되었습니다.
          </p>
          <p>
            당사는 저작권법을 준수하며, 모든 저작권자의 권리를 존중합니다.
          </p>
        </section>

        <section id="usage" className="legal-section">
          <h2>2. 저작물 이용 방식</h2>

          <h3>2.1 콘텐츠 표시 원칙</h3>
          <ul>
            <li>뉴스 <strong>제목, 요약문, 썸네일 이미지</strong>만 표시합니다.</li>
            <li>전체 기사는 <strong>원문 사이트로 링크</strong>를 제공합니다.</li>
            <li>모든 콘텐츠에 <strong>출처를 명확히 표기</strong>합니다.</li>
          </ul>

          <h3>2.2 공정이용(Fair Use) 원칙</h3>
          <p>당사는 다음의 공정이용 원칙을 준수합니다:</p>
          <ul>
            <li>비영리적 정보 제공 목적으로만 이용</li>
            <li>원저작물의 시장 가치를 대체하지 않음</li>
            <li>필요 최소한의 범위 내에서만 인용</li>
            <li>원문 기사로의 트래픽 유도</li>
          </ul>
        </section>

        <section id="protection" className="legal-section">
          <h2>3. 저작권자 보호 조치</h2>

          <h3>3.1 robots.txt 준수</h3>
          <ul>
            <li>모든 웹사이트의 robots.txt 파일을 확인하고 준수합니다.</li>
            <li>크롤링 금지 표시가 있는 경우 즉시 수집을 중단합니다.</li>
          </ul>

          <h3>3.2 기술적 보호 조치</h3>
          <ul>
            <li>User-Agent를 명확히 명시합니다.</li>
            <li>크롤링 속도를 제한하여 서버 부하를 최소화합니다.</li>
            <li>중복 콘텐츠 탐지 시스템을 운영합니다.</li>
          </ul>

          <h3>3.3 즉시 삭제(Takedown) 절차</h3>
          <div className="highlight-box">
            <p><strong>신고 접수 즉시</strong> 해당 콘텐츠를 비공개 처리합니다.</p>
            <p>저작권자 확인 후 <strong>영구 삭제 또는 복원</strong> 조치를 진행합니다.</p>
          </div>
        </section>

        <section id="monitoring" className="legal-section">
          <h2>4. 모니터링 체계</h2>

          <h3>4.1 자동 모니터링 시스템</h3>
          <ul>
            <li>중복 콘텐츠 탐지</li>
            <li>과도한 인용 감지</li>
            <li>출처 표기 누락 확인</li>
          </ul>

          <h3>4.2 정기 감사</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>주기</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>월 1회</td>
                <td>저작권 준수 현황 점검</td>
              </tr>
              <tr>
                <td>분기 1회</td>
                <td>법률 자문 검토</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="report" className="legal-section">
          <h2>5. 침해 신고 절차</h2>

          <h3>5.1 신고 방법</h3>
          <div className="contact-box">
            <p><strong>신고 접수 이메일:</strong> copyright@myfavoritenews.com</p>
          </div>

          <h3>5.2 신고 시 필요 정보</h3>
          <ul>
            <li>저작권자 또는 대리인의 신원 정보</li>
            <li>침해 주장 저작물의 상세 정보</li>
            <li>침해 콘텐츠의 URL</li>
            <li>저작권 소유 증빙 자료</li>
            <li>연락처 정보</li>
          </ul>

          <h3>5.3 처리 절차</h3>
          <div className="process-timeline">
            <div className="process-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>신고 접수</h4>
                <p>이메일로 신고 접수</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>1차 검토</h4>
                <p>24시간 이내</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>조치 완료</h4>
                <p>72시간 이내</p>
              </div>
            </div>
          </div>
        </section>

        <section id="partnership" className="legal-section">
          <h2>6. 협력 언론사 관계</h2>
          <ul>
            <li>제휴 계약 체결 절차를 운영합니다.</li>
            <li>콘텐츠 사용 범위를 명확히 합니다.</li>
            <li>필요시 수익 배분 모델을 적용합니다.</li>
          </ul>
        </section>

        <section id="contact" className="legal-section">
          <h2>7. 연락처</h2>
          <div className="contact-info">
            <p><strong>저작권 관련 문의:</strong> copyright@myfavoritenews.com</p>
            <p><strong>일반 문의:</strong> contact@myfavoritenews.com</p>
          </div>
        </section>
      </main>

      <footer className="legal-footer">
        <div className="legal-nav">
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <Link to="/monitoring">컴플라이언스 현황</Link>
        </div>
        <p>&copy; 2026 내가 좋아하는 세상 정보. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default CopyrightPolicy;
