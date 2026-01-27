import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← 홈으로</Link>
        <h1>개인정보처리방침</h1>
        <p className="version-info">버전 1.0 | 시행일: 2026년 1월 25일</p>
      </header>

      <main className="legal-content">
        <nav className="legal-toc">
          <h3>목차</h3>
          <ol>
            <li><a href="#collection">개인정보의 수집 및 이용 목적</a></li>
            <li><a href="#retention">개인정보의 처리 및 보유 기간</a></li>
            <li><a href="#thirdparty">개인정보의 제3자 제공</a></li>
            <li><a href="#outsourcing">개인정보 처리 위탁</a></li>
            <li><a href="#rights">정보주체의 권리 및 행사 방법</a></li>
            <li><a href="#destruction">개인정보의 파기</a></li>
            <li><a href="#officer">개인정보 보호책임자</a></li>
            <li><a href="#security">보안 조치</a></li>
            <li><a href="#cookie">쿠키 및 자동 수집 정보</a></li>
            <li><a href="#report">침해 신고 및 상담</a></li>
          </ol>
        </nav>

        <div className="legal-intro">
          <p>
            "무빙아티클(Moving Article)" (이하 "회사")는 개인정보보호법 제30조에 따라 정보주체의
            개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여
            다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>
        </div>

        <section id="collection" className="legal-section">
          <h2>제1조 (개인정보의 수집 및 이용 목적)</h2>
          <p>회사는 다음의 목적을 위해 개인정보를 수집·이용합니다.</p>

          <h3>1. 회원 가입 및 관리</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>수집 항목</th>
                <th>이용 목적</th>
                <th>필수 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>이메일</td>
                <td>회원 식별, 서비스 이용 통지</td>
                <td>필수</td>
              </tr>
              <tr>
                <td>비밀번호</td>
                <td>회원 인증</td>
                <td>필수</td>
              </tr>
              <tr>
                <td>닉네임</td>
                <td>서비스 내 표시</td>
                <td>필수</td>
              </tr>
            </tbody>
          </table>

          <h3>2. 서비스 제공 및 개선</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>수집 항목</th>
                <th>이용 목적</th>
                <th>필수 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>뉴스 읽기 이력</td>
                <td>맞춤형 콘텐츠 추천</td>
                <td>자동 수집</td>
              </tr>
              <tr>
                <td>관심 카테고리</td>
                <td>개인화 서비스 제공</td>
                <td>선택</td>
              </tr>
              <tr>
                <td>북마크</td>
                <td>저장 기능 제공</td>
                <td>선택</td>
              </tr>
            </tbody>
          </table>

          <h3>3. 마케팅 및 광고 (선택)</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>수집 항목</th>
                <th>이용 목적</th>
                <th>필수 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>이메일 (수신 동의 시)</td>
                <td>신규 서비스 안내, 이벤트 정보 제공</td>
                <td>선택</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="retention" className="legal-section">
          <h2>제2조 (개인정보의 처리 및 보유 기간)</h2>
          <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 동의 받은 기간 내에서 개인정보를 처리·보유합니다.</p>

          <h3>1. 회원 정보</h3>
          <div className="highlight-box">
            <p><strong>보유 기간:</strong> 회원 탈퇴 시까지</p>
          </div>

          <h3>2. 서비스 이용 기록</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>항목</th>
                <th>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>로그인 기록</td>
                <td>3개월</td>
              </tr>
              <tr>
                <td>콘텐츠 이용 기록</td>
                <td>1년</td>
              </tr>
            </tbody>
          </table>

          <h3>3. 법령에 따른 보존</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>보존 항목</th>
                <th>보존 기간</th>
                <th>근거 법령</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>계약 또는 청약철회 기록</td>
                <td>5년</td>
                <td>전자상거래법</td>
              </tr>
              <tr>
                <td>소비자 불만 또는 분쟁처리 기록</td>
                <td>3년</td>
                <td>전자상거래법</td>
              </tr>
              <tr>
                <td>접속 로그 기록</td>
                <td>3개월</td>
                <td>통신비밀보호법</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="thirdparty" className="legal-section">
          <h2>제3조 (개인정보의 제3자 제공)</h2>
          <p>
            회사는 <strong>원칙적으로 개인정보를 제3자에게 제공하지 않습니다.</strong>
            다만, 아래의 경우에는 예외로 합니다:
          </p>
          <ul>
            <li>사용자의 <strong>사전 동의</strong>를 받은 경우</li>
            <li>법령에 의해 요구되는 경우</li>
            <li>수사 목적의 관계 기관 요청</li>
            <li>법원의 영장에 따른 제공</li>
          </ul>
        </section>

        <section id="outsourcing" className="legal-section">
          <h2>제4조 (개인정보 처리 위탁)</h2>
          <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다:</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>수탁 업체</th>
                <th>위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>클라우드 서비스 제공업체</td>
                <td>데이터 저장 및 관리</td>
              </tr>
              <tr>
                <td>이메일 발송 서비스</td>
                <td>이메일 발송 대행</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="rights" className="legal-section">
          <h2>제5조 (정보주체의 권리 및 행사 방법)</h2>
          <p>사용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>

          <div className="rights-grid">
            <div className="right-card">
              <h4>열람권</h4>
              <p>개인정보 열람 요구</p>
            </div>
            <div className="right-card">
              <h4>정정권</h4>
              <p>개인정보 정정 및 삭제 요구</p>
            </div>
            <div className="right-card">
              <h4>처리정지권</h4>
              <p>개인정보 처리 정지 요구</p>
            </div>
            <div className="right-card">
              <h4>동의철회권</h4>
              <p>동의 철회 요구</p>
            </div>
          </div>

          <h3>행사 방법</h3>
          <ul>
            <li>서비스 내 <strong>'설정'</strong> 메뉴 이용</li>
            <li>고객센터 이메일: <strong>privacy@myfavoritenews.com</strong></li>
            <li>서면, 전화, 이메일 등을 통한 요청</li>
          </ul>
        </section>

        <section id="destruction" className="legal-section">
          <h2>제6조 (개인정보의 파기)</h2>

          <h3>파기 절차</h3>
          <ol>
            <li>보유 기간 경과 즉시 파기</li>
            <li>내부 방침에 따라 별도 저장된 정보는 법령에 따라 일정 기간 보관 후 파기</li>
          </ol>

          <h3>파기 방법</h3>
          <table className="legal-table">
            <thead>
              <tr>
                <th>정보 형태</th>
                <th>파기 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>전자적 파일</td>
                <td>복구 불가능한 방법으로 영구 삭제</td>
              </tr>
              <tr>
                <td>종이 문서</td>
                <td>분쇄 또는 소각</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="officer" className="legal-section">
          <h2>제7조 (개인정보 보호책임자)</h2>
          <div className="contact-box officer-info">
            <p><strong>개인정보 보호책임자</strong></p>
            <ul>
              <li><strong>성명:</strong> 홍길동</li>
              <li><strong>직책:</strong> 개인정보보호팀장</li>
              <li><strong>연락처:</strong> privacy@myfavoritenews.com</li>
            </ul>
          </div>
        </section>

        <section id="security" className="legal-section">
          <h2>제8조 (개인정보 보호 관련 기술적/관리적 조치)</h2>

          <h3>기술적 조치</h3>
          <ul>
            <li>개인정보 암호화 (비밀번호, 민감정보)</li>
            <li>해킹 방지 시스템 (방화벽, IDS 등)</li>
            <li>SSL/TLS 보안 통신</li>
            <li>정기적 보안 점검 및 업데이트</li>
          </ul>

          <h3>관리적 조치</h3>
          <ul>
            <li>개인정보 접근 권한 최소화</li>
            <li>직원 교육 실시</li>
            <li>개인정보 처리 시스템 접속 기록 보관</li>
          </ul>
        </section>

        <section id="cookie" className="legal-section">
          <h2>제9조 (쿠키 및 자동 수집 정보)</h2>

          <h3>쿠키 사용 목적</h3>
          <ul>
            <li>로그인 상태 유지</li>
            <li>사용자 맞춤 서비스 제공</li>
            <li>접속 빈도 분석</li>
          </ul>

          <h3>쿠키 거부 방법</h3>
          <div className="highlight-box">
            <p>브라우저 설정을 통해 쿠키를 차단할 수 있습니다.</p>
            <p><strong>주의:</strong> 쿠키 차단 시 일부 서비스 이용이 제한될 수 있습니다.</p>
          </div>
        </section>

        <section id="report" className="legal-section">
          <h2>제10조 (개인정보 침해 신고 및 상담)</h2>
          <p>개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다:</p>

          <div className="report-agencies">
            <div className="agency-card">
              <h4>개인정보침해 신고센터</h4>
              <p>(국번없이) <strong>118</strong></p>
              <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer">
                privacy.kisa.or.kr
              </a>
            </div>
            <div className="agency-card">
              <h4>대검찰청 사이버수사과</h4>
              <p>(국번없이) <strong>1301</strong></p>
              <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer">
                www.spo.go.kr
              </a>
            </div>
            <div className="agency-card">
              <h4>경찰청 사이버안전국</h4>
              <p>(국번없이) <strong>182</strong></p>
              <a href="https://cyberbureau.police.go.kr" target="_blank" rel="noopener noreferrer">
                cyberbureau.police.go.kr
              </a>
            </div>
          </div>
        </section>

        <div className="legal-appendix">
          <h2>부칙</h2>
          <ol>
            <li>본 개인정보처리방침은 <strong>2026년 1월 25일</strong>부터 시행됩니다.</li>
            <li>이전 개인정보처리방침은 본 방침으로 대체됩니다.</li>
          </ol>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-nav">
          <Link to="/copyright">저작권 정책</Link>
          <Link to="/terms">이용약관</Link>
          <Link to="/monitoring">컴플라이언스 현황</Link>
        </div>
        <p>&copy; 2026 무빙아티클(Moving Article). All rights reserved.</p>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
