import React, { useState } from 'react';
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

    // Mock ranking data matching designs
    const myAptRankings: RankItem[] = [
        { rank: 1, name: '702동 1402호', score: 99.4, savings: '28.4%' },
        { rank: 2, name: '704동 301호', score: 97.8, savings: '26.1%' },
        { rank: 3, name: '701동 504호', score: 95.5, savings: '24.8%' },
        { rank: 4, name: '703동 1205호', score: 92.1, savings: '22.3%' },
        { rank: 5, name: '701동 1001호 (나)', score: 90.2, savings: '20.5%', isMe: true },
        { rank: 6, name: '705동 902호', score: 87.6, savings: '18.9%' },
        { rank: 7, name: '702동 1101호', score: 85.3, savings: '17.2%' }
    ];

    const nationalRankings: RankItem[] = [
        { rank: 1, name: '목동 신시가지 1단지', score: 99.8, savings: '32.1%' },
        { rank: 2, name: '반포 자이 아파트', score: 98.9, savings: '30.4%' },
        { rank: 3, name: '분당 시범 현대아파트', score: 98.1, savings: '29.7%' },
        { rank: 4, name: '숲속마을 벨라시온 아파트 (나)', score: 94.2, savings: '23.8%', isMe: true },
        { rank: 5, name: '해운대 엘시티', score: 93.5, savings: '22.9%' },
        { rank: 6, name: '송도 더샵 퍼스트월드', score: 91.8, savings: '21.5%' },
        { rank: 7, name: '대구 두산위브더제니스', score: 89.9, savings: '20.1%' }
    ];

    const currentRankings = scope === 'myApt' ? myAptRankings : nationalRankings;

    const getBadge = (rank: number) => {
        if (rank === 1) return <span className="rank-badge gold">🥇</span>;
        if (rank === 2) return <span className="rank-badge silver">🥈</span>;
        if (rank === 3) return <span className="rank-badge bronze">🥉</span>;
        return <span className="rank-badge-number number-font">{rank}</span>;
    };

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
                            <>우리집은 현재 단지 내 <strong>상위 15% (5위)</strong> 입니다.</>
                        ) : (
                            <>우리 단지는 현재 전국 <strong>상위 25% (4위)</strong> 입니다.</>
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
                            key={item.rank} 
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
