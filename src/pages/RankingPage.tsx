import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';
import './RankingPage.css';

interface RankItem {
    rank: number;
    name: string;
    score: number;
    savings: string;
    isMe?: boolean;
}

const RankingPage: React.FC = () => {
    const navigate = useNavigate();
    const [scope, setScope] = useState<'myApt' | 'national'>('myApt');
    const [user, setUser] = useState<any>({});
    const [compareData, setCompareData] = useState<any>(null);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (!user.hoSeq) return;

        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchData = async () => {
            try {
                const [compRes, sumRes] = await Promise.all([
                    fetch(`/api/energy/compare/${user.hoSeq}`, { headers }),
                    fetch(`/api/energy/summary/${user.hoSeq}`, { headers })
                ]);
                if (compRes.ok) {
                    setCompareData(await compRes.json());
                }
                if (sumRes.ok) {
                    setSummaryData(await sumRes.json());
                }
            } catch (err) {
                console.error("Failed to load ranking energy data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.hoSeq, user.token]);

    // Real API dynamic values or fallback to 0
    const myUsage = compareData?.myUsage || summaryData?.thisMonthUsage || 0;
    const avgUsage = compareData?.averageUsage || 0;
    const percentile = compareData?.percentile || 0;

    // Calculate real savings percentage
    const realSavingsPct = avgUsage > 0 ? ((avgUsage - myUsage) / avgUsage * 100).toFixed(1) : '0';
    const mySavingsStr = parseFloat(realSavingsPct) >= 0 ? `${realSavingsPct}%` : `-${Math.abs(parseFloat(realSavingsPct))}%`;
    
    // Calculate custom score
    const myScore = myUsage > 0 ? Math.max(50, Math.min(100, Math.round(90 + parseFloat(realSavingsPct) * 0.5))) : 0;

    // Calculate dynamic rank (e.g. out of 100 households)
    const myRankNum = myUsage > 0 ? Math.max(1, Math.round(percentile)) : 0;

    const myAptRankings: RankItem[] = myUsage > 0 ? [
        { 
            rank: myRankNum, 
            name: user.dong ? `${user.dong}동 ${user.ho}호 (나)` : '지구방 세대 (나)', 
            score: myScore, 
            savings: mySavingsStr, 
            isMe: true 
        }
    ] : [];

    const nationalRankings: RankItem[] = myUsage > 0 ? [
        { 
            rank: myRankNum + 10, 
            name: `${user.aptName || '지구방 아파트'} (나)`, 
            score: Math.max(50, myScore - 5), 
            savings: mySavingsStr, 
            isMe: true 
        }
    ] : [];

    const currentRankings = scope === 'myApt' ? myAptRankings : nationalRankings;

    const getBadge = (rank: number) => {
        if (rank === 1) return <span className="rank-badge gold">🥇</span>;
        if (rank === 2) return <span className="rank-badge silver">🥈</span>;
        if (rank === 3) return <span className="rank-badge bronze">🥉</span>;
        return <span className="rank-badge-number number-font">{rank}</span>;
    };

    if (loading) {
        return (
            <div className="page-container ranking-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '14px', fontWeight: 600 }}>에너지 랭킹을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="page-container ranking-wrapper">
            {/* Header */}
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>에너지 랭킹</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Content */}
            <main className="app-content ranking-content">
                {/* Intro summary card */}
                <div className="ranking-welcome-card">
                    <div className="ranking-top-row">
                        <img src="/images/char_03.png" alt="Trophy Character" style={{ width: '48px', height: '48px', objectFit: 'contain', marginRight: '12px' }} />
                        <div className="text-col">
                            <div className="main-greeting">전국 절전킹은 누구?</div>
                            <div className="sub-desc">우리집은 몇 위 인지 알아볼까요?</div>
                        </div>
                    </div>
                    <div className="my-rank-status">
                        {myUsage <= 0 ? (
                            <>실거주 인증 완료 후 원격검침 사용량 데이터에 따른 랭킹 조회가 가능합니다.</>
                        ) : scope === 'myApt' ? (
                            <>우리집은 현재 단지 내 <strong>상위 {percentile}% ({myRankNum}위)</strong> 입니다.</>
                        ) : (
                            <>우리 단지는 현재 전국 <strong>상위 {percentile + 5}% ({myRankNum + 10}위)</strong> 입니다.</>
                        )}
                    </div>
                </div>

                {/* Scope Switch Tabs */}
                <div className="ranking-tabs">
                    <button 
                        className={`ranking-tab-btn ${scope === 'myApt' ? 'active' : ''}`}
                        onClick={() => setScope('myApt')}
                    >
                        우리 단지 랭킹
                    </button>
                    <button 
                        className={`ranking-tab-btn ${scope === 'national' ? 'active' : ''}`}
                        onClick={() => setScope('national')}
                    >
                        전국 단지 랭킹
                    </button>
                </div>

                {/* Ranking table header */}
                <div className="rank-table-header">
                    <span className="header-col rank">순위</span>
                    <span className="header-col target">{scope === 'myApt' ? '세대' : '아파트 단지'}</span>
                    <span className="header-col pct">절감률</span>
                    <span className="header-col score">종합점수</span>
                </div>

                {/* Ranking List */}
                <div className="ranking-list-container">
                    {currentRankings.length > 0 ? (
                        currentRankings.map((item) => (
                            <div 
                                key={item.rank + '-' + item.name} 
                                className={`card ranking-list-item ${item.isMe ? 'highlight-me' : ''}`}
                            >
                                <div className="rank-col">
                                    {getBadge(item.rank)}
                                </div>
                                <div className="name-col">
                                    <span className={`target-name ${item.isMe ? 'bold' : ''}`}>{item.name}</span>
                                </div>
                                <div className="savings-col number-font">
                                    {item.savings}
                                </div>
                                <div className="score-col number-font">
                                    {item.score}점
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data-display" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                            집계된 에너지 사용량 랭킹 데이터가 존재하지 않습니다.
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default RankingPage;
