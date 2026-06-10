import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Reuse base styles

const EnergyDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [compareData, setCompareData] = useState<any>(null);

    useEffect(() => {
        const fetchCompare = async () => {
            try {
                const res = await fetch(`/api/energy/compare/${user.hoSeq}`);
                if (res.ok) setCompareData(await res.json());
            } catch (e) {
                console.error("Failed to fetch compare data", e);
            }
        };
        fetchCompare();
    }, [user.hoSeq]);

    return (
        <div className="home-container">
            <header className="home-header">
                <div onClick={() => navigate(-1)} style={{cursor: 'pointer', fontSize: '20px'}}>←</div>
                <h2 className="ho-info">에너지 상세 분석</h2>
                <div></div>
            </header>

            <main className="dashboard-content">
                <section className="card">
                    <h3 className="card-title">이웃 평균 비교</h3>
                    <div style={{height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 0'}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{
                                width: '50px', 
                                height: `${(compareData?.myUsage / (compareData?.myUsage + compareData?.neighborAverage)) * 150}px`,
                                background: '#4CAF50',
                                borderRadius: '8px 8px 0 0'
                            }}></div>
                            <span style={{fontSize: '12px', marginTop: '8px', display: 'block'}}>우리집</span>
                            <strong style={{fontSize: '14px'}}>{compareData?.myUsage || 0}</strong>
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <div style={{
                                width: '50px', 
                                height: `${(compareData?.neighborAverage / (compareData?.myUsage + compareData?.neighborAverage)) * 150}px`,
                                background: '#E9ECEF',
                                borderRadius: '8px 8px 0 0'
                            }}></div>
                            <span style={{fontSize: '12px', marginTop: '8px', display: 'block'}}>이웃평균</span>
                            <strong style={{fontSize: '14px'}}>{compareData?.neighborAverage || 0}</strong>
                        </div>
                    </div>
                    <p style={{textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '20px'}}>
                        이웃 평균보다 <strong>{compareData?.neighborAverage - compareData?.myUsage > 0 ? '적게' : '많게'}</strong> 사용하고 있어요.
                    </p>
                </section>

                <section className="card">
                    <h3 className="card-title">시간별 사용 추이</h3>
                    <div style={{height: '150px', background: '#F8F9FA', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999'}}>
                        그래프 준비 중...
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EnergyDetailPage;
