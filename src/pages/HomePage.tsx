import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>({});
    const [activeCard, setActiveCard] = useState<'energy' | 'dr'>('energy');
    const [energyMode, setEnergyMode] = useState<'billing' | 'monthly'>('billing'); // 'billing' (검침일) or 'monthly' (당월)
    const [showAuthModal, setShowAuthModal] = useState(false);

    const getOfficePhone = () => {
        if (user.aptName?.includes('A단지')) return '02-123-4567';
        if (user.aptName?.includes('B단지')) return '051-987-6543';
        return '031-4760-1112'; // 기본 숲속마을 벨라시온 관리소 번호
    };
    
    // API states
    const [energySummary, setEnergySummary] = useState<any>({ totalUsage: 212, carbonEmission: 54.8, treeCount: 2 });
    const [points, setPoints] = useState<any>({ totalPoints: 15600, kpxPoints: 10000, gyeongnamPoints: 5600 });
    const [activeIssue, setActiveIssue] = useState<any>(null);

    const [memberCount, setMemberCount] = useState<number>(4);
    
    // Load user state
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(userStr));
    }, [navigate]);

    // Fetch dashboard data
    useEffect(() => {
        const hoSeq = user.hoSeq;
        if (!hoSeq) return;

        const fetchData = async () => {
            try {
                // Fetch energy summary
                const summaryRes = await fetch(`/api/energy/summary/${hoSeq}`);
                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setEnergySummary(data);
                }

                // Fetch points
                const pointsRes = await fetch(`/api/households/${hoSeq}/points`);
                if (pointsRes.ok) {
                    const data = await pointsRes.json();
                    setPoints(data);
                }

                // Fetch household members to count them dynamically
                const membersRes = await fetch(`/api/households/move-in/list?hoSeq=${hoSeq}`);
                if (membersRes.ok) {
                    const data = await membersRes.json();
                    // Include existing members and pending approved ones
                    if (Array.isArray(data)) {
                        const approved = data.filter((m: any) => m.approvedYn === 'Y').length;
                        setMemberCount(approved > 0 ? approved : 4);
                    }
                }

                // Fetch active DR issue
                const activeRes = await fetch(`/api/dr/active-issue`);
                if (activeRes.ok && activeRes.status !== 204) {
                    const data = await activeRes.json();
                    setActiveIssue(data);
                } else {
                    setActiveIssue(null);
                }

                // Fetch household and user approval status dynamically from backend
                if (user.uuid) {
                    const statusRes = await fetch(`/api/users/${user.uuid}/status`);
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        const approved = statusData.approved;
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                            const currentUser = JSON.parse(userStr);
                            if (currentUser && (currentUser.isAuthenticated !== approved || currentUser.householdsType !== statusData.householdsType)) {
                                const updatedUser = { 
                                    ...currentUser, 
                                    isAuthenticated: approved,
                                    householdsType: statusData.householdsType
                                };
                                setUser(updatedUser);
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load dashboard data from backend", e);
            }
        };

        fetchData();
    }, [user.hoSeq]);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };



    const isAuthenticated = user.isAuthenticated !== false; // defaults to true

    const calculateElectricBill = (usage: number) => {
        let baseCharge = 910;
        let energyCharge = 0;
        
        if (usage <= 200) {
            baseCharge = 910;
            energyCharge = usage * 120;
        } else if (usage <= 400) {
            baseCharge = 1600;
            energyCharge = (200 * 120) + ((usage - 200) * 214.6);
        } else {
            baseCharge = 7300;
            energyCharge = (200 * 120) + (200 * 214.6) + ((usage - 400) * 307.3);
        }
        
        const climateCharge = Math.round(usage * 9);
        const fuelAdjustment = Math.round(usage * 5);
        
        const subtotal = baseCharge + energyCharge + climateCharge + fuelAdjustment;
        const vat = Math.round(subtotal * 0.1);
        const fund = Math.floor((subtotal * 0.037) / 10) * 10;
        
        return Math.floor((subtotal + vat + fund) / 10) * 10;
    };

    const totalUsage = energySummary?.totalUsage || 212;

    const currentUsage = energyMode === 'billing' ? Math.round(totalUsage) : Math.round(totalUsage * 0.7);
    const currentCost = calculateElectricBill(currentUsage);
    const currentLevel = currentUsage <= 200 ? 1 : currentUsage <= 400 ? 2 : 3;
    const levelRangeText = currentLevel === 1 
        ? "현재 누진 1구간 (0~200kWh)" 
        : currentLevel === 2 
            ? "현재 누진 2구간 (201~400kWh)" 
            : "현재 누진 3구간 (400kWh 초과)";
            
    const expectedUsage = Math.round(currentUsage * 1.1);
    const expectedCost = calculateElectricBill(expectedUsage);
    
    // Triangle indicator positioning
    const trianglePosition = currentLevel === 1 
        ? `${Math.max(10, Math.min(30, (currentUsage / 200) * 30))}%` 
        : currentLevel === 2 
            ? `${33 + Math.max(5, Math.min(33, ((currentUsage - 200) / 200) * 33))}%` 
            : `${66 + Math.max(5, Math.min(33, ((currentUsage - 400) / 400) * 33))}%`;

    const availableDrCount = activeIssue ? 2 : 1;
    const participatingDrCount = 1;

    return (
        <div className="page-container home-wrapper">
            {/* Header Area (Blue Background) */}
            <div className="home-gradient-header">
                <header className="app-header home-header-transparent">
                    <div className="header-address-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="header-address">
                            <span>🏠 {user.aptName || '숲속마을 벨라시온'} {user.dong ? `${user.dong}동 ${user.ho}호` : ''}</span>
                        </div>
                        {!isAuthenticated && (
                            <span className="auth-request-badge" onClick={() => setShowAuthModal(true)} style={{
                                cursor: 'pointer',
                                backgroundColor: '#00a8ff',
                                color: 'white',
                                fontSize: '10px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                display: 'inline-block',
                                letterSpacing: '-0.2px'
                            }}>
                                인증요청
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <span className="notification-bell" onClick={() => alert('알림 목록은 준비 중입니다.')}>🔔</span>
                        <button className="logout-btn" onClick={handleLogout} title="로그아웃">
                            🚪
                        </button>
                    </div>
                </header>

                {/* Mascot welcome banner inside the header */}
                <div className="mascot-welcome-banner">
                    <div className="welcome-text-container">
                        {isAuthenticated ? (
                            <>
                                <strong>{user.name || '김화경'}님</strong>,<br />
                                오늘도 함께 <span className="highlight-yellow">에너지</span><br />
                                <span className="highlight-yellow">절약</span>을 해 볼까요?
                            </>
                        ) : (
                            <>
                                <strong>{user.name || '김화경'}님</strong>,<br />
                                관리사무소 <span className="highlight-yellow">실거주</span><br />
                                <span className="highlight-yellow">인증</span>이 필요해요.
                            </>
                        )}
                    </div>
                    {/* Cute official mascot character */}
                    <div className="mascot-cat-illu" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bottom: '-10px', right: '10px' }}>
                        <img 
                            src="/images/char_01.png" 
                            alt="Mascot Character" 
                            style={{ width: '85px', height: '85px', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <main className="app-content home-content-scroll" style={{ marginTop: '-40px' }}>
                {/* 1. 우리집 에너지 참여 현황 Card */}
                <section className="card participation-status-card">
                    <div className="status-title">
                        <span className="shield-icon">🛡️</span>
                        우리집 에너지 참여 현황
                    </div>
                    <div className="status-grid">
                        <div className="status-badge-item">
                            <span className={`status-badge-icon ${isAuthenticated ? 'blue-check' : 'lock'}`}>
                                {isAuthenticated ? '✓' : '🔒'}
                            </span>
                            <span className="status-badge-label">실거주 인증</span>
                        </div>
                        <div className="status-badge-item">
                            <span className="status-badge-val number-font">{memberCount}</span>
                            <span className="status-badge-label">세대 구성원</span>
                        </div>
                        <div className="status-badge-item">
                            <span className="status-badge-val number-font green-val">{availableDrCount}</span>
                            <span className="status-badge-label">신청가능 DR</span>
                        </div>
                        <div className="status-badge-item">
                            <span className="status-badge-val number-font blue-val">{participatingDrCount}</span>
                            <span className="status-badge-label">신청완료 DR</span>
                        </div>
                    </div>
                </section>

                {/* 2. Dashboard Card (Slide Carousel Mode) */}
                <div className="slider-container">
                    <div className="carousel-view">
                        {activeCard === 'energy' ? (
                            /* Card 1: 실시간 에너지 데이터 */
                            <div className="card data-slider-card">
                                <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="card-top-left">
                                        <span className="energy-icon">⚡</span>
                                        <span className="card-top-title">실시간 에너지 데이터</span>
                                    </div>
                                    <div className="tab-pill-switches">
                                        <button 
                                            className={`pill-switch ${energyMode === 'billing' ? 'active' : ''}`}
                                            onClick={() => setEnergyMode('billing')}
                                        >
                                            검침일
                                        </button>
                                        <button 
                                            className={`pill-switch ${energyMode === 'monthly' ? 'active' : ''}`}
                                            onClick={() => setEnergyMode('monthly')}
                                        >
                                            당월
                                        </button>
                                    </div>
                                </div>
                                <div className="period-subtitle">
                                    {energyMode === 'billing' ? '2026.05.18 ~ 2026.06.11' : '2026.06.01 ~ 2026.06.11'}
                                </div>

                                <div className="usage-summary">
                                    <div className="usage-main">
                                        <span className="number-font main-value">{currentUsage}</span>
                                        <span className="unit">kWh</span>
                                        <span className="detail-arrow">›</span>
                                    </div>
                                    <div className="cost-main">
                                        <span className="cost-value">{currentCost.toLocaleString()} 원</span>
                                    </div>
                                </div>

                                {/* Progressive Progressive Gauge */}
                                <div className="progressive-gauge-wrapper">
                                    {/* Triangle indicator pointing to current segment */}
                                    <div className="indicator-arrow-container">
                                        <div className="indicator-arrow" style={{ left: trianglePosition }}>▲</div>
                                    </div>

                                    <div className="gauge-segments">
                                        <div className={`segment level-1 ${currentLevel === 1 ? 'active' : ''}`}></div>
                                        <div className={`segment level-2 ${currentLevel === 2 ? 'active' : ''}`}></div>
                                        <div className={`segment level-3 ${currentLevel === 3 ? 'active' : ''}`}></div>
                                    </div>

                                    <div className="gauge-header">
                                        <span>{levelRangeText}</span>
                                    </div>
                                    
                                    <div className="gauge-footer-info">
                                        <div className="info-row">
                                            <span>월간 예상 사용량</span>
                                            <strong className="number-font">{expectedUsage} kWh</strong>
                                        </div>
                                        <div className="info-row">
                                            <span>월간 예상 사용요금</span>
                                            <strong className="number-font">{expectedCost.toLocaleString()} 원</strong>
                                        </div>
                                    </div>
                                    
                                    <div className="disclaimer-text">
                                        ※ 원격검침 데이터 기반이므로 실제 고지서와 차이가 있을 수 있습니다.
                                    </div>
                                </div>

                                {/* Mask Lock Overlay for Unauthorized State */}
                                {!isAuthenticated && (
                                    <div className="unauth-card-mask">
                                        <img src="/images/jigubang_3d.png" alt="Lock Icon" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px', filter: 'grayscale(30%)' }} />
                                        <p className="lock-text">실거주 인증 후 에너지 데이터<br />확인이 가능합니다.</p>
                                        <button className="auth-btn" onClick={() => setShowAuthModal(true)}>
                                            실거주 인증하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Card 2: 나의 DR 포인트 */
                            <div className="card data-slider-card dr-points-card">
                                <div className="card-top">
                                    <div className="card-top-left">
                                        <span className="energy-icon">⭐</span>
                                        <span className="card-top-title">나의 DR 포인트</span>
                                    </div>
                                    <div className="period-subtitle">2024.09.23 ~ 현재</div>
                                </div>

                                <div className="usage-summary" style={{ marginBottom: '24px' }}>
                                    <div className="points-title" style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>통합 포인트</div>
                                    <div className="usage-main">
                                        <span className="number-font main-value">{(points.totalPoints || 15600).toLocaleString()}</span>
                                        <span className="unit">Point</span>
                                        <span className="detail-arrow">›</span>
                                    </div>
                                    <div className="cost-main">
                                        <span className="cost-value">누적 적립 {((points.totalPoints || 15600) + 12000).toLocaleString()}P · 누적 사용 12,000P</span>
                                    </div>
                                </div>

                                <div className="dr-stats-row">
                                    <div className="stat-col">
                                        <div className="stat-label">KPX 포인트</div>
                                        <div className="stat-val number-font">{(points.kpxPoints || 10000).toLocaleString()} P</div>
                                    </div>
                                    <div className="stat-col">
                                        <div className="stat-label">경남 포인트</div>
                                        <div className="stat-val number-font green-text">{(points.gyeongnamPoints || 5600).toLocaleString()} P</div>
                                    </div>
                                    <div className="stat-col">
                                        <div className="stat-label">누적 성공</div>
                                        <div className="stat-val number-font blue-text">Active</div>
                                    </div>
                                </div>

                                <div className="disclaimer-text" style={{ marginTop: '16px', textAlign: 'center' }}>
                                    ※ DR 성공 포인트 지급은 관리 주체 최종 확인 후 지급됩니다.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dot indicators */}
                    <div className="slider-dots">
                        <span className={`dot ${activeCard === 'energy' ? 'active' : ''}`} onClick={() => setActiveCard('energy')}></span>
                        <span className={`dot ${activeCard === 'dr' ? 'active' : ''}`} onClick={() => setActiveCard('dr')}></span>
                    </div>
                </div>

                {/* 3. 에너지 절약 캠페인 Section */}
                <section className="campaign-section" style={{ marginTop: '24px' }}>
                    <div className="section-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px 12px 4px' }}>
                        <span className="section-icon">💡</span>
                        <h3 className="section-heading">에너지 절약 캠페인</h3>
                    </div>
                    
                    <div className="campaign-list">
                        <div className="card campaign-item" onClick={() => navigate('/dr-history')}>
                            <div className="campaign-icon-box blue-bg">DR</div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">수요반응 (Demand Response)</h4>
                                <p className="campaign-desc">전기 사용 줄이고 현금 인센티브 받기</p>
                            </div>
                            <span className="campaign-arrow">›</span>
                        </div>

                        <div className="card campaign-item" onClick={() => navigate('/dr-history')}>
                            <div className="campaign-icon-box green-bg">국민</div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">국민DR (에너지쉼표)</h4>
                                <p className="campaign-desc">전력거래소 주관, 전국 아파트 대상 DR 프로그램</p>
                            </div>
                            <span className="campaign-arrow">›</span>
                        </div>

                        <div className="card campaign-item" onClick={() => navigate('/dr-history')}>
                            <div className="campaign-icon-box orange-bg">경남</div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">경남DR</h4>
                                <p className="campaign-desc">경상남도 도청 주관 DR 프로그램</p>
                            </div>
                            <span className="campaign-arrow">›</span>
                        </div>
                    </div>
                </section>


            </main>

            {/* 실거주 인증 요청 모달 팝업 */}
            {showAuthModal && (
                <div className="custom-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '24px'
                }}>
                    <div className="custom-modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '320px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    }}>
                        <div style={{ padding: '24px 20px 20px 20px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#2f3542', marginBottom: '16px', marginTop: 0 }}>
                                실거주 인증을 요청 하시겠어요?
                            </h3>
                            
                            <div style={{
                                backgroundColor: '#f1f3f5',
                                borderRadius: '16px',
                                padding: '16px',
                                marginBottom: '16px',
                                border: '1px solid #e9ecef'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#747d8c', display: 'block', marginBottom: '4px' }}>
                                    관리사무소
                                </span>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: '#00a8ff', letterSpacing: '0.5px' }}>
                                    {getOfficePhone()}
                                </span>
                                
                                <p style={{ fontSize: '11px', color: '#57606f', marginTop: '10px', lineHeight: 1.5, marginBottom: 0 }}>
                                    실거주 인증은 '입주민 명부' 대조가 필요해<br />
                                    아파트 관리사무소에서 진행됩니다.
                                </p>
                            </div>
        
                            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff4757', lineHeight: 1.5, margin: 0 }}>
                                실거주 미인증 상태에서는<br />
                                에너지 인사이트 정보 및 DR포인트 사용이 제한됩니다.
                            </p>
                        </div>
        
                        <div style={{ display: 'flex', borderTop: '1px solid #e9ecef', height: '48px' }}>
                            <button onClick={() => setShowAuthModal(false)} style={{
                                flex: 1,
                                border: 'none',
                                background: '#f1f3f5',
                                color: '#57606f',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                                취소
                            </button>
                            <button onClick={() => {
                                setShowAuthModal(false);
                                window.location.href = 'tel:' + getOfficePhone();
                            }} style={{
                                flex: 1,
                                border: 'none',
                                background: '#00a8ff',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                                통화하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default HomePage;
