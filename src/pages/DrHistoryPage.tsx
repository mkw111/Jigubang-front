import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
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
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Dynamic states from database
    const [user, setUser] = useState<any>({});
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const [drSummary, setDrSummary] = useState<any>(null);
    const [recentMissions, setRecentMissions] = useState<any[]>([]);
    const [drCards, setDrCards] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Interactive flow states
    const [joinStep, setJoinStep] = useState<'main' | 'agreement'>('main');
    const [drawerType, setDrawerType] = useState<'KPX' | 'GYEONGNAM' | ''>('');
    const [showGuide, setShowGuide] = useState(false);
    const [selectedMission, setSelectedMission] = useState<DRChallenge | null>(null);

    // Signature/agreement states
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Fetch user session
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch dynamic DR status & details
    const refreshData = React.useCallback(async () => {
        if (!user.hoSeq) return;
        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        try {
            const [activeRes, summaryRes, recentRes, cardsRes] = await Promise.all([
                fetch(`/api/dr/active-issue`, { headers }),
                fetch(`/api/dr/summary`, { headers }),
                fetch(`/api/dr/recent`, { headers }),
                fetch(`/api/dr/cards`, { headers })
            ]);
            if (activeRes.ok && activeRes.status !== 204) {
                setActiveIssue(await activeRes.json());
            } else {
                setActiveIssue(null);
            }
            if (summaryRes.ok) {
                setDrSummary(await summaryRes.json());
            }
            if (recentRes.ok) {
                setRecentMissions(await recentRes.json());
            }
            if (cardsRes.ok) {
                setDrCards(await cardsRes.json());
            }
        } catch (err) {
            console.error("Failed to load DR data", err);
        } finally {
            setLoading(false);
        }
    }, [user.hoSeq, user.token]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Adjust canvas resolution dynamically based on parent container width
    useEffect(() => {
        if (joinStep === 'agreement' && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.parentElement?.clientWidth || 340;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FAFAFA';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [joinStep]);

    // Canvas drawing event handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        e.preventDefault(); // Prevent scrolling on touch
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Form submission
    const handleJoinSubmit = async () => {
        if (!agreedTerms) {
            alert('필수 약관 및 위임 사항에 동의하셔야 신청 가능합니다.');
            return;
        }
        if (!hasSigned) {
            alert('서명 영역에 동의 서명을 작성해 주세요.');
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
                    apiKey: localStorage.getItem('ef_api_key') || 'jigubang-web-api-key',
                    documentId: `mock-${Date.now()}` // Mock bypass trigger
                })
            });

            if (response.ok) {
                setShowSuccessPopup(true);
            } else {
                alert('신청 처리 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
        setJoinStep('main');
        setDrawerType('');
        setAgreedTerms(false);
        setHasSigned(false);
        setLoading(true);
        refreshData();
    };

    // Format LocalDateTime to HH:MM
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

    // Stats calculations
    const totalParticipation = drSummary?.total || 0;
    const totalSuccess = drSummary?.success || 0;
    const successRate = totalParticipation > 0 ? parseFloat(((totalSuccess / totalParticipation) * 100).toFixed(1)) : 0.0;

    // Challenge Mapping
    const drChallenges: DRChallenge[] = [];
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
                dateStr = startPart.split(' ')[0].substring(5);
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

    const isAnyJoined = drCards?.isHouseholdsKpxDr || drCards?.isHouseholdsGyeongnamDr;

    if (loading) {
        return (
            <div className="page-container dr-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '15px', fontWeight: 600 }}>DR 상태 내역을 로드 중...</div>
            </div>
        );
    }

    return (
        <div className="page-container dr-wrapper" style={{ backgroundColor: '#F8FAFC', position: 'relative' }}>
            
            {/* Case 1: Main Dashboard (joinStep === 'main') */}
            {joinStep === 'main' ? (
                <>
                    {/* Header */}
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <span>‹</span>
                        </button>
                        <h2>수요반응 (DR)</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    {/* Dashboard Content */}
                    <main className="app-content dr-content">
                        {/* Live Banner */}
                        <div className="dr-welcome-card">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
                                <div className="dr-welcome-top">
                                    <span className="live-pulse">🔴 LIVE</span>
                                    <span className="dr-count-label">오늘의 DR 발령 <strong>{activeIssue ? '진행 중' : '대기 중'}</strong></span>
                                </div>
                                <div className="dr-welcome-main">
                                    {activeIssue ? (
                                        <>
                                            지금은 절전 시간!<br />
                                            <span style={{ fontSize: '13px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                                                ⏱️ {formatTime(activeIssue.startAt)} ~ {formatTime(activeIssue.endAt)} ({activeIssue.successPoint || 1000}P)
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            잠깐의 절전으로<br />지구를 지켜 볼까요?
                                        </>
                                    )}
                                </div>
                            </div>
                            <img 
                                src="/image/jigubang_3d_ani.gif" 
                                alt="지구방 3D" 
                                style={{ width: '84px', height: '84px', objectFit: 'contain', zIndex: 2, transform: 'translateY(4px)' }} 
                                onError={(e) => { (e.target as HTMLImageElement).src = '/image/jigubang_3d.png'; }}
                            />
                        </div>

                        {/* Guide Book Banner Button */}
                        <div className="dr-guide-banner-btn" onClick={() => setShowGuide(true)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>💡</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <strong style={{ fontSize: '14px', fontWeight: 800 }}>수요반응 참여 방법 가이드</strong>
                                    <span style={{ fontSize: '11px', opacity: 0.85 }}>에너지 절약하고 확실하게 포인트 받는 꿀팁</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700 }}>확인하기 ›</span>
                        </div>

                        {/* Active Program list */}
                        <div className="dr-programs-section">
                            <h3 className="dr-section-title">가입 중인 DR 프로그램</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', zIndex: 2 }}>
                                <div className="card dr-program-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px', backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '10px' }}>🇰🇷</span>
                                        <strong style={{ fontSize: '13px', fontWeight: 800 }}>국민DR (쉼표)</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                        전국 아파트 대상<br />전력거래소 주관 미션
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6' }}>1,000 P / 회</span>
                                        {drCards?.isHouseholdsKpxDr ? (
                                            <span className="dr-badge badge-success">참여 중</span>
                                        ) : (
                                            <button 
                                                onClick={() => { setDrawerType('KPX'); setJoinStep('agreement'); }}
                                                style={{ border: 'none', backgroundColor: '#3B82F6', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                신청하기
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card dr-program-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px', backgroundColor: '#ECFDF5', padding: '6px', borderRadius: '10px' }}>🍊</span>
                                        <strong style={{ fontSize: '13px', fontWeight: 800 }}>경남DR</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                        경상남도 도청 주관<br />도내 주민 전용 미션
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>1,600 P / 회</span>
                                        {drCards?.isHouseholdsGyeongnamDr ? (
                                            <span className="dr-badge badge-success">참여 중</span>
                                        ) : (
                                            <button 
                                                onClick={() => { setDrawerType('GYEONGNAM'); setJoinStep('agreement'); }}
                                                style={{ border: 'none', backgroundColor: '#10B981', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                신청하기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <img 
                                src="/image/char_02.png" 
                                alt="Mascot" 
                                style={{ position: 'absolute', right: '-4px', bottom: '-8px', width: '70px', height: '70px', objectFit: 'contain', zIndex: 1 }} 
                            />
                        </div>

                        {/* Conditional rendering based on join status */}
                        {isAnyJoined ? (
                            <>
                                {/* Cumulative Statistics Dashboard */}
                                <div className="card dr-dashboard-card">
                                    <h3 className="dr-card-title">나의 DR 참여 통계</h3>
                                    
                                    <div className="dr-stats-grid">
                                        <div className="dr-stat-box">
                                            <span className="dr-box-label">누적 참여</span>
                                            <div className="dr-box-value">
                                                <span className="number-font val">{totalParticipation}</span>
                                                <span className="unit">회</span>
                                            </div>
                                        </div>
                                        <div className="dr-stat-box">
                                            <span className="dr-box-label">누적 성공</span>
                                            <div className="dr-box-value green-color">
                                                <span className="number-font val">{totalSuccess}</span>
                                                <span className="unit">회</span>
                                            </div>
                                        </div>
                                        <div className="dr-stat-box">
                                            <span className="dr-box-label">평균 성공률</span>
                                            <div className="dr-box-value blue-color">
                                                <span className="number-font val">{successRate}</span>
                                                <span className="unit">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dr-summary-strip">
                                        <span>참여 중 <strong>{drChallenges.filter(c => c.status === 'participating').length}개</strong></span>
                                        <span>신청 가능 <strong>{drChallenges.filter(c => c.status === 'available').length}개</strong></span>
                                        <span>성공 완료 <strong>{totalSuccess}개</strong></span>
                                    </div>
                                </div>

                                {/* Challenge List */}
                                <div className="dr-list-section">
                                    <h3 className="dr-section-title">DR 미션 리스트</h3>
                                    
                                    <div className="dr-list-container">
                                        {drChallenges.length > 0 ? (
                                            drChallenges.map((challenge) => (
                                                <div 
                                                    key={challenge.id} 
                                                    className={`card dr-challenge-item ${challenge.status === 'failed' ? 'dimmed' : ''}`}
                                                    onClick={() => setSelectedMission(challenge)}
                                                >
                                                    <div className="challenge-left">
                                                        <div className="badge-row">
                                                            {getStatusBadge(challenge.status)}
                                                            <span className="chal-type">{challenge.type}</span>
                                                        </div>
                                                        <div className="chal-title">{challenge.title}</div>
                                                        <div className="chal-time">{challenge.date} | {challenge.time}</div>
                                                    </div>

                                                    <div className="challenge-right">
                                                        <span className={`points-val number-font ${challenge.status === 'success' || challenge.status === 'participating' ? 'green-color' : ''}`}>
                                                            {challenge.status === 'failed' ? '0' : `+${challenge.points.toLocaleString()}`}
                                                        </span>
                                                        <span className="points-unit">P</span>
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
                            </>
                        ) : (
                            /* Unjoined User Empty state Card (Non-intrusive) */
                            <div className="card dr-nonjoined-placeholder" style={{ padding: '30px 20px', borderRadius: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                <span style={{ fontSize: '36px' }}>📝</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <strong style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>아직 DR에 가입하지 않으셨습니다</strong>
                                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6', margin: 0, maxWidth: '280px' }}>
                                        전력거래소 또는 지자체 DR 프로그램에 가입 신청하시면 절전 미션 정보와 리워드 획득 이력을 한눈에 볼 수 있습니다.
                                    </p>
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: '20px' }}>
                                    💡 위 신청하기 버튼을 눌러 서명을 마치시면 즉시 가입됩니다!
                                </div>
                            </div>
                        )}
                    </main>
                    <BottomNav />
                </>
            ) : (
                /* Case 2: Agreement & Signature Canvas View (joinStep === 'agreement') */
                <>
                    {/* Header */}
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => setJoinStep('main')}>
                            <span>‹</span>
                        </button>
                        <h2>OODR 참여 동의</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    {/* Canvas Sign Scroll Area */}
                    <main className="app-content dr-content" style={{ backgroundColor: '#FFFFFF', padding: '0 24px 100px 24px' }}>
                        
                        {/* 1. Title */}
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', lineHeight: 1.4 }}>
                                수요반응 (DR) 신청은<br />어떻게 하나요?
                            </h3>
                        </div>

                        {/* 2. Dragon Mascot Character */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                            <img 
                                src="/image/char_05.png" 
                                alt="Dragon Character" 
                                style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/image/char_02.png'; }}
                            />
                        </div>

                        {/* 3. Info Text Gray Box */}
                        <div style={{ backgroundColor: '#F8FAFC', border: '1.2px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B', lineHeight: 1.6, textAlign: 'center', wordBreak: 'keep-all' }}>
                                수요반응(DR)은 실명제 기반의 서비스 입니다.<br />
                                '지구방' 앱을 통해 온라인으로 간편하게 신청할 수 있습니다.<br />
                                "자세히 보기" 확인 후 "서명하기"를 진행해 주세요.
                            </p>
                            <button 
                                onClick={() => setShowGuide(true)}
                                style={{ width: '80%', height: '38px', border: '1.2px solid #3B82F6', borderRadius: '10px', backgroundColor: 'transparent', color: '#3B82F6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                신청 동의서 자세히 보기
                            </button>
                        </div>

                        {/* 4. Sign Area Label */}
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                                참여에 동의하시면 아래에 서명해 주세요
                            </h4>
                        </div>

                        {/* 5. Interactive HTML5 Drawing Canvas Container */}
                        <div style={{ position: 'relative', width: '100%', height: '180px', border: '1.5px solid #CBD5E1', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
                            <canvas
                                ref={canvasRef}
                                width={340}
                                height={180}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                            />
                            {!hasSigned && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
                                    여기를 터치해 서명해 주세요
                                </div>
                            )}
                        </div>

                        {/* 6. Terms Checkbox */}
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                                <input 
                                    type="checkbox" 
                                    checked={agreedTerms} 
                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                약관 동의 및 신청 정보를 위임 발송합니다.
                            </label>
                        </div>

                    </main>

                    {/* Footer actions */}
                    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 24px 20px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9', zIndex: 100, display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={clearCanvas}
                            style={{ flex: 1, height: '50px', border: '1.2px solid #CBD5E1', borderRadius: '16px', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                        >
                            서명 초기화
                        </button>
                        <button 
                            onClick={handleJoinSubmit}
                            style={{ 
                                flex: 2, 
                                height: '50px', 
                                border: 'none', 
                                borderRadius: '16px', 
                                backgroundColor: (agreedTerms && hasSigned) ? '#3B82F6' : '#E2E8F0', 
                                color: (agreedTerms && hasSigned) ? '#FFFFFF' : '#94A3B8', 
                                fontSize: '14px', 
                                fontWeight: 800, 
                                cursor: (agreedTerms && hasSigned) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            신청하기
                        </button>
                    </div>

                    <BottomNav />
                </>
            )}

            {/* 💡 가이드 모달 */}
            {showGuide && (
                <div className="modal-overlay animated-fade-in" onClick={() => setShowGuide(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DR 참여 방법 안내</h3>
                            <button className="close-modal-btn" onClick={() => setShowGuide(false)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <img 
                                src="/image/dr_guide_method.png" 
                                alt="DR 참여 방법 가이드" 
                                style={{ width: '100%', borderRadius: '16px', objectFit: 'contain' }} 
                            />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0, marginTop: '8px' }}>
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-action-btn primary" onClick={() => setShowGuide(false)}>확인했습니다</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mission Detail popup */}
            {selectedMission && (
                <div className="modal-overlay animated-fade-in" onClick={() => setSelectedMission(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DR 미션 상세</h3>
                            <button className="close-modal-btn" onClick={() => setSelectedMission(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-status">
                                {getStatusBadge(selectedMission.status)}
                                <span className="detail-type">{selectedMission.type}</span>
                            </div>
                            <h4 className="detail-title">{selectedMission.title}</h4>
                            
                            <div className="detail-info-table">
                                <div className="detail-info-row">
                                    <span className="label">일정</span>
                                    <span className="value">{selectedMission.date} {selectedMission.time}</span>
                                </div>
                                <div className="detail-info-row">
                                    <span className="label">목표 감축량</span>
                                    <span className="value bold">{selectedMission.targetReduction}</span>
                                </div>
                                <div className="detail-info-row">
                                    <span className="label">리워드 포인트</span>
                                    <span className="value highlight number-font">{selectedMission.points.toLocaleString()} P</span>
                                </div>
                            </div>

                            <p className="detail-guideline" style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '8px' }}>
                            <button className="modal-action-btn secondary" onClick={() => setSelectedMission(null)} style={{ width: '100%' }}>닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🎉 축하 팝업 모달 (Success Celebration Dialog) */}
            {showSuccessPopup && (
                <div className="modal-overlay animated-fade-in" style={{ zIndex: 12000 }}>
                    <div className="modal-content" style={{ textAlign: 'center', padding: '32px 24px', maxWidth: '320px' }}>
                        
                        {/* Celebrate Character Mascot */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <img 
                                src="/image/char_05.png" 
                                alt="Celebrating Mascot" 
                                style={{ width: '110px', height: '110px', objectFit: 'contain' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/image/char_02.png'; }}
                            />
                        </div>

                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0' }}>
                            축하드려요!
                        </h3>
                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0', wordBreak: 'keep-all' }}>
                            수요반응 신청이 완료되었습니다.
                        </p>

                        <button 
                            onClick={closeSuccessPopup}
                            style={{ 
                                width: '100%', 
                                height: '48px', 
                                border: 'none', 
                                borderRadius: '12px', 
                                backgroundColor: '#3B82F6', 
                                color: '#FFFFFF', 
                                fontSize: '14px', 
                                fontWeight: 800, 
                                cursor: 'pointer' 
                            }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DrHistoryPage;
