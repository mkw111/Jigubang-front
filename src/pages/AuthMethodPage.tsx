import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthMethodPage.css';

const AuthMethodPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h2>본인 인증</h2>
            </header>

            <div className="content">
                <h3 className="section-title">본인 확인을 위해<br/>인증 방법을 선택해주세요.</h3>
                
                <div className="method-list">
                    <div className="method-item" onClick={() => alert('간편인증은 준비 중입니다.')}>
                        <div className="method-icon">💬</div>
                        <div className="method-info">
                            <div className="method-name">간편인증</div>
                            <div className="method-desc">카카오, 네이버, PASS 등</div>
                        </div>
                        <div className="method-arrow">›</div>
                    </div>

                    <div className="method-item" onClick={() => navigate('/join/cert')}>
                        <div className="method-icon">📱</div>
                        <div className="method-info">
                            <div className="method-name">휴대폰 본인인증</div>
                            <div className="method-desc">SMS 문자로 인증하기</div>
                        </div>
                        <div className="method-arrow">›</div>
                    </div>
                </div>

                <div className="notice-box">
                    <p>• 입력하신 정보는 본인 확인을 위해서만 사용되며, 안전하게 보호됩니다.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthMethodPage;
