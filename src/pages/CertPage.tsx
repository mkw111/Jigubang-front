import React, { useState, useEffect, useCallback } from "react";
import {useLocation, useNavigate} from "react-router-dom";
import axios from "axios";
import "./CertPage.css";

const CertPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 이전 페이지에서 넘어온 정보
    const { hoSeq } = location.state || {};
    
    // 상태 관리
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [certNumber, setCertNumber] = useState("");
    
    const [isSent, setIsSent] = useState(false); // 인증번호 발송 여부
    const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부
    const [timeLeft, setTimeLeft] = useState(0); // 타이머 (초)

    // 타이머 로직
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // MM:SS 포맷팅
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // 인증 요청 (발송/재전송)
    const handleRequestCert = async () => {
        if (!phone) {
            alert("휴대폰 번호를 입력해주세요.");
            return;
        }
        try {
            await axios.post("/api/auth/hp-cert/send", { phoneNumber: phone });
            setIsSent(true);
            setTimeLeft(180); // 3분
            alert("인증번호가 발송되었습니다.");
        } catch (error) {
            console.error("인증 요청 실패:", error);
            alert("인증번호 발송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 인증 확인
    const handleConfirmCert = async () => {
        if (!certNumber) {
            alert("인증번호를 입력해주세요.");
            return;
        }
        try {
            await axios.post("/api/auth/hp-cert/confirm", { 
                phoneNumber: phone, 
                certNumber: certNumber 
            });
            setIsVerified(true);
            setTimeLeft(0);
            alert("인증되었습니다.");
        } catch (error) {
            console.error("인증 확인 실패:", error);
            alert("인증번호가 일치하지 않습니다.");
        }
    };

    return (
        <div className="page-container">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>&lt;</button>
                <h2>회원가입</h2>
            </header>
            
            <div className="content">
                <div className="input-section">
                    <label className="input-label">이름</label>
                    <div className="input-wrapper">
                        <input 
                            type="text" 
                            placeholder="이름 입력" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            disabled={isVerified}
                        />
                        {name && !isVerified && <button className="clear-btn" onClick={() => setName("")}>&times;</button>}
                    </div>
                </div>

                <div className="input-section">
                    <label className="input-label">휴대폰 번호</label>
                    <div className="with-btn">
                        <input 
                            type="tel" 
                            placeholder="01012345678" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            disabled={isVerified}
                        />
                        <button 
                            className={`action-btn ${isSent ? 'resend' : ''}`} 
                            onClick={handleRequestCert}
                            disabled={isVerified}
                        >
                            {isSent ? "재전송" : "인증요청"}
                        </button>
                    </div>
                </div>

                {isSent && (
                    <div className="input-section animated-fade-in">
                        <div className="input-wrapper">
                            <input 
                                type="text" 
                                placeholder="인증번호 6자리 입력" 
                                value={certNumber} 
                                onChange={e => setCertNumber(e.target.value)} 
                                maxLength={6}
                                disabled={isVerified}
                            />
                            {timeLeft > 0 && <span className="timer-text">{formatTime(timeLeft)}</span>}
                            {!isVerified && (
                                <button className="confirm-inline-btn" onClick={handleConfirmCert}>
                                    확인
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button 
                className={`next-btn ${isVerified ? 'active' : ''}`} 
                onClick={() => isVerified && navigate('/join/password', { state: { name, phone, certNumber, hoSeq } })}
                disabled={!isVerified}
            >
                다음
            </button>
        </div>
    );
};

export default CertPage;
