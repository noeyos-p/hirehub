// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './index.css';
import Layout from './layout/Layout';
import MainPage from './mainPage/MainPage';
import BoardPage from './boardPage/BoardPage';
import SignInfo from './signInfo/SignInfo';
import AdminLayout from './adminPage/AdminPage';
import MyPage from './myPage/MyPage';
import Login from './signPage/login/Login';
import Signup from './signPage/signup/SignUp';
import JobPostings from './jobPostings/JobPostings';
import CompanyDetail from './jobPostings/jopPostingComponents/CompanyDetail';
import JobDetailWrapper from './jobPostings/jopPostingComponents/JobDetailWrapper';
import ChatBot from './chatBot/ChatBot';
import ResumeViewer from './myPage/resume/ResumeViewer';
import AuthCallback from './page/AuthCallback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 홈 */}
        <Route path="/" element={<Layout><MainPage /></Layout>} />

        {/* 게시판 */}
        <Route path="/board/*" element={<Layout><BoardPage /></Layout>} />

        {/* 관리자 */}
        <Route path="/admin" element={<Navigate to="/admin/job-management" replace />} />
        <Route path="/admin/:tab/*" element={<Layout><AdminLayout /></Layout>} />

        {/* 마이페이지 */}
        <Route path="/myPage" element={<Navigate to="/myPage/MyInfo" replace />} />
        <Route path="/myPage/:tab/*" element={<Layout><MyPage /></Layout>} />

        {/* 채용 공고 */}
        <Route path="/jobPostings" element={<Layout><JobPostings /></Layout>} />
        <Route path="/jobPostings/:jobId" element={<Layout><JobDetailWrapper /></Layout>} />

        {/* 로그인/회원가입 */}
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />

        {/* ✅ 온보딩 (회원가입 후 정보 입력) */}
        <Route path="/signInfo" element={<Layout><SignInfo /></Layout>} />

        {/* ✅ OAuth 콜백 (카카오/구글/네이버 로그인 후) */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 챗봇/기업 상세 */}
        <Route path="/chatBot" element={<Layout><ChatBot /></Layout>} />
        <Route path="/company/:companyId" element={<Layout><CompanyDetail onBack={() => window.history.back()} /></Layout>} />

        <Route path="/myPage/resume/ResumeViewer/:id" element={<ResumeViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;