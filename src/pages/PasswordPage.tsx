import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CertPage.css";

const PasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Previous steps data
    const { name, phone, certNumber, hoSeq } = location.state || {};

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [termsAgreed, setTermsAgreed] = useState(false);

    const handleJoin = async () => {
        if (!password || password !== passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (!termsAgreed) {
            alert("약관에 동의해주세요.");
            return;
        }

        try {
            await axios.post("/api/users/join", {
                name: name,
                phoneNumber: phone,
                certNumber: certNumber,
                password: password,
                hoSeq: hoSeq,
                joinChannel: "APP",
                termsIds: [1, 2, 3]
            });
            
            alert("가입이 성공적으로 완료되었습니다. 로그인해주세요!");
            navigate('/login');
            
        } catch (error: any) {
            console.error("Join request failed:", error.response?.data || error.message);
            const msg = error.response?.data?.message || "가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
            alert(msg);
        }
    };

    const isFormValid = password && password === passwordConfirm && termsAgreed;

    return (
        <div className="page-container">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>비밀번호 설정</h2>
                <div className="header-placeholder"></div>
            </header>
            
            <div className="app-content">
                <div className="card">
                    <h3 className="card-title">비밀번호 생성</h3>
                    
                    <div className="form-group">
                        <label className="form-label">새 비밀번호</label>
                        <input 
                            type="password" 
                            placeholder="문자, 숫자 조합 6자리 이상" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="form-input"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">비밀번호 확인</label>
                        <input 
                            type="password" 
                            placeholder="동일한 비밀번호를 다시 입력하세요" 
                            value={passwordConfirm} 
                            onChange={e => setPasswordConfirm(e.target.value)} 
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={termsAgreed} 
                            onChange={e => setTermsAgreed(e.target.checked)}
                            style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--color-primary-dark)' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-dark)' }}>
                            지구방 모든 약관 및 수집 정책에 동의합니다.
                        </span>
                    </label>
                </div>
            </div>

            <div style={{ padding: '0 20px 20px 20px' }}>
                <button 
                    className="btn login-btn" 
                    onClick={handleJoin}
                    disabled={!isFormValid}
                    style={{ opacity: isFormValid ? 1 : 0.6 }}
                >
                    동의하고 가입하기
                </button>
            </div>
        </div>
    );
};

export default PasswordPage;
