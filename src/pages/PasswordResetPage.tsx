import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';

const PasswordResetPage: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: phone/cert request, 2: verify/reset
    const navigate = useNavigate();

    const handleSendCert = async () => {
        try {
            await axios.post('/api/auth/hp-cert/send', { phoneNumber });
            alert('인증번호가 발송되었습니다.');
            setStep(2);
        } catch (e) {
            alert('인증번호 발송 실패');
        }
    };

    const handleReset = async () => {
        try {
            await axios.post('/api/users/reset-password', { phoneNumber, certNumber, newPassword });
            alert('비밀번호가 성공적으로 재설정되었습니다. 다시 로그인해 주세요.');
            navigate('/login');
        } catch (e: any) {
            alert('재설정 실패: ' + (e.response?.data?.message || '입력 정보를 확인하세요.'));
        }
    };

    return (
        <div className="landing-container">
            <header className="header" style={{width: '100%', textAlign: 'center'}}>
                <h2 className="main-title">비밀번호 재설정</h2>
            </header>
            
            <div className="button-group" style={{marginTop: '50px'}}>
                {step === 1 ? (
                    <div style={{marginBottom: '20px'}}>
                        <input 
                            type="text" 
                            placeholder="전화번호" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)}
                            style={{width: '100%', height: '50px', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px', marginBottom: '10px'}}
                        />
                        <button className="btn login-btn" onClick={handleSendCert}>인증번호 발송</button>
                    </div>
                ) : (
                    <div style={{marginBottom: '20px'}}>
                        <input 
                            type="text" 
                            placeholder="인증번호" 
                            value={certNumber} 
                            onChange={e => setCertNumber(e.target.value)}
                            style={{width: '100%', height: '50px', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px', marginBottom: '10px'}}
                        />
                        <input 
                            type="password" 
                            placeholder="새 비밀번호" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)}
                            style={{width: '100%', height: '50px', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px', marginBottom: '10px'}}
                        />
                        <button className="btn login-btn" onClick={handleReset}>비밀번호 변경</button>
                    </div>
                )}
                <button className="btn join-btn" onClick={() => navigate(-1)} style={{backgroundColor: '#ccc'}}>취소</button>
            </div>
            
            <footer className="footer">
                © ENERNET Inc.
            </footer>
        </div>
    );
};

export default PasswordResetPage;
EOF
