import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css'; // Reuses some layout containers
import './EnergyDetailPage.css';

const EnergyDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'daily' | 'compare' | 'monthly'>('compare');

    // Mock data for graphs
    const dailyData = [
        { label: '09시', value: 1.2 },
        { label: '12시', value: 2.5 },
        { label: '15시', value: 1.8 },
        { label: '18시', value: 3.2 },
        { label: '21시', value: 4.5 },
        { label: '24시', value: 2.1 }
    ];

    const monthlyData = [
        { label: '1월', value: 180 },
        { label: '2월', value: 195 },
        { label: '3월', value: 210 },
        { label: '4월', value: 175 },
        { label: '5월', value: 199 }, // Current month
        { label: '6월(예상)', value: 232 }
    ];

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
                                const pct = (d.value / maxVal) * 100;
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
                            <p className="summary-desc">주로 <strong>18시 ~ 21시</strong> 저녁 시간대에 사용량이 가장 높게 나타납니다.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'compare' && (
                    <div className="card tab-card animated-fade-in">
                        <div className="card-header-row">
                            <span className="card-tab-title">이웃 세대 평균 비교</span>
                            <span className="card-tab-desc">동일 평형(84㎡) 기준</span>
                        </div>

                        <div className="compare-display-container">
                            <div className="compare-column">
                                <div className="bar-wrapper-comp">
                                    <div className="bar-fill green-gradient" style={{ height: '70%' }}>
                                        <span className="value-label number-font">199</span>
                                        <span className="unit-label">kWh</span>
                                    </div>
                                </div>
                                <span className="label-text">우리집</span>
                            </div>

                            <div className="compare-column">
                                <div className="bar-wrapper-comp">
                                    <div className="bar-fill gray-gradient" style={{ height: '85%' }}>
                                        <span className="value-label number-font">245</span>
                                        <span className="unit-label">kWh</span>
                                    </div>
                                </div>
                                <span className="label-text">이웃 평균</span>
                            </div>
                        </div>

                        <div className="insight-summary-box match-success">
                            <span className="summary-icon">🎉</span>
                            <p className="summary-desc">이웃 세대 평균 대비 약 <strong>18.7%</strong> 적게 사용하여 에너지를 아주 잘 절약하고 계십니다!</p>
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
                                const pct = (d.value / maxVal) * 100;
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
                            <p className="summary-desc">다음 달(6월) 예상 요금은 약 <strong>38,339원</strong>으로 누진 2구간 진입이 예상됩니다.</p>
                        </div>
                    </div>
                )}

                {/* Additional Insight Details Card */}
                <div className="card energy-info-detail-card">
                    <h3 className="detail-card-title">이번 달 청구 요금 상세</h3>
                    <div className="detail-row">
                        <span className="detail-label">기본 요금</span>
                        <span className="detail-val number-font">1,600 원</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">전력량 요금</span>
                        <span className="detail-val number-font">31,520 원</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">기후환경/연료비 조정액</span>
                        <span className="detail-val number-font">2,540 원</span>
                    </div>
                    <div className="detail-row total">
                        <span className="detail-label">총 요금 합계</span>
                        <span className="detail-val highlight number-font">35,660 원</span>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default EnergyDetailPage;
