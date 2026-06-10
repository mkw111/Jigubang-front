import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AptSearchPage from "./pages/AptSearchPage";
import HeaderCheckPage from "./pages/HeaderCheckPage";
import CertPage from "./pages/CertPage";
import PasswordPage from "./pages/PasswordPage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import HomePage from "./pages/HomePage";
import PasswordResetPage from "./pages/PasswordResetPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join/apt" element={<AptSearchPage />} />
          <Route path="/join/header-check/:hoSeq" element={<HeaderCheckPage />} />
          <Route path="/join/cert" element={<CertPage />} />
          <Route path="/join/password" element={<PasswordPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
