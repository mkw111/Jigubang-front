import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const DrHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [points, setPoints] = useState<any>(null);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const res = await fetch(`/api/households/${user.hoSeq}/points`);
                if (res.ok) setPoints(await res.json());
            } catch (e) {
                console.error("Failed to fetch points", e);
            }
        };
        fetchPoints();
    }, [user.hoSeq]);

    return (
        <div className="home-container">
            <header className="home-header">
                <div onClick={() => navigate(-1)} style={{cursor: 'pointer', fontSize: '20px'}}>←</div>
                <h2 className="ho-info">국민쉼표 참여 내역</h2>
                <div></div>
            </header>

            <main className="dashboard-content">
                <section className="card" style={{background: '#333', color: 'white'}}>
                    <p style={{fontSize: '14px', color: '#AAA', marginBottom: '8px'}}>총 적립 포인트</p>
                    <h3 style={{fontSize: '32px', fontWeight: '800', color: '#FFD700'}}>
                        {points?.totalPoints?.toLocaleString() || '0'} P
                    </h3>
                </section>

                <h3 className="card-title" style={{marginTop: '30px'}}>최근 참여 리스트</h3>
                
                {/* Mock List for UI Demo */}
                <div className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <strong style={{display: 'block', fontSize: '15px'}}>6월 8일 국민쉼표</strong>
                        <span style={{fontSize: '12px', color: '#999'}}>KPX DR | 성공</span>
                    </div>
                    <strong style={{color: '#4CAF50'}}>+1,000 P</strong>
                </div>

                <div className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <strong style={{display: 'block', fontSize: '15px'}}>6월 5일 국민쉼표</strong>
                        <span style={{fontSize: '12px', color: '#999'}}>경남 DR | 성공</span>
                    </div>
                    <strong style={{color: '#4CAF50'}}>+1,600 P</strong>
                </div>

                <div className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6}}>
                    <div>
                        <strong style={{display: 'block', fontSize: '15px'}}>6월 1일 국민쉼표</strong>
                        <span style={{fontSize: '12px', color: '#999'}}>KPX DR | 실패</span>
                    </div>
                    <strong style={{color: '#666'}}>0 P</strong>
                </div>
            </main>
        </div>
    );
};

export default DrHistoryPage;
