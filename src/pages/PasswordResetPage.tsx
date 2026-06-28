import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const PasswordResetPage: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    const handleSendCert = async () => {
        if (!phoneNumber) {
            alert('전화번호를 입력해주세요.');
            return;
        }

        try {
            await axios.post('/api/auth/hp-cert/send', { phoneNumber });
            alert('인증번호가 발송되었습니다.');
            setStep(2);
        } catch (e: any) {
            console.error('Cert request failed:', e);
            const msg = e.response?.data?.message || "인증번호 발송에 실패했습니다. 번호를 확인해주세요.";
            alert(msg);
        }
    };

    const handleReset = async () => {
        if (!certNumber || !newPassword) {
            alert('인증번호와 새 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            await axios.post('/api/users/reset-password', { phoneNumber, certNumber, newPassword });
            alert('비밀번호가 성공적으로 재설정되었습니다. 다시 로그인해 주세요.');
            navigate('/login');
        } catch (e: any) {
            console.error('Password reset failed:', e);
            const msg = e.response?.data?.message || '재설정 실패: 입력한 정보가 올바르지 않거나 만료되었습니다.';
            alert(msg);
        }
    };

    return (
        <div className="page-container landing-wrapper" style={{ justifyContent: 'flex-start', padding: '40px 24px 20px 24px' }}>
            <header className="app-header" style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0' }}>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span style={{ fontSize: '24px' }}>‹</span>
                </button>
                <h2>비밀번호 재설정</h2>
                <div className="header-placeholder"></div>
            </header>

            <div className="logo-section" style={{ marginTop: '20px', marginBottom: '30px' }}>
                <div className="logo-glow" style={{ width: '100px', height: '100px' }}></div>
                <img src="/logo192.png" alt="Jigubang Logo" className="logo-img" style={{ width: '60px', marginBottom: '8px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-dark)', margin: 0 }}>지구방 계정 찾기</h3>
            </div>

            <div className="button-group" style={{ width: '100%' }}>
                {step === 1 ? (
                    <div className="card animated-fade-in" style={{ padding: '20px' }}>
                        <h4 className="card-title" style={{ fontSize: '14px', marginBottom: '14px' }}>전화번호 확인</h4>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">등록 전화번호</label>
                            <input 
                                type="text" 
                                placeholder="가입한 전화번호를 입력하세요" 
                                value={phoneNumber} 
                                onChange={e => setPhoneNumber(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <button className="btn login-btn" onClick={handleSendCert} style={{ margin: 0 }}>
                            인증 코드 발송
                        </button>
                    </div>
                ) : (
                    <div className="card animated-fade-in" style={{ padding: '20px' }}>
                        <h4 className="card-title" style={{ fontSize: '14px', marginBottom: '14px' }}>인증 및 재설정</h4>
                        <div className="form-group">
                            <label className="form-label">인증 코드</label>
                            <input 
                                type="text" 
                                placeholder="인증번호 입력" 
                                value={certNumber} 
                                onChange={e => setCertNumber(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <label className="form-label">새로운 비밀번호</label>
                            <input 
                                type="password" 
                                placeholder="문자, 숫자 조합 6자리 이상" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <button className="btn login-btn" onClick={handleReset} style={{ margin: 0 }}>
                            비밀번호 변경 완료
                        </button>
                    </div>
                )}
            </div>

            <footer className="footer" style={{ marginTop: 'auto', paddingTop: '20px' }}>
                © ENERNET Inc.
            </footer>
        </div>
    );
};

export default PasswordResetPage;
