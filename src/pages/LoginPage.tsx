import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

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
            }else{ //200이 아닐경우

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
                <img src="/images/jigubang_3d.png" alt="Jigubang Logo" className="logo-img" style={{ width: '70px', height: '70px', objectFit: 'contain', zIndex: 2, marginBottom: '10px' }} />
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
