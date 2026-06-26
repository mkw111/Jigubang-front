import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const LoginPage: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            alert('전화번호와 비밀번호를 모두 입력해주세요.');
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
                // Fetch actual apartment details by hoSeq
                let aptInfo = { aptName: '지구방 아파트', dong: '', ho: '' };
                try {
                    const aptRes = await axios.get(`/api/apt/${res.data.hoSeq}`);
                    if (aptRes.status === 200 && aptRes.data) {
                        aptInfo = {
                            aptName: aptRes.data.aptName,
                            dong: aptRes.data.dong,
                            ho: aptRes.data.ho
                        };
                    }
                } catch (err) {
                    console.warn("Apt details fetch failed, utilizing defaults", err);
                }

                // Use backend-supplied approved status directly
                const isApproved = res.data.approved;

                localStorage.setItem('user', JSON.stringify({
                    uuid: res.data.uuid,
                    name: res.data.name,
                    phoneNumber: phoneNumber,
                    aptName: aptInfo.aptName,
                    dong: aptInfo.dong,
                    ho: aptInfo.ho,
                    hoSeq: res.data.hoSeq,
                    isAuthenticated: isApproved,
                    householdsType: res.data.householdsType
                }));
                navigate('/home');
            }
        } catch (e: any) {
            console.error("Login failed:", e);
            const errorMsg = e.response?.data?.message || '로그인 실패: 전화번호나 비밀번호를 확인해주세요.';
            alert(errorMsg);
        }
    };

    return (
        <div className="page-container landing-wrapper" style={{ justifyContent: 'flex-start', padding: '40px 24px 20px 24px' }}>
            <header className="app-header" style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0' }}>
                <button className="back-btn" onClick={() => navigate('/')}>
                    <span style={{ fontSize: '24px' }}>‹</span>
                </button>
                <h2>로그인</h2>
                <div className="header-placeholder"></div>
            </header>

            <div className="logo-section" style={{ marginTop: '30px', marginBottom: '40px' }}>
                <div className="logo-glow" style={{ width: '120px', height: '120px' }}></div>
                <img src="/logo192.png" alt="Jigubang Logo" className="logo-img" style={{ width: '70px', marginBottom: '10px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text-dark)', margin: 0 }}>Sign In</h2>
            </div>

            <div className="button-group" style={{ width: '100%' }}>
                <div className="form-group">
                    <label className="form-label">전화번호</label>
                    <input 
                        type="text" 
                        placeholder="전화번호를 입력하세요" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="form-input"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">비밀번호</label>
                    <input 
                        type="password" 
                        placeholder="비밀번호를 입력하세요" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13px' }}>
                    <span onClick={() => navigate('/reset-password')} style={{ color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                        비밀번호 찾기
                    </span>
                    <span onClick={() => navigate('/join/apt')} style={{ color: 'var(--color-primary-dark)', cursor: 'pointer', fontWeight: '600' }}>
                        회원가입 하기
                    </span>
                </div>

                <button className="btn login-btn" onClick={handleLogin}>로그인 하기</button>
            </div>

            <footer className="footer" style={{ marginTop: 'auto', paddingTop: '20px' }}>
                © ENERNET Inc.
            </footer>
        </div>
    );
};

export default LoginPage;
