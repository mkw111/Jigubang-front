import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';

const RankingPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const mockRanking = [
        { rank: 1, name: '101동 1204호', score: '98.5' },
        { rank: 2, name: '103동 502호', score: '95.2' },
        { rank: 3, name: '우리집 (102동 401호)', score: '92.0', isMe: true },
        { rank: 4, name: '105동 101호', score: '88.7' },
        { rank: 5, name: '102동 1503호', score: '85.4' },
    ];

    return (
        <div className="home-container">
            <header className="home-header">
                <h2 className="ho-info">에너지 절약 랭킹</h2>
            </header>

            <main className="dashboard-content">
                <section className="card" style={{ background: '#E8F5E9', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '40px' }}>🥇</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>단지 내 상위 15%</h3>
                            <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>훌륭해요! 이번 달에도 잘하고 계시네요.</p>
                        </div>
                    </div>
                </section>

                <h3 className="card-title" style={{ marginTop: '30px' }}>이웃 랭킹 (이번 달)</h3>
                
                {mockRanking.map((item) => (
                    <div key={item.rank} className="card" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '16px 24px',
                        backgroundColor: item.isMe ? '#E3F2FD' : 'white',
                        border: item.isMe ? '1px solid #2196F3' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <strong style={{ fontSize: '18px', color: item.rank <= 3 ? '#FFD700' : '#CCC', minWidth: '25px' }}>
                                {item.rank}
                            </strong>
                            <span style={{ fontWeight: item.isMe ? 700 : 400 }}>{item.name}</span>
                        </div>
                        <strong style={{ color: '#1A1C1E' }}>{item.score}점</strong>
                    </div>
                ))}
            </main>

            <div style={{ height: '100px' }}></div>
            <BottomNav />
        </div>
    );
};

export default RankingPage;
