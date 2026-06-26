import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./AgreePage.css";

const AgreePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // States from previous step
    const { name, phone, certNumber, hoSeq } = location.state || {};

    const [headerInfo, setHeaderInfo] = useState<any>(null);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [aptDetail, setAptDetail] = useState<any>({ aptName: "", dong: "", ho: "" });

    // Fetch site details and household representative info
    useEffect(() => {
        if (!hoSeq) {
            alert("세대 정보가 누락되었습니다.");
            navigate('/join/apt');
            return;
        }

        // Fetch household header info
        axios.get(`/api/households/${hoSeq}/header`)
            .then(res => {
                setHeaderInfo(res.data);
            })
            .catch(err => console.error("Header fetch failed:", err));

        // Fetch apt details (aptName, dong, ho)
        axios.get(`/api/apt/${hoSeq}`)
            .then(res => {
                if (res.data) {
                    setAptDetail(res.data);
                }
            })
            .catch(err => console.error("Apt details fetch failed:", err));
    }, [hoSeq, navigate]);

    const maskName = (str: string) => {
        if (!str) return "";
        if (str.length <= 2) return str[0] + "*";
        return str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
    };

    const handleNext = () => {
        if (!termsAgreed) {
            alert("약관 동의가 필요합니다.");
            return;
        }
        navigate('/join/password', { state: { name, phone, certNumber, hoSeq } });
    };

    return (
        <div className="page-container agree-wrapper">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>회원가입</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Wizard Step Progress Bar */}
            <div className="wizard-progress-bar">
                <div className="wizard-progress-fill" style={{ width: '100%' }}></div>
            </div>

            <div className="app-content" style={{ paddingTop: '24px' }}>
                <div className="wizard-step-info">
                    <h3 className="wizard-step-title">정보 확인 및 약관 동의</h3>
                    <span className="wizard-step-number">5 <span className="muted">/ 5</span></span>
                </div>

                <div className="tabs-bar" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button className="tab-pill active">등록정보</button>
                    <button className="tab-pill" onClick={() => alert('약관 보기 페이지를 참조해주세요.')}>필수 동의</button>
                </div>

                {/* Registration Details Checklist */}
                <div className="registration-checklist">
                    <div className="checklist-item success">
                        <span className="item-text">{name} · {phone}</span>
                        <span className="check-icon">✓</span>
                    </div>

                    <div className="checklist-item success">
                        <span className="item-text">{aptDetail.aptName || "단지 정보"}</span>
                        <span className="check-icon">✓</span>
                    </div>

                    <div className="checklist-item success">
                        <span className="item-text">{aptDetail.dong ? `${aptDetail.dong}동 · ` : ""}{aptDetail.ho ? `${aptDetail.ho}호` : ""}</span>
                        <span className="check-icon">✓</span>
                    </div>

                    {headerInfo?.exists ? (
                        <div className="checklist-item alert">
                            <span className="item-text">
                                기가입 세대대표 : {maskName(headerInfo.headerName)} · 010-****-3701
                            </span>
                            <span className="close-icon">✗</span>
                        </div>
                    ) : (
                        <div className="checklist-item info">
                            <span className="item-text">
                                기가입 정보 없음 (최초 가입 세대주 등록 가능)
                            </span>
                            <span className="check-icon">✓</span>
                        </div>
                    )}
                </div>

                {/* Warning notice text */}
                <div className="warning-notice-text" style={{ marginTop: '20px', color: '#FF3B30', fontSize: '12px', lineHeight: 1.6, fontWeight: '600' }}>
                    필수 약관에 동의하지 않으면 서비스를 이용할 수 없습니다.<br />
                    타인의 주소 및 정보로 부정 신청할 경우 형사처벌 될 수 있습니다.<br />
                    부정 신청은 사전 통지 없이 계정이 정지/삭제 될 수 있습니다.
                </div>

                {/* Mandatory terms agreement checkbox */}
                <div className="card checkbox-card" style={{ marginTop: '24px', padding: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={termsAgreed}
                            onChange={e => setTermsAgreed(e.target.checked)}
                            style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-dark)' }}>
                            필수약관에 전체 동의 합니다.
                        </span>
                    </label>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <button 
                    className="btn login-btn" 
                    disabled={!termsAgreed}
                    onClick={handleNext}
                    style={{ opacity: termsAgreed ? 1 : 0.6 }}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default AgreePage;
