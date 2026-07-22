import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const prefilled = location.state?.prefilledPhone || '';
    
    const [phoneNumber, setPhoneNumber] = useState(prefilled);
    const [password, setPassword] = useState('');

    const handleLoginSuccess = async (data: any) => {
        const token = data.accessToken;
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        let aptInfo = { aptName: '지구방 아파트', dong: '', ho: '' };
        if (data.hoSeq) {
            try {
                const aptRes = await axios.get(`/api/apt/${data.hoSeq}`);
                if (aptRes.status === 200 && aptRes.data) {
                    aptInfo = {
                        aptName: aptRes.data.aptName || '지구방 아파트',
                        dong: aptRes.data.dong || '',
                        ho: aptRes.data.ho || ''
                    };
                }
            } catch (err) {
                console.warn("Apt details fetch failed, utilizing defaults", err);
            }
        }

        const isApproved = data.approved;

        localStorage.setItem('user', JSON.stringify({
            uuid: data.uuid,
            name: data.name,
            phoneNumber: phoneNumber,
            aptName: aptInfo.aptName,
            dong: aptInfo.dong,
            ho: aptInfo.ho,
            hoSeq: data.hoSeq,
            isAuthenticated: isApproved,
            householdsType: data.householdsType,
            token: token
        }));
        navigate('/home');
    };

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            return;
        }

        try {
            const fcmToken = localStorage.getItem('fcmToken');
            const res = await axios.post('/api/users/login', { 
                phoneNumber, 
                password,
                pushToken: fcmToken || null
            });
            if (res.status === 200 && res.data) {
                if (res.data.status === 'DELETE_REQUESTED') {
                    const confirmRestore = window.confirm(
                        "탈퇴 신청 대기(유예) 중인 계정입니다.\n\n계정을 복구하고 로그인 하시겠습니까?"
                    );
                    if (confirmRestore) {
                        try {
                            const restoreRes = await axios.post('/api/users/cancel-withdrawal', {
                                phoneNumber,
                                password
                            });
                            if (restoreRes.status === 200 && restoreRes.data) {
                                alert("계정이 성공적으로 복구되었습니다!");
                                await handleLoginSuccess(restoreRes.data);
                                return;
                            }
                        } catch (restoreErr: any) {
                            alert("계정 복구 실패: " + (restoreErr.response?.data?.message || restoreErr.message));
                            return;
                        }
                    }
                }

                await handleLoginSuccess(res.data);
            }
        } catch (e: any) {
            console.error("Login failed:", e);
            const errorMsg = e.response?.data?.message || '로그인 실패: 전화번호나 비밀번호를 확인해주세요.';
            alert(errorMsg);
        }
    };

    const isButtonActive = phoneNumber.trim().length > 0 && password.trim().length > 0;

    return (
        <div className="login-page-container">
            
            {/* 1. Waves Top Sky-blue background */}
            <div className="login-top-background">
                <div className="login-brand-logo-section">
                    <img 
                        src="/images/jigubang_3d.png" 
                        alt="Jigubang Mascot Line-art" 
                        className="login-brand-logo"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/image/char_02.png';
                        }}
                    />
                    <h1 className="login-brand-title">지구방</h1>
                    <p className="login-brand-subtitle">지구를 구하는 방법</p>
                </div>
            </div>

            {/* 2. White Card Container */}
            <div className="login-form-card-container">
                
                {/* Sign in header with black guide bubble */}
                <div className="signin-header-row">
                    <div className="signin-title-box">
                        <h2 className="signin-main-title">Sign in</h2>
                        <div className="signin-line-decoration"></div>
                    </div>

                    {/* Black speech bubble matching figma specification */}
                    <div className="login-success-guide-bubble">
                        로그인 성공(일반) : 1234{"\n"}
                        로그인 성공(관리자) : 5678{"\n"}
                        로그인 실패 : abcd
                    </div>
                </div>

                {/* Input Fields */}
                <div className="login-input-group">
                    <div className="login-field-box">
                        <label className="login-field-label">지구방 등록 전화번호</label>
                        <input 
                            type="text" 
                            placeholder="'-' 없이 입력하세요" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="login-field-input"
                        />
                    </div>

                    <div className="login-field-box">
                        <label className="login-field-label">비밀번호</label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 입력하세요" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            className="login-field-input"
                        />
                    </div>
                </div>

                {/* Menu Strip (Find Password, Register) */}
                <div className="login-menu-strip">
                    <span className="login-menu-item" onClick={() => navigate('/reset-password')}>
                        비밀번호 찾기
                    </span>
                    <div className="login-menu-divider"></div>
                    <span className="login-menu-item highlight" onClick={() => navigate('/join/apt')}>
                        회원가입
                    </span>
                </div>

                {/* Submit Action Button */}
                <button 
                    onClick={handleLogin}
                    disabled={!isButtonActive}
                    className={`login-submit-button ${isButtonActive ? 'active' : 'disabled'}`}
                >
                    로그인 하기
                </button>

                {/* Footer copyright */}
                <footer className="login-footer-copy">
                    © ENERNET Inc.
                </footer>
            </div>

        </div>
    );
};

export default LoginPage;
