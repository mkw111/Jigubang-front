import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignUpChannelPage from "./pages/SignUpChannelPage";
import AptSearchPage from "./pages/AptSearchPage";
import HeaderCheckPage from "./pages/HeaderCheckPage";
import CertPage from "./pages/CertPage";
import AgreePage from "./pages/AgreePage";
import PasswordPage from "./pages/PasswordPage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import HomePage from "./pages/HomePage";
import PasswordResetPage from "./pages/PasswordResetPage";
import EnergyDetailPage from "./pages/EnergyDetailPage";
import DrHistoryPage from "./pages/DrHistoryPage";
import BoardPage from "./pages/BoardPage";
import RankingPage from "./pages/RankingPage";
import "./App.css";

function App() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'SET_FCM_TOKEN') {
          localStorage.setItem('fcmToken', data.token);
          
          // Also sync with backend if user is already logged in
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.uuid) {
              fetch(`/api/users/update-push-token?uuid=${encodeURIComponent(user.uuid)}&pushToken=${encodeURIComponent(data.token)}`, {
                method: 'POST'
              }).catch(err => console.error("Failed to update push token in backend", err));
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any);

    // Request token from React Native shell
    const requestToken = () => {
      const win = window as any;
      if (win.ReactNativeWebView) {
        win.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_FCM_TOKEN' }));
      }
    };

    // Initial request and another after 1 second to ensure RN bridge is ready
    requestToken();
    const timer = setTimeout(requestToken, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join/channel" element={<SignUpChannelPage />} />
          <Route path="/join/apt" element={<AptSearchPage />} />
          <Route path="/join/header-check/:hoSeq" element={<HeaderCheckPage />} />
          <Route path="/join/cert" element={<CertPage />} />
          <Route path="/join/agree" element={<AgreePage />} />
          <Route path="/join/password" element={<PasswordPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="/energy-detail" element={<EnergyDetailPage />} />
          <Route path="/dr-history" element={<DrHistoryPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/ranking" element={<RankingPage />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
