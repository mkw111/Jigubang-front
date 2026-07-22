import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    // Lazy initial state from localStorage to avoid initial empty render & extra re-renders
    const [user, setUser] = useState<any>(() => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : {};
        } catch {
            return {};
        }
    });

    const [activeCard, setActiveCard] = useState<'energy' | 'dr'>('energy');
    const [energyMode, setEnergyMode] = useState<'billing' | 'monthly'>('billing'); // 'billing' (검침일) or 'monthly' (당월)
    const [showAuthModal, setShowAuthModal] = useState(false);

    const getOfficePhone = useCallback(() => {
        if (user.aptName?.includes('A단지')) return '02-123-4567';
        if (user.aptName?.includes('B단지')) return '051-987-6543';
        return '031-4760-1112'; // 기본 숲속마을 벨라시온 관리소 번호
    }, [user.aptName]);
    
    // API states
    const [energySummary, setEnergySummary] = useState<any>({ totalUsage: 0, carbonEmission: 0, treeCount: 0 });
    const [points, setPoints] = useState<any>({ totalPoints: 0, kpxPoints: 0, gyeongnamPoints: 0 });
    const [drCardData, setDrCardData] = useState<any>(null);
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [usedPoints, setUsedPoints] = useState<number>(0);
    const [drSubSlide, setDrSubSlide] = useState<'all' | 'kpx' | 'gyeongnam'>('all');
    
    // Check authentication on mount
    useEffect(() => {
        if (!user || !user.hoSeq) {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                navigate('/login');
            }
        }
    }, [user, navigate]);

    // Fetch all dashboard data in parallel & sync user status concurrently
    useEffect(() => {
        const hoSeq = user.hoSeq;
        if (!hoSeq) return;

        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let isMounted = true;

        const fetchAllDashboardData = async () => {
            try {
                // Execute 6 API calls in parallel via Promise.allSettled to eliminate waterfall latency
                const [
                    summaryRes,
                    pointsRes,
                    membersRes,
                    drCardsRes,
                    activeIssueRes,
                    statusRes
                ] = await Promise.allSettled([
                    fetch(`/api/energy/summary/${hoSeq}`, { headers }),
                    fetch(`/api/households/${hoSeq}/points`, { headers }),
                    fetch(`/api/households/members?hoSeq=${hoSeq}`, { headers }),
                    fetch(`/api/dr/cards`, { headers }),
                    fetch(`/api/dr/active-issue`, { headers }),
                    user.uuid ? fetch(`/api/users/${user.uuid}/status`, { headers }) : Promise.resolve(null)
                ]);

                if (!isMounted) return;

                // 1. Energy Summary
                if (summaryRes.status === 'fulfilled' && summaryRes.value?.ok) {
                    const data = await summaryRes.value.json();
                    setEnergySummary(data);
                }

                // 2. Points
                if (pointsRes.status === 'fulfilled' && pointsRes.value?.ok) {
                    const data = await pointsRes.value.json();
                    setPoints(data);
                }

                // Compute local point usage history
                const savedLogs = localStorage.getItem(`point_used_logs_${hoSeq}`);
                if (savedLogs) {
                    try {
                        const parsed = JSON.parse(savedLogs);
                        const totalUsed = parsed.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
                        setUsedPoints(totalUsed);
                    } catch (e) {}
                }

                // 3. Members
                if (membersRes.status === 'fulfilled' && membersRes.value?.ok) {
                    const data = await membersRes.value.json();
                    if (Array.isArray(data)) {
                        const approved = data.filter((m: any) => m.approvedYn === 'Y').length;
                        setMemberCount(approved);
                    }
                }

                // 4. DR Cards
                if (drCardsRes.status === 'fulfilled' && drCardsRes.value?.ok) {
                    const data = await drCardsRes.value.json();
                    setDrCardData(data);
                }

                // 5. Active DR Issue
                if (activeIssueRes.status === 'fulfilled' && activeIssueRes.value?.ok && activeIssueRes.value.status !== 204) {
                    const data = await activeIssueRes.value.json();
                    setActiveIssue(data);
                } else if (activeIssueRes.status === 'fulfilled') {
                    setActiveIssue(null);
                }

                // 6. Sync status
                if (statusRes.status === 'fulfilled' && statusRes.value && statusRes.value.ok) {
                    const statusData = await statusRes.value.json();
                    if (statusData) {
                        const approved = statusData.approved;
                        if (user.isAuthenticated !== approved || user.householdsType !== statusData.householdsType) {
                            const updatedUser = { 
                                ...user, 
                                isAuthenticated: approved,
                                householdsType: statusData.householdsType
                            };
                            setUser(updatedUser);
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load dashboard data from backend", e);
            }
        };

        fetchAllDashboardData();

        return () => {
            isMounted = false;
        };
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

    const calculateElectricBill = useCallback((usage: number) => {
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
    }, []);

    const totalUsage = energySummary?.totalUsage || -1;

    const currentUsage = useMemo(() => {
        return energyMode === 'billing' ? Math.round(totalUsage) : Math.round(totalUsage * 0.7);
    }, [energyMode, totalUsage]);

    const currentCost = useMemo(() => calculateElectricBill(currentUsage), [currentUsage, calculateElectricBill]);
    
    const currentLevel = useMemo(() => (currentUsage <= 200 ? 1 : currentUsage <= 400 ? 2 : 3), [currentUsage]);

    const levelRangeText = useMemo(() => {
        return currentLevel === 1 
            ? "현재 누진 1구간 (0~200kWh)" 
            : currentLevel === 2 
                ? "현재 누진 2구간 (201~400kWh)" 
                : "현재 누진 3구간 (400kWh 초과)";
    }, [currentLevel]);
            
    const expectedUsage = useMemo(() => Math.round(currentUsage * 1.1), [currentUsage]);
    const expectedCost = useMemo(() => calculateElectricBill(expectedUsage), [expectedUsage, calculateElectricBill]);
    
    // Triangle indicator positioning
    const trianglePosition = useMemo(() => {
        return currentLevel === 1 
            ? `${Math.max(10, Math.min(30, (currentUsage / 200) * 30))}%` 
            : currentLevel === 2 
                ? `${33 + Math.max(5, Math.min(33, ((currentUsage - 200) / 200) * 33))}%` 
                : `${66 + Math.max(5, Math.min(33, ((currentUsage - 400) / 400) * 33))}%`;
    }, [currentLevel, currentUsage]);

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
                            src="/image/jigubang_bi_white.png" 
                            alt="지구방 로고" 
                            style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/image/jigubang_bi_white_fallback.png';
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
                            src="/image/jigubang_3d_ani.gif" 
                            alt="지구방 마스코트" 
                            style={{ 
                                width: '92px', 
                                height: '92px', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
                            }} 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/image/jigubang_3d.png';
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
                                        <img src="/images/jigubang_3d.png" alt="Lock Icon" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px', filter: 'grayscale(30%)' }} />
                                        <p className="lock-text">실거주 인증 후 에너지 데이터<br />확인이 가능합니다.</p>
                                        <button className="auth-btn" onClick={handleRequestResident}>
                                            실거주 인증하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Card 2: 나의 DR 포인트 - 국민 DR / 경남 DR / 통합 DR 슬라이더 */
                            <div className="card data-slider-card dr-points-card">
                                <div className="card-top" style={{ marginBottom: '12px' }}>
                                    <div className="card-top-left">
                                        <span className="energy-icon">⭐</span>
                                        <span className="card-top-title">나의 DR 포인트</span>
                                    </div>
                                    {/* DR Sub-slide Carousel Switcher */}
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '2px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDrSubSlide('all'); }}
                                            style={{ border: 'none', borderRadius: '10px', padding: '4px 8px', fontSize: '10px', fontWeight: 800, backgroundColor: drSubSlide === 'all' ? '#0072FF' : 'transparent', color: drSubSlide === 'all' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                                        >
                                            통합
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDrSubSlide('kpx'); }}
                                            style={{ border: 'none', borderRadius: '10px', padding: '4px 8px', fontSize: '10px', fontWeight: 800, backgroundColor: drSubSlide === 'kpx' ? '#0072FF' : 'transparent', color: drSubSlide === 'kpx' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                                        >
                                            국민DR
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDrSubSlide('gyeongnam'); }}
                                            style={{ border: 'none', borderRadius: '10px', padding: '4px 8px', fontSize: '10px', fontWeight: 800, backgroundColor: drSubSlide === 'gyeongnam' ? '#0072FF' : 'transparent', color: drSubSlide === 'gyeongnam' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                                        >
                                            경남DR
                                        </button>
                                    </div>
                                </div>

                                {drSubSlide === 'all' && (
                                    <div onClick={() => navigate('/dr-history?tab=points')} style={{ cursor: 'pointer' }}>
                                        <div className="usage-summary" style={{ marginBottom: '20px' }}>
                                            <div className="points-title" style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>통합 포인트 (국민 + 경남)</div>
                                            <div className="usage-main">
                                                <span className="number-font main-value">{Math.max(0, (points.totalPoints || 0) - usedPoints).toLocaleString()}</span>
                                                <span className="unit">Point</span>
                                                <span className="detail-arrow">›</span>
                                            </div>
                                            <div className="cost-main">
                                                <span className="cost-value">누적 적립 {(points.totalPoints || 0).toLocaleString()}P · 누적 사용 {usedPoints.toLocaleString()}P</span>
                                            </div>
                                        </div>

                                        <div className="dr-stats-row">
                                            <div className="stat-col">
                                                <div className="stat-label">KPX 국민</div>
                                                <div className="stat-val number-font">{(points.kpxPoints || 0).toLocaleString()} P</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">경남도민</div>
                                                <div className="stat-val number-font green-text">{(points.gyeongnamPoints || 0).toLocaleString()} P</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">가입 상태</div>
                                                <div className="stat-val number-font blue-text">Active</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {drSubSlide === 'kpx' && (
                                    <div onClick={() => navigate('/dr-history?tab=points')} style={{ cursor: 'pointer' }}>
                                        <div className="usage-summary" style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span className="points-title" style={{ fontSize: '13px', color: '#0072FF', fontWeight: 800 }}>🇰🇷 국민 DR (KPX 전력거래소)</span>
                                                <span style={{ fontSize: '10px', backgroundColor: '#EFF6FF', color: '#0072FF', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>가입완료</span>
                                            </div>
                                            <div className="usage-main">
                                                <span className="number-font main-value" style={{ color: '#0072FF' }}>{(points.kpxPoints || 0).toLocaleString()}</span>
                                                <span className="unit">Point</span>
                                                <span className="detail-arrow">›</span>
                                            </div>
                                            <div className="cost-main">
                                                <span className="cost-value">전력거래소 주관 전국 단위 수요반응 포인트</span>
                                            </div>
                                        </div>

                                        <div className="dr-stats-row">
                                            <div className="stat-col">
                                                <div className="stat-label">주관 기관</div>
                                                <div className="stat-val number-font" style={{ fontSize: '11px' }}>전력거래소</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">적립 리워드</div>
                                                <div className="stat-val number-font blue-text">회당 +1,000P</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">상세 확인</div>
                                                <div className="stat-val number-font" style={{ fontSize: '11px', color: '#0072FF' }}>바로가기 ›</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {drSubSlide === 'gyeongnam' && (
                                    <div onClick={() => navigate('/dr-history?tab=points')} style={{ cursor: 'pointer' }}>
                                        <div className="usage-summary" style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span className="points-title" style={{ fontSize: '13px', color: '#10B981', fontWeight: 800 }}>🌿 경남 DR (경상남도 지자체)</span>
                                                <span style={{ fontSize: '10px', backgroundColor: '#ECFDF5', color: '#10B981', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>가입완료</span>
                                            </div>
                                            <div className="usage-main">
                                                <span className="number-font main-value" style={{ color: '#10B981' }}>{(points.gyeongnamPoints || 0).toLocaleString()}</span>
                                                <span className="unit">Point</span>
                                                <span className="detail-arrow">›</span>
                                            </div>
                                            <div className="cost-main">
                                                <span className="cost-value">경상남도 지자체 연계 도민 참여 리워드</span>
                                            </div>
                                        </div>

                                        <div className="dr-stats-row">
                                            <div className="stat-col">
                                                <div className="stat-label">주관 기관</div>
                                                <div className="stat-val number-font" style={{ fontSize: '11px' }}>경상남도</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">적립 리워드</div>
                                                <div className="stat-val number-font green-text">회당 +1,000P</div>
                                            </div>
                                            <div className="stat-col">
                                                <div className="stat-label">상세 확인</div>
                                                <div className="stat-val number-font" style={{ fontSize: '11px', color: '#10B981' }}>바로가기 ›</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="disclaimer-text" style={{ marginTop: '14px', textAlign: 'center' }}>
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
                        <div className="card campaign-item" onClick={() => navigate('/dr-history?tab=active')}>
                            <div className="campaign-icon-box blue-bg">DR</div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">수요반응 (Demand Response)</h4>
                                <p className="campaign-desc">전기 사용 줄이고 현금 인센티브 받기</p>
                            </div>
                            <span className="campaign-arrow">›</span>
                        </div>

                        <div className="card campaign-item" onClick={() => navigate('/dr-history?tab=join-status')}>
                            <div className="campaign-icon-box green-bg">국민</div>
                            <div className="campaign-info">
                                <h4 className="campaign-name">국민DR (에너지쉼표)</h4>
                                <p className="campaign-desc">전력거래소 주관, 전국 아파트 대상 DR 프로그램</p>
                            </div>
                            <span className="campaign-arrow">›</span>
                        </div>

                        <div className="card campaign-item" onClick={() => navigate('/dr-history?tab=join-status')}>
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
