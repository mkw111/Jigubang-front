import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [energySummary, setEnergySummary] = useState<any>(null);
    const [activeDr, setActiveDr] = useState<any>(null);
    const [points, setPoints] = useState<any>(null);

    useEffect(() => {
        if (!user.uuid) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const summaryRes = await fetch(`/api/energy/summary/${user.hoSeq}`);
                if (summaryRes.ok) setEnergySummary(await summaryRes.json());

                const drRes = await fetch('/api/dr/active-issue');
                if (drRes.status === 200) setActiveDr(await drRes.json());

                const pointsRes = await fetch(`/api/households/${user.hoSeq}/points`);
                if (pointsRes.ok) setPoints(await pointsRes.json());
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }
        };

        fetchData();
    }, [user.hoSeq, user.uuid, navigate]);

    const gaugePercent = 70;

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="location-info">
                    <span className="apt-name">{user.aptName || '지구방 아파트'}</span>
                    <span className="ho-info">{user.dong}동 {user.ho}호</span>
                </div>
                <div className="user-icon" onClick={() => navigate('/mypage')}>👤</div>
            </header>

            <main className="dashboard-content">
                {activeDr && (
                    <div className="dr-banner active" onClick={() => navigate('/dr-history')}>
                        <span className="dr-tag">LIVE</span>
                        <p className="dr-text">지금은 <strong>수요반응</strong> 참여 시간!</p>
                        <span className="dr-arrow">›</span>
                    </div>
                )}

                <section className="card usage-card">
                    <h3 className="card-title">이번 달 우리 집 에너지</h3>
                    <div className="gauge-container">
                        <div className="gauge-circle" style={{ '--per': `${gaugePercent}%` } as React.CSSProperties}>
                            <div className="usage-value">
                                <span className="number">{energySummary?.totalUsage || '124.5'}</span>
                                <span className="unit">kWh</span>
                            </div>
                        </div>
                    </div>
                    <p className="compare-text">전월 대비 <strong>5.2%</strong> 절감 중!</p>
                </section>

                <div className="info-grid">
                    <section className="card small-card">
                        <h4 className="card-label">탄소 배출량</h4>
                        <div className="card-val">
                            <strong>{energySummary?.carbonEmission || '54.8'}</strong> kg
                        </div>
                    </section>
                    <section className="card small-card">
                        <h4 className="card-label">심은 나무 효과</h4>
                        <div className="card-val green">
                            <strong>{energySummary?.treeCount || '2.4'}</strong> 그루 🌳
                        </div>
                    </section>
                </div>

                <section className="card points-card" onClick={() => navigate('/dr-history')}>
                    <div className="points-info">
                        <h4 className="card-label" style={{color: 'rgba(255,255,255,0.6)'}}>보유 포인트</h4>
                        <div className="points-value">
                            <strong>{points?.totalPoints?.toLocaleString() || '12,500'}</strong> P
                        </div>
                    </div>
                    <button className="shop-btn">포인트 샵 ›</button>
                </section>

                <div style={{height: '100px'}}></div>
            </main>
            
            <BottomNav />
        </div>
    );
};

export default HomePage;
