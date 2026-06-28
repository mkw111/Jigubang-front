import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CertPage.css";

const CertPage: React.FC = () => {
    const navigate = useNavigate();
    
    // States
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [certNumber, setCertNumber] = useState("");
    
    const [isSent, setIsSent] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // SMS verification request
    const handleRequestCert = async () => {
        if (!name) {
            alert("사용자 이름을 입력해주세요.");
            return;
        }
        if (!phone) {
            alert("휴대폰 번호를 입력해주세요.");
            return;
        }

        try {
            await axios.post("/api/auth/hp-cert/send", { phoneNumber: phone });
            setIsSent(true);
            setTimeLeft(180); // 3 minutes
            alert("인증번호가 발송되었습니다.");
        } catch (error: any) {
            console.error("SMS Request failed:", error);
            const msg = error.response?.data?.message || "인증번호 발송에 실패했습니다. 다시 시도해주세요.";
            alert(msg);
        }
    };

    // Confirm verification code
    const handleConfirmCert = async () => {
        if (!certNumber) {
            alert("인증번호를 입력해주세요.");
            return;
        }

        try {
            const res = await axios.post("/api/auth/hp-cert/confirm", { 
                phoneNumber: phone, 
                certNumber: certNumber 
            });
            if (res.status === 200) {

                setTimeLeft(0);
                alert("휴대폰 본인인증이 완료되었습니다.");
                // Proceed to Step 4/5 (Apt Search)
                navigate('/join/apt', { state: { name, phone, certNumber } });
            } else {
                throw new Error("Confirm failed");
            }
        } catch (error: any) {
            console.error("SMS Verification confirm failed:", error);
            const msg = error.response?.data?.message || "인증번호가 일치하지 않거나 만료되었습니다.";
            alert(msg);
        }
    };

    // Reset handlers
    const handleResetName = () => setName("");
    const handleResetPhone = () => setPhone("");

    // Step configuration based on SMS sent status
    const currentStep = isSent ? 3 : 2;
    const progressWidth = isSent ? '60%' : '40%';
    const stepTitle = isSent ? "인증번호 입력하기" : "휴대폰으로 인증번호 받기";

    return (
        <div className="page-container cert-wrapper">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>회원가입</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Wizard Step Progress Bar */}
            <div className="wizard-progress-bar">
                <div className="wizard-progress-fill" style={{ width: progressWidth }}></div>
            </div>
            
            <div className="app-content" style={{ paddingTop: '24px' }}>
                <div className="wizard-step-info">
                    <h3 className="wizard-step-title">{stepTitle}</h3>
                    <span className="wizard-step-number">{currentStep} <span className="muted">/ 5</span></span>
                </div>

                {!isSent ? (
                    /* Step 2/5: 이름 및 전화번호 입력 */
                    <div className="card form-wizard-card" style={{ marginTop: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">사용자 이름</label>
                            <div className="input-with-action">
                                <input 
                                    type="text" 
                                    placeholder="이름을 입력하세요" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="form-input"
                                />
                                <button className="reset-action-btn" onClick={handleResetName} disabled={!name}>
                                    초기화
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">휴대폰 전화번호</label>
                            <div className="input-with-action">
                                <input 
                                    type="tel" 
                                    placeholder="'-' 없이 입력하세요" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    className="form-input"
                                />
                                <button className="reset-action-btn" onClick={handleResetPhone} disabled={!phone}>
                                    초기화
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Step 3/5: 인증 코드 입력 */
                    <div className="card form-wizard-card" style={{ marginTop: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">휴대폰 본인 인증</label>
                            <div className="input-with-action">
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input 
                                        type="text" 
                                        placeholder="인증번호 입력" 
                                        value={certNumber} 
                                        onChange={e => setCertNumber(e.target.value)} 
                                        maxLength={6}
                                        className="form-input"
                                        style={{ paddingRight: '55px' }}
                                    />
                                    {timeLeft > 0 && (
                                        <span className="timer-display-inner">{formatTime(timeLeft)}</span>
                                    )}
                                </div>
                                <button 
                                    className="resend-action-btn" 
                                    onClick={handleRequestCert}
                                    style={{ marginLeft: '8px' }}
                                >
                                    재요청
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ padding: '20px' }}>
                <button 
                    className="btn login-btn" 
                    onClick={isSent ? handleConfirmCert : handleRequestCert}
                    disabled={isSent ? !certNumber : (!name || !phone)}
                    style={{ opacity: (isSent ? certNumber : (name && phone)) ? 1 : 0.6 }}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default CertPage;
