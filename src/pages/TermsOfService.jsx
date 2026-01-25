import { Link } from 'react-router-dom';
import '../styles/Legal.css';

function TermsOfService() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← 홈으로</Link>
        <h1>이용약관</h1>
        <p className="version-info">버전 1.0 | 시행일: 2026년 1월 25일</p>
      </header>

      <main className="legal-content">
        <nav className="legal-toc">
          <h3>목차</h3>
          <ol>
            <li><a href="#general">총칙</a></li>
            <li><a href="#membership">회원가입 및 탈퇴</a></li>
            <li><a href="#service">서비스 제공 및 변경</a></li>
            <li><a href="#rights">회원의 권리와 의무</a></li>
            <li><a href="#copyright">콘텐츠 및 저작권</a></li>
            <li><a href="#disclaimer">면책 조항</a></li>
            <li><a href="#dispute">분쟁 해결</a></li>
          </ol>
        </nav>

        <section id="general" className="legal-section">
          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 "내가 좋아하는 세상 정보" (이하 "서비스")가 제공하는 뉴스 큐레이션 서비스의
            이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제2조 (용어의 정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
          <ol>
            <li><strong>"서비스"</strong>란 회사가 제공하는 뉴스 큐레이션 플랫폼을 말합니다.</li>
            <li><strong>"회원"</strong>이란 본 약관에 동의하고 서비스에 가입한 자를 말합니다.</li>
            <li><strong>"콘텐츠"</strong>란 서비스 내에서 제공되는 뉴스 기사 및 관련 정보를 말합니다.</li>
            <li><strong>"이용자"</strong>란 회원 여부와 관계없이 서비스를 이용하는 자를 말합니다.</li>
          </ol>

          <h2>제3조 (약관의 효력 및 변경)</h2>
          <ol>
            <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
            <li>
              약관 변경 시 <strong>7일 전</strong> 공지하며, 회원에게 불리한 중요한 변경의 경우
              <strong>30일 전</strong> 공지하고 이메일로 개별 통지합니다.
            </li>
          </ol>
        </section>

        <section id="membership" className="legal-section">
          <h2>제4조 (회원가입)</h2>
          <ol>
            <li><strong>만 14세 이상</strong>인 자만 회원가입이 가능합니다.</li>
            <li>회원가입은 실명 인증 또는 이메일 인증을 통해 진행됩니다.</li>
            <li>
              다음의 경우 회원가입을 거절하거나 사후에 자격을 상실시킬 수 있습니다:
              <ul>
                <li>타인의 정보를 도용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>본 약관을 위반한 경우</li>
              </ul>
            </li>
          </ol>

          <h2>제5조 (회원 정보의 관리)</h2>
          <ol>
            <li>회원은 자신의 계정 정보를 관리할 의무가 있습니다.</li>
            <li>회원은 정보 변경 시 즉시 서비스 내에서 수정해야 합니다.</li>
          </ol>

          <h2>제6조 (회원 탈퇴)</h2>
          <ol>
            <li>회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 요청 시 <strong>즉시 탈퇴 처리</strong>됩니다.</li>
            <li>관련 법령에 따라 일정 기간 정보를 보관해야 하는 경우 해당 기간 동안 보관됩니다.</li>
          </ol>
        </section>

        <section id="service" className="legal-section">
          <h2>제7조 (서비스의 제공)</h2>
          <p>회사는 다음의 서비스를 제공합니다:</p>
          <ul>
            <li>뉴스 콘텐츠 큐레이션</li>
            <li>개인화 추천</li>
            <li>북마크 및 공유 기능</li>
            <li>기타 회사가 정하는 서비스</li>
          </ul>

          <h2>제8조 (서비스 이용 시간)</h2>
          <ol>
            <li>서비스는 <strong>연중무휴 24시간</strong> 제공을 원칙으로 합니다.</li>
            <li>시스템 점검, 증설, 교체 등의 경우 사전 공지 후 서비스를 일시 중단할 수 있습니다.</li>
          </ol>

          <h2>제9조 (서비스의 변경 및 중단)</h2>
          <ol>
            <li>회사는 서비스 운영상 필요한 경우 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
            <li>불가피한 사유로 서비스 제공이 불가능한 경우 이에 대한 책임이 면제됩니다.</li>
            <li>서비스 종료 시 <strong>30일 전</strong>에 공지합니다.</li>
          </ol>
        </section>

        <section id="rights" className="legal-section">
          <h2>제10조 (회원의 의무)</h2>
          <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
          <ul className="prohibited-list">
            <li>타인의 정보 도용</li>
            <li>서비스 운영 방해 행위</li>
            <li>불법 콘텐츠 유포</li>
            <li>자동화 도구를 이용한 무단 수집</li>
            <li>서비스의 상업적 이용 (별도 계약 없이)</li>
            <li>기타 관련 법령 위반 행위</li>
          </ul>

          <h2>제11조 (계정 보안)</h2>
          <ol>
            <li>회원은 자신의 계정 및 비밀번호를 관리할 책임이 있습니다.</li>
            <li>계정 정보 유출로 인한 손해에 대해 회사는 책임을 지지 않습니다.</li>
            <li>계정 도용을 인지한 경우 즉시 회사에 통보해야 합니다.</li>
          </ol>
        </section>

        <section id="copyright" className="legal-section">
          <h2>제12조 (콘텐츠의 저작권)</h2>
          <ol>
            <li>
              서비스에서 제공하는 <strong>뉴스 콘텐츠의 저작권</strong>은 원 저작권자에게 있습니다.
            </li>
            <li>
              플랫폼 요소(디자인, 로고, UI 등)의 저작권은 회사에 있습니다.
            </li>
            <li>
              회원이 작성한 댓글, 리뷰 등의 저작권은 작성자에게 있으며,
              서비스 내 게시 및 활용에 동의한 것으로 간주됩니다.
            </li>
          </ol>

          <h2>제13조 (콘텐츠 이용 제한)</h2>
          <ol>
            <li>서비스 내 콘텐츠를 무단으로 복제, 배포할 수 없습니다.</li>
            <li>상업적 목적으로 이용할 수 없습니다.</li>
            <li>원문 기사 이용 시 해당 언론사의 이용약관을 준수해야 합니다.</li>
          </ol>
        </section>

        <section id="disclaimer" className="legal-section">
          <h2>제14조 (면책 조항)</h2>
          <ol>
            <li>
              <strong>정보의 정확성:</strong> 서비스에서 제공하는 뉴스 콘텐츠는 제3자가 제공한 것으로,
              회사는 그 정확성을 보장하지 않습니다. 사실 확인 책임은 이용자에게 있습니다.
            </li>
            <li>
              <strong>외부 링크:</strong> 외부 사이트로 이동 시 발생하는 문제에 대해 회사는
              책임을 지지 않습니다.
            </li>
            <li>
              <strong>불가항력:</strong> 천재지변, 전쟁, 기술적 장애 등 불가항력적 사유로 인한
              서비스 중단에 대해 회사는 책임을 지지 않습니다.
            </li>
            <li>
              <strong>회원 간 분쟁:</strong> 회원 상호 간 또는 회원과 제3자 간의 분쟁에 대해
              회사는 개입하지 않으며 책임을 지지 않습니다.
            </li>
          </ol>
        </section>

        <section id="dispute" className="legal-section">
          <h2>제15조 (준거법)</h2>
          <p>본 약관은 <strong>대한민국 법률</strong>에 따라 규율되고 해석됩니다.</p>

          <h2>제16조 (관할 법원)</h2>
          <p>
            서비스 이용과 관련하여 발생한 분쟁에 대해서는 <strong>서비스 제공자 소재지</strong>를
            관할하는 법원을 관할 법원으로 합니다.
          </p>

          <h2>제17조 (분쟁 해결)</h2>
          <ol>
            <li>회사와 회원 간 발생한 분쟁은 상호 협의하여 해결합니다.</li>
            <li>협의가 이루어지지 않을 경우 관련 법령에 따라 처리합니다.</li>
          </ol>
        </section>

        <div className="legal-appendix">
          <h2>부칙</h2>
          <ol>
            <li>본 약관은 <strong>2026년 1월 25일</strong>부터 시행됩니다.</li>
            <li>본 약관 시행 이전에 가입한 회원에게도 본 약관이 적용됩니다.</li>
          </ol>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-nav">
          <Link to="/copyright">저작권 정책</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <Link to="/monitoring">컴플라이언스 현황</Link>
        </div>
        <p>&copy; 2026 내가 좋아하는 세상 정보. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default TermsOfService;
