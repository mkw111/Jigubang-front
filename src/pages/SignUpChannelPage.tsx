import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpChannelPage.css';

const SignUpChannelPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedChannel, setSelectedChannel] = useState<'phone' | null>('phone');

    const handleNext = () => {
        if (selectedChannel === 'phone') {
            navigate('/join/cert');
        }
    };

    return (
        <div className="page-container signup-channel-wrapper">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <span>‹</span>
                </button>
                <h2>회원가입</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Wizard Step Progress Bar */}
            <div className="wizard-progress-bar">
                <div className="wizard-progress-fill" style={{ width: '20%' }}></div>
            </div>

            <div className="app-content" style={{ paddingTop: '24px' }}>
                <div className="wizard-step-info">
                    <h3 className="wizard-step-title">계정 채널 선택하기</h3>
                    <span className="wizard-step-number">1 <span className="muted">/ 5</span></span>
                </div>

                <div className="channel-button-list" style={{ marginTop: '24px' }}>
                    <button 
                        className={`channel-btn ${selectedChannel === 'phone' ? 'active' : ''}`}
                        onClick={() => setSelectedChannel('phone')}
                    >
                        전화번호로 회원가입 (자동선택)
                    </button>
                    <button 
                        className="channel-btn disabled" 
                        onClick={() => alert('네이버 로그인은 지원되지 않습니다. 전화번호 회원가입을 이용해주세요.')}
                    >
                        네이버로 회원가입
                    </button>
                    <button 
                        className="channel-btn disabled" 
                        onClick={() => alert('카카오 로그인은 지원되지 않습니다. 전화번호 회원가입을 이용해주세요.')}
                    >
                        카카오로 회원가입
                    </button>
                </div>

                {/* Warning Card */}
                <div className="card warning-card" style={{ marginTop: '30px', padding: '20px' }}>
                    <h4 className="warning-title" style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)', fontSize: '14px', fontWeight: 'bold' }}>주의해 주세요!</h4>
                    <ul className="warning-list" style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-text-body)', lineHeight: 1.6 }}>
                        <li>현재는 휴대폰 전화번호로만 회원가입이 가능합니다.</li>
                        <li>휴대폰 본인 인증 후 회원가입이 가능합니다.</li>
                        <li>LS컨소 가정용 스마트 계량기 설치 단지만 가능합니다.</li>
                    </ul>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <button 
                    className="btn login-btn" 
                    onClick={handleNext}
                    disabled={!selectedChannel}
                    style={{ opacity: selectedChannel ? 1 : 0.6 }}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default SignUpChannelPage;
