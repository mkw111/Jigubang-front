import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
                {/* Active DR Banner */}
                {activeDr && (
                    <div className="dr-banner active" onClick={() => navigate('/dr-history')}>
                        <span className="dr-tag">LIVE</span>
                        <p className="dr-text">지금은 <strong>국민쉼표</strong> 시간! 에너지 절감에 참여하세요.</p>
                        <span className="dr-arrow">›</span>
                    </div>
                )}

                {/* Energy Gauge Section */}
                <section className="card usage-card">
                    <h3 className="card-title">이번 달 우리 집 에너지</h3>
                    <div className="gauge-container">
                        <div className="gauge-circle">
                            <div className="usage-value">
                                <span className="number">{energySummary?.totalUsage || '0.0'}</span>
                                <span className="unit">kWh</span>
                            </div>
                        </div>
                    </div>
                    <p className="compare-text">전월 대비 <strong>5%</strong> 절감 중!</p>
                </section>

                {/* Carbon & Tree Section */}
                <div className="info-grid">
                    <section className="card small-card">
                        <h4 className="card-label">탄소 배출량</h4>
                        <div className="card-val">
                            <strong>{energySummary?.carbonEmission || '0.0'}</strong> kg
                        </div>
                    </section>
                    <section className="card small-card">
                        <h4 className="card-label">심은 나무 효과</h4>
                        <div className="card-val green">
                            <strong>{energySummary?.treeCount || '0'}</strong> 그루 🌳
                        </div>
                    </section>
                </div>

                {/* Points Card */}
                <section className="card points-card" onClick={() => navigate('/dr-history')}>
                    <div className="points-info">
                        <h3 className="card-title">보유 포인트</h3>
                        <div className="points-value">
                            <strong>{points?.totalPoints?.toLocaleString() || '0'}</strong> P
                        </div>
                    </div>
                    <button className="shop-btn">포인트 샵 ›</button>
                </section>

                {/* Quick Menu */}
                <nav className="quick-menu">
                    <div className="menu-item" onClick={() => navigate('/energy-detail')}>
                        <div className="menu-icon">📊</div>
                        <span>상세 분석</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/dr-history')}>
                        <div className="menu-icon">🎯</div>
                        <span>참여 내역</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/board')}>
                        <div className="menu-icon">💬</div>
                        <span>커뮤니티</span>
                    </div>
                </nav>
            </main>
        </div>
    );
};

export default HomePage;
