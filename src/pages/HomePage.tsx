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
    const [energySummary, setEnergySummary] = useState<any>({ totalUsage: 0, carbonEmission: 0, treeCount: 0 });
    const [points, setPoints] = useState<any>({ totalPoints: 0, kpxPoints: 0, gyeongnamPoints: 0 });
    const [drCardData, setDrCardData] = useState<any>(null);
    const [activeIssue, setActiveIssue] = useState<any>(null);

    const [memberCount, setMemberCount] = useState<number>(0);
    
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

        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchData = async () => {
            try {
                // Fetch energy summary
                const summaryRes = await fetch(`/api/energy/summary/${hoSeq}`, { headers });
                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setEnergySummary(data);
                }

                // Fetch points
                const pointsRes = await fetch(`/api/households/${hoSeq}/points`, { headers });
                if (pointsRes.ok) {
                    const data = await pointsRes.json();
                    setPoints(data);
                }

                // Fetch household members to count them dynamically
                const membersRes = await fetch(`/api/households/members?hoSeq=${hoSeq}`, { headers });
                if (membersRes.ok) {
                    const data = await membersRes.json();
                    if (Array.isArray(data)) {
                        const approved = data.filter((m: any) => m.approvedYn === 'Y').length;
                        setMemberCount(approved);
                    }
                }



                // Fetch DR cards (to get active and joined campaigns count)
                const drCardsRes = await fetch(`/api/dr/cards`, { headers });
                if (drCardsRes.ok) {
                    const data = await drCardsRes.json();
                    setDrCardData(data);
                }

                // Fetch active DR issue if exists
                try {
                    const activeIssueRes = await fetch(`/api/dr/active-issue`, { headers });
                    if (activeIssueRes.ok && activeIssueRes.status !== 204) {
                        const data = await activeIssueRes.json();
                        setActiveIssue(data);
                    } else {
                        setActiveIssue(null);
                    }
                } catch (e) {
                    console.error("Failed to load active issue on home", e);
                }

                // Fetch household and user approval status dynamically from backend
                if (user.uuid) {
                    const statusRes = await fetch(`/api/users/${user.uuid}/status`, { headers });
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
    }, [user.hoSeq, user.uuid, user.token]);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Handle residency verification request (notifies admin via push task)
    const handleRequestResident = async () => {
        if (!user.hoSeq) return;
        try {
            const token = user.token;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch('/api/households/resident/request', {
                method: 'POST',
                headers,
                body: JSON.stringify({ hoSeq: user.hoSeq })
            });
            if (res.ok) {
                alert('실거주 인증 요청이 완료되었습니다. 관리자 승인 후 확인 가능합니다.');
            } else {
                alert('이미 요청 중이거나 요청을 완료할 수 없습니다.');
            }
        } catch (error) {
            console.error("Failed to request resident certification:", error);
            alert('인증 요청 중 오류가 발생했습니다.');
        }
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

    const totalUsage = energySummary?.totalUsage || -1;

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

    const availableDrCount = (drCardData?.isPossibleKpxDr ? 1 : 0) + (drCardData?.isPossibleGyeongnamDr ? 1 : 0);
    const participatingDrCount = (drCardData?.isHouseholdsKpxDr ? 1 : 0) + (drCardData?.isHouseholdsGyeongnamDr ? 1 : 0);

    const formatTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '';
        try {
            const date = new Date(dateTimeStr);
            const hrs = String(date.getHours()).padStart(2, '0');
            const mins = String(date.getMinutes()).padStart(2, '0');
            return `${hrs}:${mins}`;
        } catch {
            return '';
        }
    };

    return (
        <div className="page-container home-wrapper">
            {/* Header Area (Blue Background) */}
            <div className="home-gradient-header">
                <header className="app-header home-header-transparent">
                    <div className="header-address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img 
                            src="/image/지구방BI(화이트).png" 
                            alt="지구방 로고" 
                            style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
                            onError={(e) => {
                                // Fallback to whiteBI
                                (e.target as HTMLImageElement).src = '/image/image00(화이트BI).png';
                            }}
                        />
                        <span>{user.aptName || '데이터 로드 실패'} {user.dong ? `${user.dong}동 ${user.ho}호` : ''}</span>
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
                                <strong>{user.name || '로그인 실패'}님</strong>,<br />
                                오늘도 함께 <span className="highlight-yellow">에너지</span><br />
                                <span className="highlight-yellow">절약</span>을 해 볼까요?
                            </>
                        ) : (
                            <>
                                <strong>{user.name || '로그인 실패'}님</strong>,<br />
                                관리사무소 <span className="highlight-yellow">실거주</span><br />
                                <span className="highlight-yellow">인증</span>이 필요해요.
                            </>
                        )}
                    </div>
                    {/* Premium 3D Mascot visual */}
                    <div className="mascot-cat-illu" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img 
                            src="/image/지구방3D_애니.gif" 
                            alt="지구방 마스코트" 
                            style={{ 
                                width: '92px', 
                                height: '92px', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
                            }} 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/image/지구방3D.png';
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <main className="app-content home-content-scroll" style={{ marginTop: '-40px' }}>
                {/* 🚨 실시간 DR 긴급 절전 미션 발령 알림 위젯 */}
                {activeIssue && (
                    <div className="card dr-active-alert-card animated-pulse" onClick={() => navigate('/dr-history')} style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #FF5252, #FF7A00)', color: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(255, 82, 82, 0.25)', border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        <div className="alert-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span className="live-pulse" style={{ fontSize: '11px', fontWeight: 900, backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>🔴 LIVE</span>
                            <strong className="alert-title" style={{ fontSize: '15px', fontWeight: 800 }}>{activeIssue.drType} 긴급 절전 미션!</strong>
                        </div>
                        <div className="alert-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="alert-main-text" style={{ fontSize: '13px', lineHeight: 1.4, opacity: 0.95 }}>
                                지금 가전제품 전원을 끄고 절전에 동참하시면 성공 포인트 <strong>+{activeIssue.successPoint}P</strong>를 지급해 드립니다!
                            </div>
                            <div className="alert-time" style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                                미션 시간: {formatTime(activeIssue.startAt)} ~ {formatTime(activeIssue.endAt)}
                            </div>
                        </div>
                        <div className="alert-footer" style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', justifyContent: 'flex-end', opacity: 0.9 }}>
                            <span>절전 미션 참여 신청하러 가기 ›</span>
                        </div>
                    </div>
                )}

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
                                        <div className="lock-icon">🔒</div>
                                        <p className="lock-text">실거주 인증 후 에너지 데이터<br />확인이 가능합니다.</p>
                                        <button className="auth-btn" onClick={handleRequestResident}>
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
                                        <span className="number-font main-value">{(points.totalPoints || -1).toLocaleString()}</span>
                                        <span className="unit">Point</span>
                                        <span className="detail-arrow">›</span>
                                    </div>
                                    <div className="cost-main">
                                        <span className="cost-value">누적 적립 {((points.totalPoints || -1) + 12000).toLocaleString()}P · 누적 사용 12,000P</span>
                                    </div>
                                </div>

                                <div className="dr-stats-row">
                                    <div className="stat-col">
                                        <div className="stat-label">KPX 포인트</div>
                                        <div className="stat-val number-font">{(points.kpxPoints || -1).toLocaleString()} P</div>
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

            <BottomNav />
        </div>
    );
};

export default HomePage;
