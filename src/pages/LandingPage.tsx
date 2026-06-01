import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <div className="logo-section">
                <img src="/logo192.png" alt="Jigubang Logo" className="logo-img" />
                <h1 className="main-title">지구방</h1>
                <p className="sub-title">지구를 구하는 방법</p>
            </div>

            <div className="button-group">
                <button className="btn login-btn" onClick={() => navigate('/login')}>
                    휴대폰 번호로 로그인하기
                </button>
                <button className="btn join-btn" onClick={() => navigate('/join/apt')}>
                    가입하러 가기
                </button>
            </div>

            <footer className="footer">
                © ENERNET Inc.
            </footer>
        </div>
    );
};

export default LandingPage;
