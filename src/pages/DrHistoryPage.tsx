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

    const handleJoinDrProgram = async (challenge: DRChallenge) => {
        let drProgramType = 'KPX';
        if (challenge.type.includes('경남') || challenge.type.includes('GYEONGNAM') || challenge.type.includes('경남 DR')) {
            drProgramType = 'GYEONGNAM';
        }

        try {
            const token = user.token;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/dr/programs/${drProgramType}/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    apiKey: 'jigubang-web-api-key',
                    documentId: `doc-${challenge.id}`
                })
            });

            if (response.ok) {
                alert(`${challenge.type} 프로그램 가입 신청이 성공적으로 완료되었습니다!`);
                setSelectedMission(null);
                // Refresh cards status
                const cardsRes = await fetch(`/api/dr/cards`, { headers });
                if (cardsRes.ok) {
                    const data = await cardsRes.json();
                    setDrCards(data);
                }
            } else {
                alert('가입 신청 실패');
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
        <div className="page-container dr-wrapper">
            {/* Header */}
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>수요반응 (DR)</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Content */}
            <main className="app-content dr-content">
                {/* Intro welcome Card */}
                <div className="dr-welcome-card">
                    <div className="dr-welcome-top">
                        <span className="live-pulse">● LIVE</span>
                        <span className="dr-count-label">오늘의 DR 발령 <strong>{activeIssue ? '3회' : '2회'}</strong></span>
                    </div>
                    <div className="dr-welcome-main">
                        잠깐의 절전으로<br />지구를 지켜 볼까요?
                    </div>
                </div>

                {/* Cumulative Stats Dashboard */}
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

                {/* Challenge List section */}
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
                            <div className="no-data-display" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                참여 가능한 활성 DR 미션이나 과거 참여 이력이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* BottomNav */}
            <BottomNav />

            {/* Mission Detail Dialog Popup Modal */}
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

                            <p className="detail-guideline">
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer">
                            {selectedMission.status === 'available' ? (
                                <button className="modal-action-btn primary" onClick={() => {
                                    handleJoinDrProgram(selectedMission);
                                }}>신청하기</button>
                            ) : selectedMission.status === 'participating' ? (
                                <button className="modal-action-btn danger" onClick={() => {
                                    alert('포인트를 많이 적립하도록 조금만 더 힘써주세요!');
                                    setSelectedMission(null);
                                }}>절전 인증 대기중</button>
                            ) : (
                                <button className="modal-action-btn secondary" onClick={() => setSelectedMission(null)}>닫기</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrHistoryPage;
