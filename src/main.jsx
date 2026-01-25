import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import CategorySettings from './pages/CategorySettings.jsx'
import ComplianceMonitoring from './pages/ComplianceMonitoring.jsx'
import CopyrightPolicy from './pages/CopyrightPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import Feedback from './pages/Feedback.jsx'
import FeedbackPost from './pages/FeedbackPost.jsx'
import FeedbackWrite from './pages/FeedbackWrite.jsx'
import AllNews from './pages/AllNews.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import MagicLinkVerify from './pages/MagicLinkVerify.jsx'
import Admin from './pages/Admin.jsx'
import './styles/App.css'
import './styles/Ticker.css'
import './styles/Settings.css'
import './styles/Monitoring.css'
import './styles/Auth.css'
import './styles/Legal.css'
import './styles/AllNews.css'
import './styles/Admin.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 메인 페이지 */}
          <Route path="/" element={<App />} />
          <Route path="/settings" element={<CategorySettings />} />
          <Route path="/monitoring" element={<ComplianceMonitoring />} />
          <Route path="/news" element={<AllNews />} />

          {/* 법적 문서 페이지 */}
          <Route path="/copyright" element={<CopyrightPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/feedback/write" element={<FeedbackWrite />} />
          <Route path="/feedback/edit/:id" element={<FeedbackWrite />} />
          <Route path="/feedback/:id" element={<FeedbackPost />} />

          {/* 관리자 페이지 */}
          <Route path="/admin" element={<Admin />} />

          {/* 인증 페이지 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* OAuth 콜백 */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/magic" element={<MagicLinkVerify />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
