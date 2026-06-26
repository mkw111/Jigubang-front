import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HeaderCheckPage.css";

const HeaderCheckPage: React.FC = () => {
    const { hoSeq } = useParams();
    const navigate = useNavigate();
    const [headerInfo, setHeaderInfo] = useState<any>(null);

    useEffect(() => {
        axios.get(`/api/households/${hoSeq}/header`)
            .then(res => {
                if (res.data && typeof res.data.exists !== 'undefined') {
                    setHeaderInfo(res.data);
                } else {
                    console.error("Invalid header data:", res.data);
                    alert("세대 정보를 불러오지 못했습니다.");
                    navigate(-1);
                }
            })
            .catch(err => {
                console.error("Header fetch failed:", err);
                alert("서버 통신 중 오류가 발생했습니다.");
                navigate(-1);
            });
    }, [hoSeq, navigate]);

    if (!headerInfo) {
        return (
            <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>세대 정보를 조회하는 중...</span>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>세대 정보 확인</h2>
                <div className="header-placeholder"></div>
            </header>

            <div className="app-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '30px' }}>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                    
                    {headerInfo.exists ? (
                        <>
                            <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '12px' }}>이미 등록된 세대입니다</h3>
                            
                            <div className="info-alert" style={{ background: 'var(--color-bg-light-blue)', border: '1px solid rgba(0, 168, 255, 0.1)', justifyContent: 'center' }}>
                                <div className="info-alert-text" style={{ fontSize: '14px', textAlign: 'center' }}>
                                    등록 세대주: <strong style={{ color: 'var(--color-primary-dark)', fontSize: '16px' }}>{headerInfo.headerName}</strong>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '13px', color: 'var(--color-text-body)', lineHeight: 1.5, marginTop: '20px' }}>
                                해당 동호에 이미 세대주가 등록되어 있습니다.<br />
                                세대원의 <strong>가족 멤버</strong>로 가입을 진행합니다.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '12px' }}>새로운 세대 등록 가능</h3>
                            
                            <div className="info-alert" style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.2)', justifyContent: 'center' }}>
                                <div className="info-alert-text" style={{ fontSize: '14px', color: 'var(--color-success)', textAlign: 'center' }}>
                                    세대원 정보 없음
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '13px', color: 'var(--color-text-body)', lineHeight: 1.5, marginTop: '20px' }}>
                                해당 동호에 등록된 세대주가 존재하지 않습니다.<br />
                                귀하가 본 세대의 <strong>최초 세대주</strong>로 가입하게 됩니다.
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <button 
                    className="btn login-btn" 
                    onClick={() => navigate('/join/cert', { state: { hoSeq } })}
                >
                    {headerInfo.exists ? "가족 멤버로 가입하기" : "세대주로 가입하기"}
                </button>
            </div>
        </div>
    );
};

export default HeaderCheckPage;
