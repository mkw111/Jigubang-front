import React, { useState } from 'react';
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

    // Mock DR data matching specifications
    const drChallenges: DRChallenge[] = [
        {
            id: 1,
            title: '지구방 저녁 황금시간 절전 미션',
            type: '지구방 DR',
            points: 2000,
            status: 'participating',
            date: '오늘 (06.25)',
            time: '19:00 ~ 20:00 (1시간)',
            targetReduction: '0.3 kWh 감축'
        },
        {
            id: 2,
            title: '경남 지역 아파트 공동 쉼표',
            type: '경남 DR',
            points: 1500,
            status: 'participating',
            date: '오늘 (06.25)',
            time: '21:00 ~ 22:00 (1시간)',
            targetReduction: '0.2 kWh 감축'
        },
        {
            id: 3,
            title: 'KPX 국민쉼표 일상 절전 챌린지',
            type: 'KPX DR',
            points: 3000,
            status: 'available',
            date: '내일 (06.26)',
            time: '14:00 ~ 15:00 (1시간)',
            targetReduction: '0.5 kWh 감축'
        },
        {
            id: 4,
            title: '6월 3주차 주말 공동 절전',
            type: '지구방 DR',
            points: 1200,
            status: 'success',
            date: '06.21',
            time: '18:00 ~ 19:00',
            targetReduction: '0.2 kWh 감축'
        },
        {
            id: 5,
            title: '6월 2주차 평일 퇴근 절전',
            type: 'KPX DR',
            points: 2500,
            status: 'failed',
            date: '06.18',
            time: '19:00 ~ 20:00',
            targetReduction: '0.4 kWh 감축'
        }
    ];

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
                        <span className="dr-count-label">오늘의 DR 발령 <strong>3회</strong></span>
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
                                <span className="number-font val">115</span>
                                <span className="unit">회</span>
                            </div>
                        </div>
                        <div className="dr-stat-box">
                            <span className="dr-box-label">누적 성공</span>
                            <div className="dr-box-value green-color">
                                <span className="number-font val">67</span>
                                <span className="unit">회</span>
                            </div>
                        </div>
                        <div className="dr-stat-box">
                            <span className="dr-box-label">평균 성공률</span>
                            <div className="dr-box-value blue-color">
                                <span className="number-font val">58.2</span>
                                <span className="unit">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dr-summary-strip">
                        <span>참여 중 <strong>2개</strong></span>
                        <span>신청 가능 <strong>3개</strong></span>
                        <span>승인 완료 <strong>2개</strong></span>
                    </div>
                </div>

                {/* Challenge List section */}
                <div className="dr-list-section">
                    <h3 className="dr-section-title">DR 미션 리스트</h3>
                    
                    <div className="dr-list-container">
                        {drChallenges.map((challenge) => (
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
                        ))}
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
                                    alert('DR 신청이 완료되었습니다.');
                                    setSelectedMission(null);
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
