import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css'; // Reuses some layout containers
import './EnergyDetailPage.css';

const EnergyDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'daily' | 'compare' | 'monthly'>('compare');

    const [user, setUser] = useState<any>({});
    const [energySummary, setEnergySummary] = useState<any>(null);
    const [compareData, setCompareData] = useState<any>(null);
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

    // Fetch API data
    useEffect(() => {
        if (!user.hoSeq) return;

        const fetchData = async () => {
            try {
                const [summaryRes, compareRes] = await Promise.all([
                    fetch(`/api/energy/summary/${user.hoSeq}`),
                    fetch(`/api/energy/compare/${user.hoSeq}`)
                ]);
                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setEnergySummary(data);
                }
                if (compareRes.ok) {
                    const data = await compareRes.json();
                    setCompareData(data);
                }
            } catch (err) {
                console.error("Failed to load energy details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.hoSeq]);

    // Base usage values (fall back to simulated realistic defaults if API response is empty/zero)
    const myUsage = compareData?.myUsage || energySummary?.totalUsage || 212;
    const neighborUsage = compareData?.neighborAverage || 245;

    // Helper: calculate South Korea progressive residential electric bill (housing high-voltage standard simulation)
    const calculateElectricBill = (usage: number) => {
        let baseCharge = 910;
        let energyCharge = 0;
        
        if (usage <= 200) {
            baseCharge = 910;
            energyCharge = usage * 120;
        } else if (usage <= 400) {
            baseCharge = 1600;
            energyCharge = (200 * 120) + ((usage - 200) * 214.6);
        } else {
            baseCharge = 7300;
            energyCharge = (200 * 120) + (200 * 214.6) + ((usage - 400) * 307.3);
        }
        
        // Climate charge (9 KRW per kWh) & Fuel cost adjustment (5 KRW per kWh)
        const climateCharge = Math.round(usage * 9);
        const fuelAdjustment = Math.round(usage * 5);
        
        const subtotal = baseCharge + energyCharge + climateCharge + fuelAdjustment;
        const vat = Math.round(subtotal * 0.1);
        const fund = Math.floor((subtotal * 0.037) / 10) * 10;
        
        const total = Math.floor((subtotal + vat + fund) / 10) * 10;
        const level = usage <= 200 ? 1 : usage <= 400 ? 2 : 3;
        
        return {
            baseCharge: Math.round(baseCharge),
            energyCharge: Math.round(energyCharge),
            adjustmentCharge: Math.round(climateCharge + fuelAdjustment),
            totalBill: total,
            level: level
        };
    };

    const billDetails = calculateElectricBill(myUsage);

    // Dynamic hourly chart data scaled relative to myUsage
    const dailyData = [
        { label: '09시', value: parseFloat((myUsage * 0.005).toFixed(1)) },
        { label: '12시', value: parseFloat((myUsage * 0.012).toFixed(1)) },
        { label: '15시', value: parseFloat((myUsage * 0.008).toFixed(1)) },
        { label: '18시', value: parseFloat((myUsage * 0.015).toFixed(1)) },
        { label: '21시', value: parseFloat((myUsage * 0.021).toFixed(1)) },
        { label: '24시', value: parseFloat((myUsage * 0.010).toFixed(1)) }
    ];

    // Find peak hour
    const peakHour = dailyData.reduce((max, curr) => curr.value > max.value ? curr : max, dailyData[0]);

    // Dynamic monthly chart data scaled relative to myUsage
    const monthlyData = [
        { label: '1월', value: Math.round(myUsage * 0.85) },
        { label: '2월', value: Math.round(myUsage * 0.92) },
        { label: '3월', value: Math.round(myUsage * 0.99) },
        { label: '4월', value: Math.round(myUsage * 0.82) },
        { label: '5월', value: Math.round(myUsage) }, 
        { label: '6월(예상)', value: Math.round(myUsage * 1.09) }
    ];

    const expectedJuneUsage = Math.round(myUsage * 1.09);
    const expectedJuneBill = calculateElectricBill(expectedJuneUsage);

    // Dynamic neighbor comparison summary
    const pctDiff = parseFloat((((neighborUsage - myUsage) / neighborUsage) * 100).toFixed(1));
    const isSaving = pctDiff >= 0;

    if (loading) {
        return (
            <div className="page-container insight-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="logo-glow" style={{ width: '60px', height: '60px' }}></div>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '15px', fontWeight: 600, marginTop: '20px', zIndex: 2 }}>에너지 분석 데이터를 로드 중입니다...</div>
            </div>
        );
    }

    return (
        <div className="page-container insight-wrapper">
            {/* Header */}
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>에너지 인사이트</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Content */}
            <main className="app-content insight-content">
                {/* Insight Welcome Banner */}
                <div className="insight-welcome-card">
                    <div className="banner-sub">우리집 에너지 패턴 분석</div>
                    <div className="banner-main">우리집 에너지 패턴을<br />데이터로 알아 볼까요?</div>
                </div>

                {/* Multi-Tab Selector */}
                <div className="insight-tabs">
                    <button 
                        className={`insight-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                        onClick={() => setActiveTab('daily')}
                    >
                        일별 추이
                    </button>
                    <button 
                        className={`insight-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                        onClick={() => setActiveTab('compare')}
                    >
                        이웃 비교
                    </button>
                    <button 
                        className={`insight-tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
                        onClick={() => setActiveTab('monthly')}
                    >
                        월별 비교
                    </button>
                </div>

                {/* Tab Contents */}
                {activeTab === 'daily' && (
                    <div className="card tab-card animated-fade-in">
                        <div className="card-header-row">
                            <span className="card-tab-title">시간대별 실시간 추이</span>
                            <span className="card-tab-desc">오늘 기준</span>
                        </div>
                        
                        <div className="bar-chart-container">
                            {dailyData.map((d, index) => {
                                const maxVal = Math.max(...dailyData.map(item => item.value));
                                const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
                                return (
                                    <div key={index} className="chart-bar-item">
                                        <div className="bar-wrapper">
                                            <div className="bar-fill blue" style={{ height: `${pct}%` }}>
                                                <span className="bar-tooltip number-font">{d.value}</span>
                                            </div>
                                        </div>
                                        <span className="bar-label">{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="insight-summary-box">
                            <span className="summary-icon">💡</span>
                            <p className="summary-desc">주로 <strong>{peakHour.label}</strong> 시간대에 사용량이 가장 높게 나타납니다.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'compare' && (
                    <div className="card tab-card animated-fade-in">
                        <div className="card-header-row">
                            <span className="card-tab-title">이웃 세대 평균 비교</span>
                            <span className="card-tab-desc">동일 아파트 세대 기준</span>
                        </div>

                        <div className="compare-display-container">
                            <div className="compare-column">
                                <div className="bar-wrapper-comp">
                                    <div className="bar-fill green-gradient" style={{ height: `${Math.min(100, (myUsage / Math.max(myUsage, neighborUsage)) * 100)}%` }}>
                                        <span className="value-label number-font">{Math.round(myUsage)}</span>
                                        <span className="unit-label">kWh</span>
                                    </div>
                                </div>
                                <span className="label-text">우리집</span>
                            </div>

                            <div className="compare-column">
                                <div className="bar-wrapper-comp">
                                    <div className="bar-fill gray-gradient" style={{ height: `${Math.min(100, (neighborUsage / Math.max(myUsage, neighborUsage)) * 100)}%` }}>
                                        <span className="value-label number-font">{Math.round(neighborUsage)}</span>
                                        <span className="unit-label">kWh</span>
                                    </div>
                                </div>
                                <span className="label-text">이웃 평균</span>
                            </div>
                        </div>

                        <div className={`insight-summary-box ${isSaving ? 'match-success' : ''}`}>
                            <span className="summary-icon">{isSaving ? '🎉' : '⚠️'}</span>
                            <p className="summary-desc">
                                {isSaving ? (
                                    <>이웃 세대 평균 대비 약 <strong>{pctDiff}%</strong> 적게 사용하여 에너지를 아주 잘 절약하고 계십니다!</>
                                ) : (
                                    <>이웃 세대 평균 대비 약 <strong>{Math.abs(pctDiff)}%</strong> 더 많이 사용하였습니다. 절약 캠페인 참여를 권장합니다.</>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'monthly' && (
                    <div className="card tab-card animated-fade-in">
                        <div className="card-header-row">
                            <span className="card-tab-title">월별 소비 패턴 추이</span>
                            <span className="card-tab-desc">최근 6개월</span>
                        </div>

                        <div className="bar-chart-container">
                            {monthlyData.map((d, index) => {
                                const maxVal = Math.max(...monthlyData.map(item => item.value));
                                const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
                                const isCurrent = d.label.includes('5월');
                                return (
                                    <div key={index} className="chart-bar-item">
                                        <div className="bar-wrapper">
                                            <div className={`bar-fill ${isCurrent ? 'dark-blue' : 'gray-blue'}`} style={{ height: `${pct}%` }}>
                                                <span className="bar-tooltip number-font">{d.value}</span>
                                            </div>
                                        </div>
                                        <span className={`bar-label ${isCurrent ? 'bold-label' : ''}`}>{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="insight-summary-box">
                            <span className="summary-icon">📊</span>
                            <p className="summary-desc">다음 달 예상 사용량은 약 <strong>{expectedJuneUsage}kWh</strong>이며, 예상 요금은 약 <strong>{expectedJuneBill.totalBill.toLocaleString()}원</strong>으로 누진 {expectedJuneBill.level}구간 진입이 예상됩니다.</p>
                        </div>
                    </div>
                )}

                {/* Additional Insight Details Card */}
                <div className="card energy-info-detail-card">
                    <h3 className="detail-card-title">이번 달 청구 요금 상세</h3>
                    <div className="detail-row">
                        <span className="detail-label">기본 요금</span>
                        <span className="detail-val number-font">{billDetails.baseCharge.toLocaleString()} 원</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">전력량 요금</span>
                        <span className="detail-val number-font">{billDetails.energyCharge.toLocaleString()} 원</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">기후환경/연료비 조정액</span>
                        <span className="detail-val number-font">{billDetails.adjustmentCharge.toLocaleString()} 원</span>
                    </div>
                    <div className="detail-row total">
                        <span className="detail-label">총 요금 합계</span>
                        <span className="detail-val highlight number-font">{billDetails.totalBill.toLocaleString()} 원</span>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default EnergyDetailPage;
