import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./AptSearchPage.css";

const AptSearchPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Context from previous step (Signup flow)
    const { name, phone, certNumber } = location.state || {};
    
    // Check mode
    const query = new URLSearchParams(location.search);
    const mode = query.get('mode');
    const isChangeMode = mode === 'change';

    // States
    const [search, setSearch] = useState("");
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [dongs, setDongs] = useState<string[]>([]);
    const [selectedDong, setSelectedDong] = useState("");
    const [dongInput, setDongInput] = useState("");
    const [hos, setHos] = useState<any[]>([]);
    const [selectedHoSeq, setSelectedHoSeq] = useState<number | null>(null);

    const [hoInput, setHoInput] = useState("");

    // 1. Search Apartments (Site)
    useEffect(() => {
        if (search.length >= 2) {
            axios.get(`/api/apt/sites?searchText=${search}`)
                .then(res => {
                    if (res.data && Array.isArray(res.data)) {
                        setSites(res.data);
                    } else {
                        setSites([]);
                    }
                })
                .catch(err => {
                    console.error("Search failed:", err);
                    setSites([]);
                });
        } else {
            setSites([]);
        }
    }, [search]);

    // 2. Select Site & Load Dongs
    const handleSiteSelect = (site: any) => {
        setSelectedSite(site);
        setSites([]);
        axios.get(`/api/apt/sites/${site.siteSeq}/dongs`)
            .then(res => {
                if (res.data && Array.isArray(res.data.dongs)) {
                    setDongs(res.data.dongs);
                } else {
                    alert("동 정보를 불러오지 못했습니다.");
                }
            })
            .catch(err => alert("서버 통신 오류"));
    };

    // 3. Select Dong & Load Hos (handles both dropdown select and manual input matching)
    const handleDongChange = (dongVal: string) => {
        setSelectedDong(dongVal);
        setDongInput(dongVal);
        setSelectedHoSeq(null);

        setHoInput("");
        setHos([]);

        if (!dongVal) return;

        axios.get(`/api/apt/sites/${selectedSite.siteSeq}/dongs/${dongVal}/hos`)
            .then(res => {
                if (res.data && Array.isArray(res.data)) {
                    setHos(res.data);
                } else {
                    alert("호 정보를 불러오지 못했습니다.");
                }
            })
            .catch(err => alert("서버 통신 오류"));
    };

    // 4. Select Ho (handles dropdown select)
    const handleHoSelect = (hoSeqStr: string) => {
        if (!hoSeqStr) {
            setSelectedHoSeq(null);

            setHoInput("");
            return;
        }
        const hoSeqVal = parseInt(hoSeqStr, 10);
        const match = hos.find(h => h.hoSeq === hoSeqVal);
        if (match) {
            setSelectedHoSeq(hoSeqVal);

            setHoInput(match.ho);
        }
    };

    // 5. Manual Ho typing (tries to map string back to hoSeq)
    const handleHoInputChange = (val: string) => {
        setHoInput(val);
        const match = hos.find(h => h.ho === val);
        if (match) {
            setSelectedHoSeq(match.hoSeq);

        } else {
            setSelectedHoSeq(null);

        }
    };

    // Reset all selection details
    const handleResetDongHo = () => {
        setSelectedDong("");
        setDongInput("");
        setSelectedHoSeq(null);

        setHoInput("");
        setHos([]);
    };

    const handleNext = async () => {
        if (!selectedHoSeq) return;

        if (isChangeMode) {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert("로그인 정보가 없습니다.");
                navigate('/login');
                return;
            }
            const user = JSON.parse(userStr);
            try {
                const res = await axios.post(`/api/users/change-address?uuid=${user.uuid}&hoSeq=${selectedHoSeq}`);
                if (res.status === 200) {
                    alert('주소가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else {
                    throw new Error("Change failed");
                }
            } catch (e) {
                alert('주소 변경에 실패했습니다. 다시 시도해주세요.');
            }
        } else {
            // Proceed to Step 5/5 (Confirm information & Agree)
            navigate('/join/agree', { state: { name, phone, certNumber, hoSeq: selectedHoSeq } });
        }
    };

    return (
        <div className="page-container apt-search-wrapper">
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>{isChangeMode ? "주소 변경" : "회원가입"}</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Wizard Step Progress Bar (hidden in address change mode) */}
            {!isChangeMode && (
                <div className="wizard-progress-bar">
                    <div className="wizard-progress-fill" style={{ width: '80%' }}></div>
                </div>
            )}
            
            <div className="app-content" style={{ paddingTop: '24px' }}>
                <div className="wizard-step-info">
                    <h3 className="wizard-step-title">{selectedSite ? "우리집 찾기" : "우리 아파트 찾기"}</h3>
                    {!isChangeMode && (
                        <span className="wizard-step-number">4 <span className="muted">/ 5</span></span>
                    )}
                </div>

                {/* Apartment Name Search Input / Selected Card */}
                <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <label className="form-label">아파트 선택</label>
                    {!selectedSite ? (
                        <div className="input-with-action">
                            <input 
                                type="text" 
                                placeholder="키워드(이름/주소)를 입력하세요" 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="form-input"
                            />
                            <button className="reset-action-btn" onClick={() => setSearch("")} disabled={!search}>
                                초기화
                            </button>
                        </div>
                    ) : (
                        <div className="selected-site-box">
                            <span className="site-name">{selectedSite.aptName}</span>
                            <span className="verified-check">✓</span>
                        </div>
                    )}
                </div>

                {/* Apartment list search result */}
                {!selectedSite && sites.length > 0 && (
                    <div className="card search-results-card">
                        <div className="results-header">검색 결과 : {sites.length}건</div>
                        <div className="apt-list-scrollable">
                            {sites.map(s => (
                                <div 
                                    key={s.siteSeq} 
                                    onClick={() => handleSiteSelect(s)} 
                                    className="apt-search-item"
                                >
                                    <div className="apt-name">🏢 {s.aptName}</div>
                                    {s.addressRoad && <div className="apt-subtext">도로명주소 : {s.addressRoad}</div>}
                                    {s.address && <div className="apt-subtext">지번주소 : {s.address}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dong / Ho select inputs */}
                {selectedSite && (
                    <div className="card dongho-picker-card" style={{ padding: '20px' }}>
                        <div className="picker-grid">
                            {/* Dong Picker */}
                            <div className="picker-col">
                                <label className="form-label">동 선택</label>
                                <input 
                                    type="text" 
                                    placeholder="직접입력" 
                                    value={dongInput} 
                                    onChange={e => handleDongChange(e.target.value)}
                                    className="form-input"
                                    style={{ marginBottom: '8px' }}
                                />
                                <div className="or-text">또는</div>
                                <select 
                                    value={selectedDong} 
                                    onChange={e => handleDongChange(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">선택 하세요</option>
                                    {dongs.map(d => (
                                        <option key={d} value={d}>{d}동</option>
                                    ))}
                                </select>
                            </div>

                            {/* Ho Picker */}
                            <div className="picker-col">
                                <label className="form-label">호 선택</label>
                                {!selectedDong ? (
                                    <div className="placeholder-info">
                                        ※ "동"을 먼저 선택하세요
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="text" 
                                            placeholder="직접입력" 
                                            value={hoInput} 
                                            onChange={e => handleHoInputChange(e.target.value)}
                                            className="form-input"
                                            style={{ marginBottom: '8px' }}
                                        />
                                        <div className="or-text">또는</div>
                                        <select 
                                            value={selectedHoSeq || ""} 
                                            onChange={e => handleHoSelect(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">선택 하세요</option>
                                            {hos.map(h => (
                                                <option key={h.hoSeq} value={h.hoSeq}>{h.ho}호</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                        </div>

                        {selectedDong && (
                            <button 
                                className="btn reset-dongho-btn"
                                onClick={handleResetDongHo}
                                style={{ marginTop: '20px', width: '100%', height: '48px', margin: '20px 0 0 0' }}
                            >
                                동/호 정보 초기화
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{ padding: '20px' }}>
                <button 
                    className="btn login-btn" 
                    disabled={!selectedHoSeq} 
                    onClick={handleNext}
                    style={{ opacity: selectedHoSeq ? 1 : 0.6 }}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default AptSearchPage;
