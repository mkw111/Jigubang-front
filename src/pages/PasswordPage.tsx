import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CertPage.css"; // 재사용

const PasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // 이전 페이지에서 넘어온 정보
    const { name, phone, certNumber } = location.state || {};

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
            // 가입 API 호출 (정확한 엔드포인트와 필드 반영)
            await axios.post("/api/users/join", {
                name: name || "테스트유저",
                phoneNumber: phone || "01000000000",
                certNumber: certNumber || "123456",
                password: password,
                aptDongHoId: 1, // 테스트용 임시 값
                joinChannel: "APP", // 필수 필드 추가
                termsIds: [1, 2, 3] // 약관 동의 임시 값
            });
            
            alert("가입이 완료되었습니다!");
            navigate('/login');
            
        } catch (error: any) {
            console.error("가입 실패 상세:", error.response?.data || error.message);
            alert("가입 처리 중 오류가 발생했습니다. (사유: " + (error.response?.data?.message || "서버 응답 오류") + ")");
        }
    };

    const isFormValid = password && password === passwordConfirm && termsAgreed;

    return (
        <div className="page-container">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>&lt;</button>
                <h2>회원가입</h2>
            </header>
            
            <div className="content">
                <div className="input-section">
                    <label className="input-label">비밀번호</label>
                    <div className="input-wrapper">
                        <input 
                            type="password" 
                            placeholder="비밀번호" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="input-section">
                    <label className="input-label">비밀번호 확인</label>
                    <div className="input-wrapper">
                        <input 
                            type="password" 
                            placeholder="비밀번호 확인" 
                            value={passwordConfirm} 
                            onChange={e => setPasswordConfirm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="input-section" style={{ marginTop: '40px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                        <input 
                            type="checkbox" 
                            checked={termsAgreed} 
                            onChange={e => setTermsAgreed(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        네, 모든 약관에 동의합니다.
                    </label>
                </div>
            </div>

            <button 
                className={`next-btn ${isFormValid ? 'active' : ''}`} 
                onClick={handleJoin}
                disabled={!isFormValid}
            >
                동의하고 가입하기
            </button>
        </div>
    );
};

export default PasswordPage;
