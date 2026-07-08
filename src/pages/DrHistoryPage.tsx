import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';
import './DrHistoryPage.css';

interface DRChallenge {
    id: number;
    title: string;
    type: string;
    points: number;
    status: 'participating' | 'available' | 'approved' | 'success' | 'failed';
    date: string;
    time: string;
    targetReduction: string;
}

const DrHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMission, setSelectedMission] = useState<DRChallenge | null>(null);
    const [showGuide, setShowGuide] = useState<boolean>(false);

    // Signature Drawer States & Refs
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [drawerType, setDrawerType] = useState<'KPX' | 'GYEONGNAM' | null>(null);
    const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
    const [hasSigned, setHasSigned] = useState<boolean>(false);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    const [user, setUser] = useState<any>({});
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const [drSummary, setDrSummary] = useState<any>(null);
    const [recentMissions, setRecentMissions] = useState<any[]>([]);
    const [drCards, setDrCards] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Load user profile
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch dynamic DR stats and active issue
    useEffect(() => {
        if (!user.hoSeq) return;

        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchData = async () => {
            try {
                const [activeRes, summaryRes, recentRes, cardsRes] = await Promise.all([
                    fetch(`/api/dr/active-issue`, { headers }),
                    fetch(`/api/dr/summary`, { headers }),
                    fetch(`/api/dr/recent`, { headers }),
                    fetch(`/api/dr/cards`, { headers })
                ]);
                if (activeRes.ok && activeRes.status !== 204) {
                    const data = await activeRes.json();
                    setActiveIssue(data);
                }
                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setDrSummary(data);
                }
                if (recentRes.ok) {
                    const data = await recentRes.json();
                    setRecentMissions(data);
                }
                if (cardsRes.ok) {
                    const data = await cardsRes.json();
                    setDrCards(data);
                }
            } catch (err) {
                console.error("Failed to load DR data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.hoSeq, user.token]);

    const handleJoinDrProgram = (challenge: any) => {
        let drProgramType: 'KPX' | 'GYEONGNAM' = 'KPX';
        if (challenge.type && (challenge.type.includes('경남') || challenge.type.includes('GYEONGNAM') || challenge.type.includes('경남 DR'))) {
            drProgramType = 'GYEONGNAM';
        } else if (challenge.title && (challenge.title.includes('경남') || challenge.title.includes('GYEONGNAM'))) {
            drProgramType = 'GYEONGNAM';
        }

        setSelectedMission(null);
        setDrawerType(drProgramType);
        setIsDrawerOpen(true);
        setAgreedTerms(false);
        setHasSigned(false);
    };

    // Signature Drawer Controls & Canvas drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let clientX, clientY;
        if ('touches' in e) {
            if (e.cancelable) e.preventDefault();
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setDrawerType(null);
        setAgreedTerms(false);
        setHasSigned(false);
    };

    const submitJoinDr = async () => {
        if (!agreedTerms) {
            alert('개인정보 수집 및 이용약관에 동의하셔야 신청 가능합니다.');
            return;
        }
        if (!hasSigned) {
            alert('서명란에 서명을 입력해주세요.');
            return;
        }

        try {
            const token = user.token;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/dr/programs/${drawerType}/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    apiKey: 'jigubang-web-api-key',
                    documentId: `doc-${Date.now()}`
                })
            });

            if (response.ok) {
                alert(`${drawerType === 'KPX' ? '국민DR (쉼표)' : '경남DR'} 프로그램 신청서 제출이 완료되었습니다!`);
                closeDrawer();
                // Refresh status
                const cardsRes = await fetch(`/api/dr/cards`, { headers });
                if (cardsRes.ok) {
                    const data = await cardsRes.json();
                    setDrCards(data);
                }
            } else {
                alert('가입 신청에 실패했습니다.');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    // Format LocalDateTime string to HH:MM
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

    // Calculate dynamic stats
    const totalParticipation = drSummary?.total || 0;
    const totalSuccess = drSummary?.success || 0;
    const successRate = totalParticipation > 0 ? parseFloat(((totalSuccess / totalParticipation) * 100).toFixed(1)) : 0.0;

    // Dynamically construct challenges list based on database values
    const drChallenges: DRChallenge[] = [];

    // 1. Add active issue if exists
    if (activeIssue) {
        const isJoined = activeIssue.drType === 'KPX' 
            ? drCards?.isHouseholdsKpxDr 
            : (activeIssue.drType === 'GYEONGNAM' ? drCards?.isHouseholdsGyeongnamDr : false);

        drChallenges.push({
            id: activeIssue.id,
            title: `${activeIssue.drType} 긴급 절전 국민쉼표 챌린지`,
            type: `${activeIssue.drType} DR`,
            points: activeIssue.successPoint || 1000,
            status: isJoined ? 'participating' : 'available',
            date: '오늘',
            time: `${formatTime(activeIssue.startAt)} ~ ${formatTime(activeIssue.endAt)}`,
            targetReduction: '0.2 kWh 감축'
        });
    }

    // 2. Map recent history entries from backend
    if (Array.isArray(recentMissions)) {
        recentMissions.forEach((item: any, idx: number) => {
            const isSuccess = item.result.startsWith('+');
            const isFailed = item.result === '실패';
            const status = isSuccess ? 'success' : (isFailed ? 'failed' : 'participating');
            
            let pts = 0;
            if (isSuccess) {
                pts = parseInt(item.result.replace(/[^0-9]/g, '')) || 0;
            }

            let dateStr = '이력';
            let timeStr = item.period;
            if (item.period.includes('~')) {
                const parts = item.period.split(' ~ ');
                const startPart = parts[0]; 
                timeStr = startPart.split(' ')[1] + ' ~ ' + parts[1];
                dateStr = startPart.split(' ')[0].substring(5); // "MM-DD"
            }

            drChallenges.push({
                id: 100 + idx,
                title: `${item.dr} 미션 참여 이력`,
                type: item.dr,
                points: pts,
                status: status,
                date: dateStr,
                time: timeStr,
                targetReduction: '0.2 kWh 감축'
            });
        });
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'participating':
                return <span className="dr-badge badge-active">참여 중</span>;
            case 'available':
                return <span className="dr-badge badge-avail">신청 가능</span>;
            case 'approved':
                return <span className="dr-badge badge-approved">승인 완료</span>;
            case 'success':
                return <span className="dr-badge badge-success">성공</span>;
            case 'failed':
                return <span className="dr-badge badge-failed">실패</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="page-container dr-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="logo-glow" style={{ width: '60px', height: '60px' }}></div>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '15px', fontWeight: 600, marginTop: '20px', zIndex: 2 }}>DR 미션 내역을 로드 중입니다...</div>
            </div>
        );
    }

    return (
        <div className="page-container dr-wrapper" style={{ backgroundColor: '#F8FAFC', paddingBottom: '90px' }}>
            {/* Header */}
            <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>수요반응 (DR)</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Content */}
            <main className="app-content dr-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                {/* Intro welcome Card with 3D animation */}
                <div className="dr-welcome-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
                        <div className="dr-welcome-top" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="live-pulse" style={{ background: '#FF5252', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 800 }}>🔴 LIVE</span>
                            <span className="dr-count-label" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>오늘의 DR 발령 <strong>{activeIssue ? '3회' : '2회'}</strong></span>
                        </div>
                        <div className="dr-welcome-main" style={{ fontSize: '20px', fontWeight: 800, color: 'white', lineHeight: '1.4' }}>
                            잠깐의 절전으로<br />지구를 지켜 볼까요?
                        </div>
                    </div>
                    <img 
                        src="/image/지구방3D_애니.gif" 
                        alt="지구방 3D" 
                        style={{ 
                            width: '84px', 
                            height: '84px', 
                            objectFit: 'contain',
                            zIndex: 2,
                            transform: 'translateY(4px)'
                        }} 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/image/지구방3D.png';
                        }}
                    />
                </div>

                {/* 💡 참여방법 가이드 배너 버튼 */}
                <div 
                    className="card dr-guide-banner-btn" 
                    onClick={() => setShowGuide(true)}
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)',
                        border: 'none',
                        marginTop: '4px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>💡</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ fontSize: '14px', fontWeight: 800 }}>수요반응 참여 방법 가이드</strong>
                            <span style={{ fontSize: '11px', opacity: 0.85 }}>에너지 절약하고 확실하게 포인트 받는 꿀팁</span>
                        </div>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>확인하기 ›</span>
                </div>

                {/* DR 프로그램 가입 카드 */}
                <div className="dr-programs-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    <h3 className="dr-section-title" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0 }}>가입 중인 DR 프로그램</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* 1. 국민DR 카드 */}
                        <div className="card dr-program-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid #F0F0F0', gap: '10px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px', backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '10px' }}>🇰🇷</span>
                                <strong style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-dark)' }}>국민DR (쉼표)</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                전국 아파트 대상<br />전력거래소 주관 미션
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6' }}>1,000 P / 회</span>
                                {drCards?.isHouseholdsKpxDr ? (
                                    <span className="dr-badge badge-active" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'var(--color-success)', color: 'white', fontWeight: 700 }}>참여 중</span>
                                ) : (
                                    <button 
                                        onClick={() => handleJoinDrProgram({ id: 1, type: '국민 DR', title: '국민DR', points: 1000, status: 'available', date: '', time: '', targetReduction: '' })}
                                        style={{ border: 'none', backgroundColor: '#3B82F6', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        신청하기
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. 경남DR 카드 */}
                        <div className="card dr-program-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid #F0F0F0', gap: '10px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px', backgroundColor: '#ECFDF5', padding: '6px', borderRadius: '10px' }}>🍊</span>
                                <strong style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-dark)' }}>경남DR</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                경상남도 도청 주관<br />도내 주민 전용 미션
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>1,600 P / 회</span>
                                {drCards?.isHouseholdsGyeongnamDr ? (
                                    <span className="dr-badge badge-active" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'var(--color-success)', color: 'white', fontWeight: 700 }}>참여 중</span>
                                ) : (
                                    <button 
                                        onClick={() => handleJoinDrProgram({ id: 2, type: '경남 DR', title: '경남DR', points: 1600, status: 'available', date: '', time: '', targetReduction: '' })}
                                        style={{ border: 'none', backgroundColor: '#10B981', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        신청하기
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cumulative Stats Dashboard */}
                <div className="card dr-dashboard-card" style={{ padding: '20px', borderRadius: '24px', border: '1px solid #F0F0F0', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <h3 className="dr-card-title" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-dark)', margin: '0 0 16px 0' }}>나의 DR 참여 통계</h3>
                    
                    <div className="dr-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div className="dr-stat-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '16px', gap: '6px' }}>
                            <span className="dr-box-label" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>누적 참여</span>
                            <div className="dr-box-value" style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800 }}>
                                <span className="number-font val" style={{ fontSize: '20px' }}>{totalParticipation}</span>
                                <span className="unit" style={{ fontSize: '10px', marginLeft: '2px', color: 'var(--color-text-muted)' }}>회</span>
                            </div>
                        </div>
                        <div className="dr-stat-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '16px', gap: '6px' }}>
                            <span className="dr-box-label" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>누적 성공</span>
                            <div className="dr-box-value green-color" style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800, color: 'var(--color-success)' }}>
                                <span className="number-font val" style={{ fontSize: '20px' }}>{totalSuccess}</span>
                                <span className="unit" style={{ fontSize: '10px', marginLeft: '2px', color: 'var(--color-text-muted)' }}>회</span>
                            </div>
                        </div>
                        <div className="dr-stat-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '16px', gap: '6px' }}>
                            <span className="dr-box-label" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>평균 성공률</span>
                            <div className="dr-box-value blue-color" style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                                <span className="number-font val" style={{ fontSize: '20px' }}>{successRate}</span>
                                <span className="unit" style={{ fontSize: '10px', marginLeft: '2px', color: 'var(--color-text-muted)' }}>%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dr-summary-strip" style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #F0F0F0', marginTop: '16px', paddingTop: '16px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span>참여 중 <strong>{drChallenges.filter(c => c.status === 'participating').length}개</strong></span>
                        <span>신청 가능 <strong>{drChallenges.filter(c => c.status === 'available').length}개</strong></span>
                        <span>성공 완료 <strong>{totalSuccess}개</strong></span>
                    </div>
                </div>

                {/* Challenge List section */}
                <div className="dr-list-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="dr-section-title" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0 }}>DR 미션 리스트</h3>
                    
                    <div className="dr-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {drChallenges.length > 0 ? (
                            drChallenges.map((challenge) => (
                                <div 
                                    key={challenge.id} 
                                    className={`card dr-challenge-item ${challenge.status === 'failed' ? 'dimmed' : ''}`}
                                    onClick={() => setSelectedMission(challenge)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        borderRadius: '20px',
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #F0F0F0',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                                        opacity: challenge.status === 'failed' ? 0.7 : 1
                                    }}
                                >
                                    <div className="challenge-left" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div className="badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getStatusBadge(challenge.status)}
                                            <span className="chal-type" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{challenge.type}</span>
                                        </div>
                                        <div className="chal-title" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-dark)' }}>{challenge.title}</div>
                                        <div className="chal-time" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{challenge.date} | {challenge.time}</div>
                                    </div>

                                    <div className="challenge-right" style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontWeight: 800 }}>
                                        <span className={`points-val number-font ${challenge.status === 'success' || challenge.status === 'participating' ? 'green-color' : ''}`} style={{ fontSize: '18px', color: challenge.status === 'success' || challenge.status === 'participating' ? 'var(--color-success)' : 'var(--color-text-dark)' }}>
                                            {challenge.status === 'failed' ? '0' : `+${challenge.points.toLocaleString()}`}
                                        </span>
                                        <span className="points-unit" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>P</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data-display" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F0' }}>
                                참여 가능한 활성 DR 미션이나 과거 참여 이력이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* BottomNav */}
            <BottomNav />

            {/* 참여방법 가이드 모달 */}
            {showGuide && (
                <div className="modal-overlay animated-fade-in" onClick={() => setShowGuide(false)} style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '380px', borderRadius: '24px', padding: '24px', backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-text-dark)' }}>DR 참여 방법 안내</h3>
                            <button className="close-modal-btn" onClick={() => setShowGuide(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
                            <img 
                                src="/image/DR참여방법.png" 
                                alt="DR 참여 방법 가이드" 
                                style={{ width: '100%', borderRadius: '16px', objectFit: 'contain', border: '1px solid #F8FAFC' }} 
                            />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                                className="modal-action-btn primary" 
                                onClick={() => setShowGuide(false)}
                                style={{ width: '100%', padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: 'pointer' }}
                            >
                                확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mission Detail Dialog Popup Modal */}
            {selectedMission && (
                <div className="modal-overlay animated-fade-in" onClick={() => setSelectedMission(null)} style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '380px', borderRadius: '24px', padding: '24px', backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-text-dark)' }}>DR 미션 상세</h3>
                            <button className="close-modal-btn" onClick={() => setSelectedMission(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="detail-status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getStatusBadge(selectedMission.status)}
                                <span className="detail-type" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{selectedMission.type}</span>
                            </div>
                            <h4 className="detail-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)' }}>{selectedMission.title}</h4>
                            
                            <div className="detail-info-table" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', padding: '16px 0' }}>
                                <div className="detail-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span className="label" style={{ color: 'var(--color-text-muted)' }}>일정</span>
                                    <span className="value" style={{ color: 'var(--color-text-dark)', fontWeight: 600 }}>{selectedMission.date} {selectedMission.time}</span>
                                </div>
                                <div className="detail-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span className="label" style={{ color: 'var(--color-text-muted)' }}>목표 감축량</span>
                                    <span className="value bold" style={{ color: 'var(--color-text-dark)', fontWeight: 800 }}>{selectedMission.targetReduction}</span>
                                </div>
                                <div className="detail-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span className="label" style={{ color: 'var(--color-text-muted)' }}>리워드 포인트</span>
                                    <span className="value highlight number-font" style={{ color: 'var(--color-success)', fontWeight: 800 }}>{selectedMission.points.toLocaleString()} P</span>
                                </div>
                            </div>

                            <p className="detail-guideline" style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                            {selectedMission.status === 'available' ? (
                                <button className="modal-action-btn primary" onClick={() => {
                                    handleJoinDrProgram(selectedMission);
                                }} style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: 'pointer' }}>신청하기</button>
                            ) : selectedMission.status === 'participating' ? (
                                <button className="modal-action-btn danger" onClick={() => {
                                    alert('포인트를 많이 적립하도록 조금만 더 힘써주세요!');
                                    setSelectedMission(null);
                                }} style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, border: 'none', backgroundColor: '#FF5252', color: 'white', cursor: 'pointer' }}>절전 인증 대기중</button>
                            ) : (
                                <button className="modal-action-btn secondary" onClick={() => setSelectedMission(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, border: '1px solid #F0F0F0', backgroundColor: '#FFFFFF', color: 'var(--color-text-dark)', cursor: 'pointer' }}>닫기</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* 서명 신청 바텀 시트 (Drawer) */}
            {isDrawerOpen && (
                <div className="modal-overlay animated-fade-in" onClick={closeDrawer} style={{ zIndex: 11000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="drawer-content slide-up-drawer" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '24px 24px 40px 24px', backgroundColor: '#FFFFFF', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
                        
                        {/* Drawer Handle bar */}
                        <div style={{ width: '40px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', alignSelf: 'center' }}></div>

                        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-dark)' }}>
                                {drawerType === 'KPX' ? '국민DR (쉼표) 가입 신청서' : '경남DR 가입 신청서'}
                            </h3>
                            <button className="close-modal-btn" onClick={closeDrawer} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
                        </div>

                        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* 약관 동의 텍스트 상자 */}
                            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', maxHeight: '120px', overflowY: 'auto', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                                <strong>제1조 (목적)</strong><br />
                                본 약관은 지구방 서비스 내 수요반응(DR) 프로그램 연동 및 가입 시 발생하는 개인정보 제공 및 절전 미션 참여 서약에 관련한 동의 사항을 규정합니다.<br /><br />
                                <strong>제2조 (개인정보 제3자 제공 동의)</strong><br />
                                1. 제공받는 자: (주)에너넷, 전력거래소(KPX) 및 해당 지방자치단체<br />
                                2. 제공 항목: 이름, 연락처, 세대 식별번호(hoSeq), 주소<br />
                                3. 제공 목적: AMI 원격검침 검침값 연계 및 감축량 정산 포인트 지급 처리<br /><br />
                                <strong>제3조 (절전 미션 성실 참여 서약)</strong><br />
                                가입자는 발령 시 문자/앱 푸시를 통해 발송되는 절전 알림에 따라 자발적으로 가전 차단 및 소등 미션에 성실히 응할 것을 서약합니다.
                            </div>

                            {/* 동의 체크박스 */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                                <input 
                                    type="checkbox" 
                                    checked={agreedTerms} 
                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                [필수] 개인정보 제3자 제공 및 약관에 동의합니다
                            </label>

                            {/* 전자 서명 영역 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-dark)' }}>신청 서명란</span>
                                    <button 
                                        onClick={clearSignature}
                                        style={{ border: 'none', backgroundColor: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        초기화 (지우기)
                                    </button>
                                </div>
                                
                                {/* 캔버스 서명 패드 */}
                                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F8FAFC', position: 'relative', height: '140px' }}>
                                    <canvas 
                                        ref={canvasRef}
                                        width={370}
                                        height={140}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                                    />
                                    {!hasSigned && (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94A3B8', fontSize: '12px', pointerEvents: 'none', textAlign: 'center' }}>
                                            여기에 마우스 또는 터치로 서명해주세요
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button 
                                className="modal-action-btn secondary" 
                                onClick={closeDrawer}
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: 'var(--color-text-dark)', cursor: 'pointer' }}
                            >
                                취소
                            </button>
                            <button 
                                className="modal-action-btn primary" 
                                onClick={submitJoinDr}
                                style={{ flex: 2, padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                            >
                                서약 및 신청 완료
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DrHistoryPage;
