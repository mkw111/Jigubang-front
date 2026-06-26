import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>({});
    const [activeCard, setActiveCard] = useState<'energy' | 'dr'>('energy');
    const [energyMode, setEnergyMode] = useState<'billing' | 'monthly'>('billing'); // 'billing' (검침일) or 'monthly' (당월)
    
    // API states
    const [energySummary, setEnergySummary] = useState<any>({ totalUsage: 212, carbonEmission: 54.8, treeCount: 2 });
    const [points, setPoints] = useState<any>({ totalPoints: 15600, kpxPoints: 10000, gyeongnamPoints: 5600 });

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
        if (!user.hoSeq) return;

        const fetchData = async () => {
            try {
                // Fetch energy summary
                const summaryRes = await fetch(`/api/energy/summary/${user.hoSeq}`);
                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setEnergySummary(data);
                }

                // Fetch points
                const pointsRes = await fetch(`/api/households/${user.hoSeq}/points`);
                if (pointsRes.ok) {
                    const data = await pointsRes.json();
                    setPoints(data);
                }



                // Fetch household members to count them dynamically
                const membersRes = await fetch(`/api/households/move-in/list?hoSeq=${user.hoSeq}`);
                if (membersRes.ok) {
                    const data = await membersRes.json();
                    // Include existing members and pending approved ones
                    if (Array.isArray(data)) {
                        const approved = data.filter((m: any) => m.approvedYn === 'Y').length;
                        setMemberCount(approved > 0 ? approved : 4);
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

    // Toggle simulation auth state
    const toggleAuthState = () => {
        const updatedUser = { ...user, isAuthenticated: !user.isAuthenticated };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const isAuthenticated = user.isAuthenticated !== false; // defaults to true

    // Values based on billing/monthly toggles matching the prototype video
    const currentUsage = energyMode === 'billing' ? 212 : 149;
    const currentCost = energyMode === 'billing' ? 35660 : 19441;
    const currentLevel: number = energyMode === 'billing' ? 2 : 1;
    const levelRangeText = energyMode === 'billing' ? "현재 누진 2구간 (201~400kWh)" : "현재 누진 1구간 (0~200kWh)";
    const expectedUsage = energyMode === 'billing' ? 232 : 201;
    const expectedCost = energyMode === 'billing' ? 38339 : 34223;
    const trianglePosition = energyMode === 'billing' ? '50%' : '16%';

    return (
        <div className="page-container home-wrapper">
            {/* Header Area (Blue Background) */}
            <div className="home-gradient-header">
                <header className="app-header home-header-transparent">
                    <div className="header-address">
                        <span>🏠 {user.aptName || '숲속마을 벨라시온'} {user.dong ? `${user.dong}동 ${user.ho}호` : ''}</span>
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
                    {/* Cute CSS draw mascot cat simulation */}
                    <div className="mascot-cat-illu">
                        <div className="cat-clouds">☁️</div>
                        <div className="cat-character">🐱⛳</div>
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
                            <span className="status-badge-val number-font green-val">3</span>
                            <span className="status-badge-label">신청가능 DR</span>
                        </div>
                        <div className="status-badge-item">
                            <span className="status-badge-val number-font blue-val">2</span>
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
                                        <span className="number-font main-value">{energySummary.totalUsage || currentUsage}</span>
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
                                        <div className="lock-icon">🔒</div>
                                        <p className="lock-text">실거주 인증 후 에너지 데이터<br />확인이 가능합니다.</p>
                                        <button className="auth-btn" onClick={() => navigate('/join/apt')}>
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
                                        <span className="cost-value">누적 적립 235,000P · 누적 사용 219,400P</span>
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

                {/* Simulation Switcher */}
                <div className="simulation-switch-panel" style={{ marginTop: '30px', marginBottom: '20px' }}>
                    <button className="sim-toggle-btn" onClick={toggleAuthState}>
                        🔄 인증상태 변경 (현재: {isAuthenticated ? 'ALL PASS' : '미인증 세대락'})
                    </button>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default HomePage;
