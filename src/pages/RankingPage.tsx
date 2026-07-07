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
        const fetchData = async () => {
            try {
                const [compRes, sumRes] = await Promise.all([
                    fetch(`/api/energy/compare/${user.hoSeq}`),
                    fetch(`/api/energy/summary/${user.hoSeq}`)
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
    }, [user.hoSeq]);

    // Real API dynamic values or fallback
    const myUsage = compareData?.myUsage || summaryData?.thisMonthUsage || 214;
    const avgUsage = compareData?.averageUsage || 235;
    const percentile = compareData?.percentile || 42.0;

    // Calculate real savings percentage
    const realSavingsPct = avgUsage > 0 ? ((avgUsage - myUsage) / avgUsage * 100).toFixed(1) : '20.5';
    const mySavingsStr = parseFloat(realSavingsPct) >= 0 ? `${realSavingsPct}%` : `-${Math.abs(parseFloat(realSavingsPct))}%`;
    
    // Calculate custom score
    const myScore = Math.max(50, Math.min(100, Math.round(90 + parseFloat(realSavingsPct) * 0.5)));

    // Calculate dynamic rank (e.g. out of 100 households)
    const myRankNum = Math.max(1, Math.round(percentile));

    const myAptRankings: RankItem[] = [
        { rank: 1, name: '702동 1402호', score: 99.4, savings: '28.4%' },
        { rank: 2, name: '704동 301호', score: 97.8, savings: '26.1%' },
        { rank: 3, name: '701동 504호', score: 95.5, savings: '24.8%' },
        { rank: 4, name: '703동 1205호', score: 92.1, savings: '22.3%' },
        { 
            rank: myRankNum, 
            name: user.dong ? `${user.dong}동 ${user.ho}호 (나)` : '701동 1001호 (나)', 
            score: myScore, 
            savings: mySavingsStr, 
            isMe: true 
        },
        { rank: myRankNum + 1, name: '705동 902호', score: 87.6, savings: '18.9%' },
        { rank: myRankNum + 2, name: '702동 1101호', score: 85.3, savings: '17.2%' }
    ].sort((a, b) => a.rank - b.rank); // sort dynamically by rank

    const nationalRankings: RankItem[] = [
        { rank: 1, name: '목동 신시가지 1단지', score: 99.8, savings: '32.1%' },
        { rank: 2, name: '반포 자이 아파트', score: 98.9, savings: '30.4%' },
        { rank: 3, name: '분당 시범 현대아파트', score: 98.1, savings: '29.7%' },
        { 
            rank: myRankNum + 10, 
            name: `${user.aptName || '신길경남 아파트'} (나)`, 
            score: Math.max(50, myScore - 5), 
            savings: mySavingsStr, 
            isMe: true 
        },
        { rank: 15, name: '해운대 엘시티', score: 93.5, savings: '22.9%' },
        { rank: 18, name: '송도 더샵 퍼스트월드', score: 91.8, savings: '21.5%' },
        { rank: 22, name: '대구 두산위브더제니스', score: 89.9, savings: '20.1%' }
    ].sort((a, b) => a.rank - b.rank);

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
                        <span className="trophy-icon">🏆</span>
                        <div className="text-col">
                            <div className="main-greeting">전국 절전킹은 누구?</div>
                            <div className="sub-desc">우리집은 몇 위 인지 알아볼까요?</div>
                        </div>
                    </div>
                    <div className="my-rank-status">
                        {scope === 'myApt' ? (
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
                    {currentRankings.map((item) => (
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
                    ))}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default RankingPage;
