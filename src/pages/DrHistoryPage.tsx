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

    // Eformsign parameters (with localStorage cache support)
    const [companyId, setCompanyId] = useState<string>(localStorage.getItem('ef_company_id') || '');
    const [formId, setFormId] = useState<string>(localStorage.getItem('ef_form_id') || '');
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem('ef_api_key') || '');
    const [eformsignActive, setEformsignActive] = useState<boolean>(false);
    const [showConfig, setShowConfig] = useState<boolean>(false);

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
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setDrawerType(null);
        setAgreedTerms(false);
        setEformsignActive(false);
    };

    const startEformsignEmbedding = () => {
        if (!agreedTerms) {
            alert('개인정보 수집 및 이용약관에 동의하셔야 신청 가능합니다.');
            return;
        }
        if (!companyId || !formId) {
            alert('이폼싸인 연동 설정을 완료해주세요! (⚙️ 설정 영역을 활성화하여 입력)');
            setShowConfig(true);
            return;
        }

        // Cache parameters to localStorage
        localStorage.setItem('ef_company_id', companyId);
        localStorage.setItem('ef_form_id', formId);
        localStorage.setItem('ef_api_key', apiKey);

        setEformsignActive(true);

        try {
            const EformSign = (window as any).EformSign;
            if (!EformSign) {
                alert('이폼싸인 SDK 로드에 실패했습니다. index.html 설정을 확인해주세요.');
                setEformsignActive(false);
                return;
            }

            const eformsignInstance = new EformSign();

            // success callback
            eformsignInstance.on("success", function(event: any) {
                console.log("Eformsign Success Event:", event);
                const docId = event.document_id;
                submitJoinDrReal(docId);
            });

            eformsignInstance.on("error", function(event: any) {
                alert("이폼싸인 호출 오류: " + JSON.stringify(event));
                setEformsignActive(false);
            });

            eformsignInstance.on("cancel", function() {
                setEformsignActive(false);
            });

            const options = {
                company_id: companyId,
                form_id: formId,
                mode: "new",
                execution_mode: "embed"
            };

            // 1초 뒤에 iFrame이 렌더링되도록 처리
            setTimeout(() => {
                eformsignInstance.open(options, "eformsign_iframe_container");
            }, 100);

        } catch (e: any) {
            alert('이폼싸인 초기화 에러: ' + e.message);
            setEformsignActive(false);
        }
    };

    const submitJoinDrReal = async (realDocId: string) => {
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
                    apiKey: apiKey || 'jigubang-web-api-key',
                    documentId: realDocId
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

    const submitMockJoin = async () => {
        if (!agreedTerms) {
            alert('개인정보 수집 및 이용약관에 동의하셔야 신청 가능합니다.');
            return;
        }
        submitJoinDrReal(`mock-${Date.now()}`);
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
                        src="/image/jigubang_3d_ani.gif" 
                        alt="지구방 3D" 
                        style={{ 
                            width: '84px', 
                            height: '84px', 
                            objectFit: 'contain',
                            zIndex: 2,
                            transform: 'translateY(4px)'
                        }} 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/image/jigubang_3d.png';
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
                    <img src="/images/char_02.png" alt="Mascot" style={{ position: 'absolute', right: '16px', bottom: '-10px', width: '75px', height: '75px', objectFit: 'contain', zIndex: 1 }} />
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
                                src="/image/dr_guide_method.png" 
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
            {/* 서명 신청 바텀 시트 (Drawer) - eformsign 전자계약서 솔루션 시뮬레이션 */}
            {isDrawerOpen && (
                <div className="modal-overlay animated-fade-in" onClick={closeDrawer} style={{ zIndex: 11000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="drawer-content slide-up-drawer" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '24px 24px 40px 24px', backgroundColor: '#F1F5F9', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '92vh', overflowY: 'auto' }}>
                        
                        {/* Drawer Handle bar */}
                        <div style={{ width: '40px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '2px', alignSelf: 'center' }}></div>

                        {/* eformsign Solution Header Branding */}
                        <div className="eformsign-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.5px' }}>eformsign REAL INTEGRATION</span>
                                <strong style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>
                                    {drawerType === 'KPX' ? '국민DR (쉼표) 절전 가입 신청서' : '경남DR 주민 절전 가입 신청서'}
                                </strong>
                            </div>
                            <button 
                                onClick={() => setShowConfig(!showConfig)}
                                style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.7 }}
                                title="이폼싸인 API 연동 설정"
                            >
                                ⚙️
                            </button>
                        </div>

                        {/* 이폼싸인 크리덴셜 설정 UI (showConfig 가 true 일 때) */}
                        {showConfig && (
                            <div className="eformsign-config-panel" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#475569' }}>⚙️ 이폼싸인 연동 계정 설정 (체험판/실전용)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Company ID (회원사 ID)</label>
                                        <input 
                                            type="text" 
                                            value={companyId} 
                                            onChange={(e) => setCompanyId(e.target.value)}
                                            placeholder="이폼싸인 Company ID 입력"
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Form ID (양식 ID)</label>
                                        <input 
                                            type="text" 
                                            value={formId} 
                                            onChange={(e) => setFormId(e.target.value)}
                                            placeholder="이폼싸인 Form ID 입력"
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>API Key (백엔드 전송용)</label>
                                        <input 
                                            type="password" 
                                            value={apiKey} 
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="이폼싸인 API Key 입력"
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px' }}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('ef_company_id', companyId);
                                            localStorage.setItem('ef_form_id', formId);
                                            localStorage.setItem('ef_api_key', apiKey);
                                            alert('설정이 로컬 스토리지에 저장되었습니다!');
                                            setShowConfig(false);
                                        }}
                                        style={{ border: 'none', backgroundColor: '#3B82F6', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                                    >
                                        설정 저장
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* eformsign Active iFrame Area */}
                        {eformsignActive ? (
                            <div className="eformsign-iframe-wrapper" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'relative', height: '420px' }}>
                                <div id="eformsign_iframe_container" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                            </div>
                        ) : (
                            /* eformsign Paper Container (동의 및 시뮬레이션용) */
                            <div className="eformsign-paper" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {/* 1. 신청자 기본 정보 서식 */}
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 800, color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>1. 신청인 인적사항</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 12px', fontSize: '12px', color: '#1E293B' }}>
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>신청 단지</span>
                                        <span style={{ fontWeight: 800 }}>{user.aptName || '단지 정보 없음'}</span>
                                        
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>세대 정보</span>
                                        <span style={{ fontWeight: 800 }}>{user.dong ? `${user.dong}동 ${user.ho}호` : '동/호 정보 없음'}</span>
                                        
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>성 명</span>
                                        <span style={{ fontWeight: 800 }}>{user.name || '미인증 회원'}</span>
                                        
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>연락처</span>
                                        <span style={{ fontWeight: 800 }}>{user.phoneNumber || '전화번호 없음'}</span>
                                    </div>
                                </div>

                                {/* 2. 약관 및 서약 서식 */}
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 800, color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>2. 개인정보 및 위임 동의</h4>
                                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', padding: '10px', maxHeight: '90px', overflowY: 'auto', fontSize: '10px', color: '#64748B', lineHeight: '1.5' }}>
                                        <strong>[개인정보 제공 동의서약]</strong><br />
                                        본인은 전력거래소(KPX) 및 해당 지자체 수요반응 서비스 참여를 위해 이름, 연락처, AMI 검침값 및 세대 고유식별코드(hoSeq) 등의 정보를 제3자(에너넷 및 지자체 시스템)에 위임 제공하는 것에 동의합니다.
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={agreedTerms} 
                                            onChange={(e) => setAgreedTerms(e.target.checked)}
                                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                        />
                                        위 약관 동의 및 위임 사항에 서명합니다. (필수)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* eformsign Footer Actions */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className="modal-action-btn secondary" 
                                onClick={closeDrawer}
                                style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                            >
                                신청 취소
                            </button>
                            {!eformsignActive ? (
                                <>
                                    <button 
                                        className="modal-action-btn primary" 
                                        onClick={startEformsignEmbedding}
                                        style={{ flex: 2, padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 800, border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                    >
                                        이폼싸인 서명 시작
                                    </button>
                                    <button 
                                        className="modal-action-btn primary" 
                                        onClick={submitMockJoin}
                                        style={{ flex: 1.5, padding: '12px', borderRadius: '14px', fontSize: '12px', fontWeight: 800, border: 'none', backgroundColor: '#10B981', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                    >
                                        간편 제출(Mock)
                                    </button>
                                </>
                            ) : null}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DrHistoryPage;
