import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './DrHistoryPage.css';

const DrHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse tab query parameter (?tab=index | active | insight | join-status | points | shop)
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'index';

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Core states
    const [user, setUser] = useState<any>({});
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const [drSummary, setDrSummary] = useState<any>(null);
    const [drCards, setDrCards] = useState<any>(null);
    const [points, setPoints] = useState<any>(null);
    const [usedLogs, setUsedLogs] = useState<any[]>([]);
    const [recentMissions, setRecentMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation Tab state
    const [activeTab, setActiveTab] = useState<string>(initialTab);

    // sub-tab & filter states
    const [joinSubTab, setJoinSubTab] = useState<'joined' | 'unjoined'>('joined');
    const [pointFilter, setPointFilter] = useState<'all' | 'use' | 'earn'>('all');
    const [insightFilter, setInsightFilter] = useState<'all' | 'success' | 'failed'>('all');

    // UI Interactive states
    const [joinStep, setJoinStep] = useState<'main' | 'agreement'>('main');
    const [drawerType, setDrawerType] = useState<'KPX' | 'GYEONGNAM' | 'GWANGMYEONG' | ''>('');
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showAgreementDetail, setShowAgreementDetail] = useState(false);
    
    // Signature/agreement states
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Shop purchase states & Insight detail modal state
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showShopSuccess, setShowShopSuccess] = useState(false);
    const [shopTab, setShopTab] = useState<'catalog' | 'coupons'>('catalog');
    const [shopCategory, setShopCategory] = useState<number>(0);
    const [purchasedCoupons, setPurchasedCoupons] = useState<any[]>([]);
    const [lastIssuedPin, setLastIssuedPin] = useState<string>('');
    const [apiGoodsList, setApiGoodsList] = useState<any[]>([]);
    const [apiCategories, setApiCategories] = useState<any[]>([]);
    const [selectedInsightItem, setSelectedInsightItem] = useState<any>(null);

    // Synchronize activeTab state with URL tab query string
    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) {
            setActiveTab(tab);
        } else {
            setActiveTab('index');
        }
    }, [location.search]);

    // Fetch user session
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch dynamic DR status & details
    const refreshData = React.useCallback(async () => {
        if (!user.hoSeq) return;
        const token = user.token;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        try {
            const [activeRes, summaryRes, cardsRes, recentRes, pointsRes] = await Promise.all([
                fetch(`/api/dr/active-issue`, { headers }),
                fetch(`/api/dr/summary`, { headers }),
                fetch(`/api/dr/cards`, { headers }),
                fetch(`/api/dr/recent`, { headers }),
                fetch(`/api/households/${user.hoSeq}/points`, { headers })
            ]);
            
            if (activeRes.ok && activeRes.status !== 204) {
                setActiveIssue(await activeRes.json());
            } else {
                setActiveIssue(null);
            }
            if (summaryRes.ok) {
                setDrSummary(await summaryRes.json());
            }
            if (cardsRes.ok) {
                setDrCards(await cardsRes.json());
            }
            if (recentRes.ok) {
                setRecentMissions(await recentRes.json());
            }
            if (pointsRes.ok) {
                setPoints(await pointsRes.json());
            }

            // Fetch AS-IS Gift Goods & Categories
            fetch(`/api/gift-goods`, { headers })
                .then(res => res.ok ? res.json() : [])
                .then(data => { if (Array.isArray(data) && data.length > 0) setApiGoodsList(data); });

            fetch(`/api/gift-goods/categories`, { headers })
                .then(res => res.ok ? res.json() : [])
                .then(data => { if (Array.isArray(data) && data.length > 0) setApiCategories(data); });
        } catch (err) {
            console.error("Failed to load DR data", err);
        } finally {
            setLoading(false);
        }
    }, [user.hoSeq, user.token]);

    // Load point usage history & purchased coupons from localStorage
    useEffect(() => {
        if (user.hoSeq) {
            const savedLogsStr = localStorage.getItem(`point_used_logs_${user.hoSeq}`);
            if (savedLogsStr) {
                try {
                    setUsedLogs(JSON.parse(savedLogsStr));
                } catch (e) {
                    console.error("Failed to parse point_used_logs", e);
                }
            }
            const savedCouponsStr = localStorage.getItem(`purchased_coupons_${user.hoSeq}`);
            if (savedCouponsStr) {
                try {
                    setPurchasedCoupons(JSON.parse(savedCouponsStr));
                } catch (e) {
                    console.error("Failed to parse purchased_coupons", e);
                }
            }
        }
    }, [user.hoSeq]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Adjust canvas resolution dynamically based on parent container width
    useEffect(() => {
        if (joinStep === 'agreement' && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.parentElement?.clientWidth || 340;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FAFAFA';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [joinStep]);

    // Canvas drawing event handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        e.preventDefault(); // Prevent scrolling on touch
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Form submission
    const handleJoinSubmit = async () => {
        if (!agreedTerms) {
            alert('필수 약관 및 위임 사항에 동의하셔야 신청 가능합니다.');
            return;
        }
        if (!hasSigned) {
            alert('서명 영역에 동의 서명을 작성해 주세요.');
            return;
        }

        try {
            const token = user.token;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/dr/programs/${drawerType}/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    apiKey: localStorage.getItem('ef_api_key') || 'jigubang-web-api-key',
                    documentId: `mock-${Date.now()}` // Mock bypass trigger
                })
            });

            if (response.ok) {
                setShowSuccessPopup(true);
            } else {
                alert('신청 처리 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
        setJoinStep('main');
        setDrawerType('');
        setAgreedTerms(false);
        setHasSigned(false);
        setLoading(true);
        refreshData();
    };

    // Products catalog
    const mockProducts = [
        { id: 1, name: '네이버페이 1만원권', provider: '네이버', price: 10000, category: 'pay', image: '/image/image08.png' },
        { id: 2, name: '네이버페이 5천원권', provider: '네이버', price: 5000, category: 'pay', image: '/image/image08.png' },
        { id: 3, name: '신세계 모바일 상품권 1만원권', provider: '신세계', price: 10000, category: 'pay', image: '/image/char_08.png' },
        { id: 4, name: '스타벅스 아메리카노(Tall)', provider: '스타벅스', price: 4500, category: 'cafe', image: '/image/char_05.png' },
        { id: 5, name: '투썸 아메리카노(R)', provider: '투썸플레이스', price: 4500, category: 'cafe', image: '/image/char_02.png' },
        { id: 6, name: '이디야 아메리카노', provider: '이디야', price: 3200, category: 'cafe', image: '/image/char_05.png' },
        { id: 7, name: 'GS25 모바일 상품권 5천원권', provider: 'GS25', price: 5000, category: 'store', image: '/image/char_08.png' },
        { id: 8, name: 'CU 모바일 상품권 3천원권', provider: 'CU', price: 3000, category: 'store', image: '/image/char_08.png' },
        { id: 9, name: 'GS25 모바일 상품권 2천원권', provider: 'GS25', price: 2000, category: 'store', image: '/image/char_08.png' }
    ];

    // Dynamic Point Calculations & Usage Tracking
    const totalUsedAmount = React.useMemo(() => {
        return usedLogs.reduce((sum, item) => sum + (item.amount || 0), 0);
    }, [usedLogs]);

    const baseTotalPoints = React.useMemo(() => {
        return points?.totalPoints ?? drCards?.totalPoint ?? 0;
    }, [points, drCards]);

    const currentTotalPoints = Math.max(0, baseTotalPoints - totalUsedAmount);
    const totalEarnedPoints = baseTotalPoints;

    const handleProductExchange = async () => {
        if (!selectedProduct) return;
        const price = selectedProduct.appPoint || selectedProduct.price;
        if (currentTotalPoints < price) {
            alert(`보유 포인트(${currentTotalPoints.toLocaleString()}P)가 부족하여 교환할 수 없습니다.`);
            return;
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        let pinCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

        try {
            const token = user.token;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/gift-goods/purchase', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    goodsSeq: selectedProduct.goodsSeq || selectedProduct.id,
                    hoSeq: user.hoSeq || 1
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.pinCode) pinCode = data.pinCode;
            }
        } catch (e) {
            console.warn("Backend purchase call fallback to local", e);
        }

        const productName = selectedProduct.couponName || selectedProduct.name;
        const providerName = selectedProduct.affiliate || selectedProduct.provider;
        const imgPath = selectedProduct.goodsImgSmall || selectedProduct.image;

        const newLog = {
            id: Date.now(),
            title: `${productName} 교환`,
            dr: '포인트 쇼핑',
            amount: price,
            result: `-${price.toLocaleString()}P`,
            period: todayStr,
            type: 'use',
            createdAt: new Date().toISOString()
        };

        const newCoupon = {
            id: Date.now(),
            productName: productName,
            provider: providerName,
            price: price,
            image: imgPath,
            pinCode: pinCode,
            purchasedAt: todayStr,
            status: '사용가능'
        };

        const updatedLogs = [newLog, ...usedLogs];
        const updatedCoupons = [newCoupon, ...purchasedCoupons];

        setUsedLogs(updatedLogs);
        setPurchasedCoupons(updatedCoupons);
        setLastIssuedPin(pinCode);

        if (user.hoSeq) {
            localStorage.setItem(`point_used_logs_${user.hoSeq}`, JSON.stringify(updatedLogs));
            localStorage.setItem(`purchased_coupons_${user.hoSeq}`, JSON.stringify(updatedCoupons));
        }

        setSelectedProduct(null);
        setShowShopSuccess(true);
    };

    const combinedPointLogs = React.useMemo(() => {
        const earnedList = recentMissions.map((item, idx) => ({
            id: `earn-${idx}`,
            title: `${item.dr} 미션 정산`,
            period: item.period,
            result: item.result,
            isEarn: item.result.includes('+'),
            timestamp: new Date(item.period.split(' ~ ')[0] || 0).getTime()
        }));

        const usedList = usedLogs.map(item => ({
            id: `use-${item.id}`,
            title: item.title,
            period: item.period,
            result: item.result,
            isEarn: false,
            timestamp: new Date(item.createdAt || item.period).getTime()
        }));

        const merged = [...usedList, ...earnedList];
        merged.sort((a, b) => b.timestamp - a.timestamp);

        return merged.filter(item => {
            if (pointFilter === 'earn') return item.isEarn;
            if (pointFilter === 'use') return !item.isEarn;
            return true;
        });
    }, [recentMissions, usedLogs, pointFilter]);

    const closeShopSuccess = () => {
        setShowShopSuccess(false);
        setSelectedProduct(null);
    };

    // Stats calculations
    const totalParticipation = drSummary?.total || 0;
    const totalSuccess = drSummary?.success || 0;
    const successRate = totalParticipation > 0 ? parseFloat(((totalSuccess / totalParticipation) * 100).toFixed(1)) : 0;

    // Live reduction Wh calculations
    const totalReductionWh = recentMissions.reduce((acc: number, item: any) => acc + (item.reductionWh || 0), 0);
    const liveReduction = 11800 + totalReductionWh;

    const changeTab = (tabName: string) => {
        navigate(`/dr-history?tab=${tabName}`);
    };

    if (loading) {
        return (
            <div className="page-container dr-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-dark)', fontSize: '15px', fontWeight: 600 }}>DR 정보 로드 중...</div>
            </div>
        );
    }

    return (
        <div className="page-container dr-wrapper" style={{ backgroundColor: '#F8FAFC', position: 'relative' }}>
            
            {/* ======================================================== */}
            {/* 1. INDEX: DR Main Portal Page (PDF Page 1 Screen 17) */}
            {activeTab === 'index' && (
                <>
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => navigate('/home')}>
                            <span>‹</span>
                        </button>
                        <h2>수요반응 (DR)</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    <main className="app-content dr-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* 1. 웰컴 라이브 카드 */}
                        <div className="dr-welcome-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                                <div className="dr-welcome-top">
                                    <span className="live-pulse">🔴 LIVE</span>
                                    <span className="dr-count-label">오늘의 DR 발령 <strong>{activeIssue ? '진행 중' : '대기 중'}</strong></span>
                                </div>
                                <div className="dr-welcome-main" style={{ fontSize: '18px' }}>
                                    잠깐의 절전으로<br />지구를 구해 볼까요?
                                </div>
                            </div>
                            <img 
                                src="/image/jigubang_3d_ani.gif" 
                                alt="지구방 3D" 
                                style={{ width: '70px', height: '70px', objectFit: 'contain', zIndex: 2 }} 
                                onError={(e) => { (e.target as HTMLImageElement).src = '/image/jigubang_3d.png'; }}
                            />
                        </div>

                        {/* 2. 오늘의 발령 요약 카드 (Page 4 인덱스형) */}
                        <div 
                            className="card dr-index-card" 
                            onClick={() => changeTab('active')}
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>📅</span>
                                    <strong style={{ fontSize: '15px', color: '#1E293B' }}>오늘의 DR 발령</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <span>누적 참여: <strong>{totalParticipation}회</strong></span>
                                    <span>누적 성공: <strong>{totalSuccess}회</strong></span>
                                    <span>성공률: <strong>{successRate}%</strong></span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ border: '2px solid #FF5252', borderRadius: '8px', padding: '4px 10px', textAlign: 'center', minWidth: '40px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF5252' }}>{activeIssue ? '1' : '0'}</div>
                                    <div style={{ fontSize: '9px', color: '#FF5252', fontWeight: 700 }}>오늘 발령</div>
                                </div>
                                <span style={{ fontSize: '18px', color: '#CBD5E1' }}>›</span>
                            </div>
                        </div>

                        {/* 3. 나의 DR 인사이트 요약 카드 (Page 5 인덱스형) */}
                        <div 
                            className="card dr-index-card" 
                            onClick={() => changeTab('insight')}
                            style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', borderRadius: '24px', padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>📊</span>
                                    <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>나의 DR 인사이트</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                                    감축 성공 및 실패 에너지 흐름 분석
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="number-font" style={{ fontSize: '18px', fontWeight: 900, color: '#00A8FF' }}>-{liveReduction.toLocaleString()}</span>
                                    <span style={{ fontSize: '10px', marginLeft: '2px', color: '#94A3B8' }}>Wh 절감</span>
                                </div>
                                <span style={{ fontSize: '18px', color: '#64748B' }}>›</span>
                            </div>
                        </div>

                        {/* 4. 참여 중인 나의 DR 요약 카드 (Page 6 인덱스형) */}
                        <div 
                            className="card dr-index-card" 
                            onClick={() => changeTab('join-status')}
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>📝</span>
                                    <strong style={{ fontSize: '15px', color: '#1E293B' }}>참여 중인 나의 DR</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <span>신청가능: <strong>3개</strong></span>
                                    <span>승인완료: <strong>{(drCards?.isHouseholdsKpxDr ? 1 : 0) + (drCards?.isHouseholdsGyeongnamDr ? 1 : 0)}개</strong></span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="number-font" style={{ fontSize: '24px', fontWeight: 900, color: '#0072FF' }}>
                                    {(drCards?.isHouseholdsKpxDr ? 1 : 0) + (drCards?.isHouseholdsGyeongnamDr ? 1 : 0)}
                                </span>
                                <span style={{ fontSize: '18px', color: '#CBD5E1' }}>›</span>
                            </div>
                        </div>

                        {/* 5. 나의 DR 포인트 요약 카드 (Page 7 인덱스형) */}
                        <div 
                            className="card dr-index-card" 
                            onClick={() => changeTab('points')}
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>⭐</span>
                                    <strong style={{ fontSize: '15px', color: '#1E293B' }}>나의 DR 포인트</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                                    포인트 적립 및 기프티콘 사용 로그
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="number-font" style={{ fontSize: '20px', fontWeight: 900, color: '#00A8FF' }}>
                                    {(drCards?.totalPoint || 0).toLocaleString()} P
                                </span>
                                <span style={{ fontSize: '18px', color: '#CBD5E1' }}>›</span>
                            </div>
                        </div>

                        {/* 6. 포인트 쇼핑 바로가기 카드 배너 */}
                        <div 
                            className="card dr-guide-banner-btn" 
                            onClick={() => changeTab('shop')}
                            style={{ marginTop: '4px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>🛍️</span>
                                <strong style={{ fontSize: '14px', fontWeight: 800 }}>포인트 쇼핑 바로가기</strong>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700 }}>이동하기 ›</span>
                        </div>

                        {/* 7. 참여 방법 가이드북 배너 */}
                        <div 
                            className="card" 
                            onClick={() => setShowGuide(true)}
                            style={{ backgroundColor: '#F1F5F9', border: 'none', padding: '16px 20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>💡 수요반응 참여 방법 가이드북 열기</span>
                            <span style={{ fontSize: '14px', color: '#94A3B8' }}>›</span>
                        </div>

                    </main>
                    <BottomNav />
                </>
            )}

            {/* ======================================================== */}
            {/* 2. TAB: active (오늘의 DR 발령 상세 페이지 - Page 4) */}
            {activeTab === 'active' && (
                joinStep === 'main' ? (
                    <>
                        <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                            <button className="back-btn" onClick={() => changeTab('index')}>
                                <span>‹</span>
                            </button>
                            <h2>오늘의 DR 발령</h2>
                            <div className="header-placeholder"></div>
                        </header>

                        <main className="app-content dr-content" style={{ padding: '20px' }}>
                            <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px' }}>
                                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                            </div>

                            {activeIssue ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div className="card dr-active-card-item ongoing" style={{ background: 'linear-gradient(135deg, #00A8FF 0%, #0059FF 100%)', color: 'white', padding: '20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0, 168, 255, 0.2)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                                                진행 중인 발령
                                            </span>
                                            <strong style={{ fontSize: '18px', fontWeight: 900 }}>{activeIssue.drType} 긴급 절전</strong>
                                            <span style={{ fontSize: '12px', opacity: 0.9 }}>
                                                ⏱️ {new Date(activeIssue.startAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})} ~ {new Date(activeIssue.endAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFF3C4' }}>
                                                🎯 절감 목표 : -10% 이상 (리워드 {activeIssue.successPoint || 1000}P)
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ backgroundColor: '#FFFFFF', color: '#0059FF', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                                                ⏰ 진행중
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: '16px' }}>
                                    <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                                        <img src="/image/char_02.png" alt="Cat Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ backgroundColor: '#E2E8F0', color: '#475569', padding: '12px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, position: 'relative' }}>
                                        현재 까지 발령 된 DR이 없습니다.
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>
                                    ※ 참여 가능 미신청 DR 캠페인은 신청 승인 후 참여 가능합니다.
                                </span>
                            </div>
                        </main>

                        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 24px 20px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9', zIndex: 100 }}>
                            <button 
                                onClick={() => setIsBottomSheetOpen(true)}
                                style={{ width: '100%', height: '52px', border: 'none', borderRadius: '16px', backgroundColor: '#3B82F6', color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                신청 가능 DR 캠페인 목록
                            </button>
                        </div>

                        {isBottomSheetOpen && (
                            <div className="modal-overlay animated-fade-in" onClick={() => setIsBottomSheetOpen(false)} style={{ zIndex: 11000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                <div className="drawer-content slide-up-drawer" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '24px 24px 40px 24px', backgroundColor: '#FFFFFF', boxShadow: '0 -8px 30px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                    <div style={{ width: '36px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', alignSelf: 'center', marginBottom: '8px' }}></div>
                                    
                                    <button 
                                        onClick={() => setIsBottomSheetOpen(false)}
                                        style={{ position: 'absolute', right: '24px', top: '24px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}
                                    >
                                        ✕
                                    </button>

                                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', textAlign: 'center', margin: '0 0 10px 0' }}>신청 가능 DR 캠페인 목록</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button 
                                            onClick={() => { setIsBottomSheetOpen(false); setDrawerType('KPX'); setJoinStep('agreement'); }}
                                            style={{ width: '100%', height: '52px', border: 'none', borderRadius: '14px', backgroundColor: '#00A8FF', color: 'white', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            국민DR 바로가기
                                        </button>
                                        <button 
                                            onClick={() => { setIsBottomSheetOpen(false); setDrawerType('GYEONGNAM'); setJoinStep('agreement'); }}
                                            style={{ width: '100%', height: '52px', border: 'none', borderRadius: '14px', backgroundColor: '#00A8FF', color: 'white', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            경남DR 바로가기
                                        </button>
                                        <button 
                                            disabled
                                            style={{ width: '100%', height: '52px', border: 'none', borderRadius: '14px', backgroundColor: '#E5E5E5', color: '#FFFFFF', fontSize: '14px', fontWeight: 800, cursor: 'not-allowed' }}
                                        >
                                            광명DR 바로가기 (준비중)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <BottomNav />
                    </>
                ) : (
                    /* Canvas signature view */
                    <>
                        <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                            <button className="back-btn" onClick={() => setJoinStep('main')}>
                                <span>‹</span>
                            </button>
                            <h2>OODR 참여 동의</h2>
                            <div className="header-placeholder"></div>
                        </header>

                        <main className="app-content dr-content" style={{ backgroundColor: '#FFFFFF', padding: '0 24px 160px 24px' }}>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', lineHeight: 1.4 }}>
                                    수요반응 (DR) 신청은<br />어떻게 하나요?
                                </h3>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                                <img src="/image/char_05.png" alt="Dragon" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                            </div>

                            <div style={{ backgroundColor: '#F0F8FF', border: '1.2px solid #C5E2F6', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748B', lineHeight: 1.6, textAlign: 'center', wordBreak: 'keep-all' }}>
                                    수요반응(DR)은 실명제 기반의 서비스 입니다.<br />
                                    지구방 앱을 통해 온라인으로 간편하게 신청할 수 있습니다.
                                </p>

                                {/* 📜 신청 동의서 약관 본문 요약 표시 영역 */}
                                <div style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D0E8F9', borderRadius: '12px', padding: '12px', fontSize: '11px', color: '#475569', textAlign: 'left', lineHeight: 1.5 }}>
                                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>[수요관리사업 참여 개인정보 동의서]</strong>
                                    · 제공받는 자: 전력거래소, 지자체, (주)에너넷<br />
                                    · 이용 목적: 전력량 모니터링, 절전 검증 및 성공 포인트 지급<br />
                                    · 보유 기간: 가입일로부터 3년 또는 탈퇴 시 즉시 파기
                                </div>

                                <button 
                                    onClick={() => setShowAgreementDetail(true)}
                                    style={{ width: '80%', height: '38px', border: '1.2px solid #00A8FF', borderRadius: '10px', backgroundColor: 'transparent', color: '#00A8FF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    신청 동의서 자세히 보기
                                </button>
                            </div>

                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                                    참여에 동의하시면 아래에 서명해 주세요
                                </h4>
                            </div>

                            <div style={{ position: 'relative', width: '100%', height: '180px', border: '1.5px solid #C5E2F6', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
                                <canvas
                                    ref={canvasRef}
                                    width={340}
                                    height={180}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                                />
                                {!hasSigned && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
                                        여기를 터치해 서명해 주세요
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={agreedTerms} 
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    약관 동의 및 신청 정보를 위임 발송합니다.
                                </label>
                            </div>
                        </main>

                        <div style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, padding: '12px 20px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9', zIndex: 1005, display: 'flex', gap: '10px', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
                            <button 
                                onClick={clearCanvas}
                                style={{ flex: 1, height: '48px', border: 'none', borderRadius: '12px', backgroundColor: '#E2E8F0', color: '#475569', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                서명 초기화
                            </button>
                            <button 
                                onClick={handleJoinSubmit}
                                style={{ 
                                    flex: 2, 
                                    height: '48px', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    backgroundColor: (agreedTerms && hasSigned) ? '#00A8FF' : '#E2E8F0', 
                                    color: (agreedTerms && hasSigned) ? '#FFFFFF' : '#94A3B8', 
                                    fontSize: '14px', 
                                    fontWeight: 800, 
                                    cursor: (agreedTerms && hasSigned) ? 'pointer' : 'not-allowed'
                                }}
                            >
                                신청하기
                            </button>
                        </div>

                        <BottomNav />
                    </>
                )
            )}

            {/* ======================================================== */}
            {/* 3. TAB: insight (나의 DR 인사이트 상세 페이지 - PDF Page 5 Screen 19) */}
            {activeTab === 'insight' && (
                <>
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => changeTab('index')}>
                            <span>‹</span>
                        </button>
                        <h2>DR 인사이트</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    <main className="app-content dr-content" style={{ padding: '20px' }}>
                        {/* Blue Energy Reduction Card */}
                        <div className="card dr-dashboard-card" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', border: 'none', padding: '24px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)', marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', opacity: 0.9 }}>나의 DR 누적 절감 성과</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
                                <span className="number-font" style={{ fontSize: '28px', fontWeight: 900, color: '#00A8FF' }}>-{liveReduction.toLocaleString()}</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '4px' }}>Wh 절감</span>
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
                                누적 참여 {totalParticipation}회 중 {totalSuccess}회 성공 달성 (달성률 {totalParticipation > 0 ? Math.round((totalSuccess / totalParticipation) * 100) : 0}%)
                            </div>
                        </div>

                        {/* Filter chip switcher */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button 
                                onClick={() => setInsightFilter('all')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: insightFilter === 'all' ? '#00A8FF' : '#E2E8F0', color: insightFilter === 'all' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                전체 ({recentMissions.length})
                            </button>
                            <button 
                                onClick={() => setInsightFilter('success')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: insightFilter === 'success' ? '#00A8FF' : '#E2E8F0', color: insightFilter === 'success' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                성공 ({recentMissions.filter(m => m.result.includes('+')).length})
                            </button>
                            <button 
                                onClick={() => setInsightFilter('failed')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: insightFilter === 'failed' ? '#00A8FF' : '#E2E8F0', color: insightFilter === 'failed' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                실패 ({recentMissions.filter(m => !m.result.includes('+')).length})
                            </button>
                        </div>

                        {/* Insight timeline list linked with real api values */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {recentMissions
                                .filter(item => {
                                    const isSuccess = item.result.includes('+');
                                    return insightFilter === 'all' || (insightFilter === 'success' ? isSuccess : !isSuccess);
                                })
                                .map((item, idx) => {
                                    const isSuccess = item.result.includes('+');
                                    return (
                                        <div 
                                            key={idx} 
                                            className="card point-tx-item" 
                                            onClick={() => setSelectedInsightItem(item)}
                                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s' }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: isSuccess ? '#ECFDF5' : '#FEF2F2', color: isSuccess ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                                                        {isSuccess ? '성공' : '실패'}
                                                    </span>
                                                    <strong style={{ fontSize: '13px', color: '#1E293B' }}>{item.dr}</strong>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.period}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="number-font" style={{ fontSize: '15px', fontWeight: 900, color: isSuccess ? '#10B981' : '#EF4444' }}>
                                                    {item.result}
                                                </span>
                                                <span style={{ fontSize: '14px', color: '#94A3B8' }}>›</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            {recentMissions.length === 0 && (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                    인사이트 분석 대상 이력이 존재하지 않습니다.
                                </div>
                            )}
                        </div>
                    </main>
                    <BottomNav />
                </>
            )}

            {/* ======================================================== */}
            {/* 4. TAB: join-status (참여 중인 나의 DR 상세 페이지 - Page 6) */}
            {activeTab === 'join-status' && (
                joinStep === 'main' ? (
                    <>
                        <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                            <button className="back-btn" onClick={() => changeTab('index')}>
                                <span>‹</span>
                            </button>
                            <h2>참여 중인 나의 DR</h2>
                            <div className="header-placeholder"></div>
                        </header>

                        <div style={{ display: 'flex', padding: '12px 20px', gap: '10px', backgroundColor: '#FFFFFF' }}>
                            <button 
                                onClick={() => setJoinSubTab('joined')}
                                style={{ flex: 1, height: '36px', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 800, backgroundColor: joinSubTab === 'joined' ? '#00A8FF' : '#F1F5F9', color: joinSubTab === 'joined' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                참여 중인 DR
                            </button>
                            <button 
                                onClick={() => setJoinSubTab('unjoined')}
                                style={{ flex: 1, height: '36px', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 800, backgroundColor: joinSubTab === 'unjoined' ? '#00A8FF' : '#F1F5F9', color: joinSubTab === 'unjoined' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                미신청 DR
                            </button>
                        </div>

                        <main className="app-content dr-content" style={{ padding: '16px' }}>
                            {joinSubTab === 'joined' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {drCards?.isHouseholdsKpxDr && (
                                        <div className="card dr-join-status-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '10px' }}>🇰🇷</span>
                                                <strong style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>국민DR (쉼표)</strong>
                                            </div>

                                            <div className="dr-progress-line-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px dashed #00A8FF', marginLeft: '12px' }}>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 1. 신청서 작성/제출</span>
                                                    <span style={{ color: '#64748B' }}>2024-09-29</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 2. 가입 승인 완료</span>
                                                    <span style={{ color: '#64748B' }}>2024-11-19</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 3. DR 참여 개시</span>
                                                    <span style={{ color: '#64748B' }}>2024-12-06</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => alert('약관 동의 완료 및 서명 처리가 승인되었습니다.')}
                                                style={{ width: '100%', height: '42px', border: '1.2px solid #00A8FF', borderRadius: '12px', backgroundColor: 'transparent', color: '#00A8FF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                신청 동의서 자세히 보기
                                            </button>
                                        </div>
                                    )}

                                    {drCards?.isHouseholdsGyeongnamDr && (
                                        <div className="card dr-join-status-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', backgroundColor: '#ECFDF5', padding: '6px', borderRadius: '10px' }}>🍊</span>
                                                <strong style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>경남DR</strong>
                                            </div>

                                            <div className="dr-progress-line-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px dashed #00A8FF', marginLeft: '12px' }}>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 1. 신청서 작성/제출</span>
                                                    <span style={{ color: '#64748B' }}>2024-10-02</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 2. 가입 승인 완료</span>
                                                    <span style={{ color: '#64748B' }}>2024-11-20</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ fontWeight: 800, color: '#00A8FF' }}>● STEP 3. DR 참여 개시</span>
                                                    <span style={{ color: '#64748B' }}>2024-12-08</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => alert('약관 동의 완료 및 서명 처리가 승인되었습니다.')}
                                                style={{ width: '100%', height: '42px', border: '1.2px solid #00A8FF', borderRadius: '12px', backgroundColor: 'transparent', color: '#00A8FF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                신청 동의서 자세히 보기
                                            </button>
                                        </div>
                                    )}

                                    {!drCards?.isHouseholdsKpxDr && !drCards?.isHouseholdsGyeongnamDr && (
                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                                            참여 중인 DR 프로그램이 없습니다. 미신청 탭에서 신청해주세요.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {!drCards?.isHouseholdsKpxDr && (
                                        <div className="card dr-join-status-card unjoined" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '10px' }}>🇰🇷</span>
                                                <strong style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>국민DR (쉼표)</strong>
                                            </div>

                                            <div className="dr-progress-line-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px dashed #CBD5E1', marginLeft: '12px' }}>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 1. 신청서 작성/제출</span>
                                                    <span>미신청</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 2. 가입 승인 완료</span>
                                                    <span>-</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 3. DR 참여 개시</span>
                                                    <span>-</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => { setDrawerType('KPX'); setJoinStep('agreement'); }}
                                                style={{ width: '100%', height: '42px', border: 'none', borderRadius: '12px', backgroundColor: '#00A8FF', color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                신청하러 바로가기
                                            </button>
                                        </div>
                                    )}

                                    {!drCards?.isHouseholdsGyeongnamDr && (
                                        <div className="card dr-join-status-card unjoined" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', backgroundColor: '#ECFDF5', padding: '6px', borderRadius: '10px' }}>🍊</span>
                                                <strong style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>경남DR</strong>
                                            </div>

                                            <div className="dr-progress-line-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px', borderLeft: '2px dashed #CBD5E1', marginLeft: '12px' }}>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 1. 신청서 작성/제출</span>
                                                    <span>미신청</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 2. 가입 승인 완료</span>
                                                    <span>-</span>
                                                </div>
                                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                                                    <span>○ STEP 3. DR 참여 개시</span>
                                                    <span>-</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => { setDrawerType('GYEONGNAM'); setJoinStep('agreement'); }}
                                                style={{ width: '100%', height: '42px', border: 'none', borderRadius: '12px', backgroundColor: '#00A8FF', color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                신청하러 바로가기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </main>
                        <BottomNav />
                    </>
                ) : (
                    /* OODR signature canvas view */
                    <>
                        <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                            <button className="back-btn" onClick={() => setJoinStep('main')}>
                                <span>‹</span>
                            </button>
                            <h2>OODR 참여 동의</h2>
                            <div className="header-placeholder"></div>
                        </header>

                        <main className="app-content dr-content" style={{ backgroundColor: '#FFFFFF', padding: '0 24px 160px 24px' }}>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', lineHeight: 1.4 }}>
                                    수요반응 (DR) 신청은<br />어떻게 하나요?
                                </h3>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                                <img src="/image/char_05.png" alt="Dragon" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                            </div>

                            <div style={{ backgroundColor: '#F0F8FF', border: '1.2px solid #C5E2F6', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748B', lineHeight: 1.6, textAlign: 'center', wordBreak: 'keep-all' }}>
                                    수요반응(DR)은 실명제 기반의 서비스 입니다.<br />
                                    지구방 앱을 통해 온라인으로 간편하게 신청할 수 있습니다.
                                </p>

                                {/* 📜 신청 동의서 약관 본문 요약 표시 영역 */}
                                <div style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D0E8F9', borderRadius: '12px', padding: '12px', fontSize: '11px', color: '#475569', textAlign: 'left', lineHeight: 1.5 }}>
                                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>[수요관리사업 참여 개인정보 동의서]</strong>
                                    · 제공받는 자: 전력거래소, 지자체, (주)에너넷<br />
                                    · 이용 목적: 전력량 모니터링, 절전 검증 및 성공 포인트 지급<br />
                                    · 보유 기간: 가입일로부터 3년 또는 탈퇴 시 즉시 파기
                                </div>

                                <button 
                                    onClick={() => setShowAgreementDetail(true)}
                                    style={{ width: '80%', height: '38px', border: '1.2px solid #00A8FF', borderRadius: '10px', backgroundColor: 'transparent', color: '#00A8FF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    신청 동의서 자세히 보기
                                </button>
                            </div>

                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                                    참여에 동의하시면 아래에 서명해 주세요
                                </h4>
                            </div>

                            <div style={{ position: 'relative', width: '100%', height: '180px', border: '1.5px solid #C5E2F6', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
                                <canvas
                                    ref={canvasRef}
                                    width={340}
                                    height={180}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                                />
                                {!hasSigned && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
                                        여기를 터치해 서명해 주세요
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={agreedTerms} 
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    약관 동의 및 신청 정보를 위임 발송합니다.
                                </label>
                            </div>
                        </main>

                        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 24px 20px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9', zIndex: 100, display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={clearCanvas}
                                style={{ flex: 1, height: '50px', border: 'none', borderRadius: '12px', backgroundColor: '#E5E5E5', color: '#64748B', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                서명 초기화
                            </button>
                            <button 
                                onClick={handleJoinSubmit}
                                style={{ 
                                    flex: 2, 
                                    height: '50px', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    backgroundColor: (agreedTerms && hasSigned) ? '#00A8FF' : '#E5E5E5', 
                                    color: (agreedTerms && hasSigned) ? '#FFFFFF' : '#94A3B8', 
                                    fontSize: '14px', 
                                    fontWeight: 800, 
                                    cursor: (agreedTerms && hasSigned) ? 'pointer' : 'not-allowed'
                                }}
                            >
                                신청하기
                            </button>
                        </div>

                        <BottomNav />
                    </>
                )
            )}

            {/* ======================================================== */}
            {/* 5. TAB: points (나의 DR 포인트 상세 페이지 - Page 8) */}
            {activeTab === 'points' && (
                <>
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => changeTab('index')}>
                            <span>‹</span>
                        </button>
                        <h2>나의 DR 포인트</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    <main className="app-content dr-content" style={{ padding: '20px' }}>
                        <div className="card dr-dashboard-card" style={{ background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', color: 'white', border: 'none', padding: '24px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0, 114, 255, 0.25)', marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', opacity: 0.9 }}>통합 보유 포인트</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
                                <span className="number-font" style={{ fontSize: '28px', fontWeight: 900 }}>{currentTotalPoints.toLocaleString()}</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '4px' }}>Point</span>
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
                                누적 적립 {totalEarnedPoints.toLocaleString()} P · 누적 사용 {totalUsedAmount.toLocaleString()} P
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button 
                                onClick={() => setPointFilter('all')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: pointFilter === 'all' ? '#0072FF' : '#E2E8F0', color: pointFilter === 'all' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                전체
                            </button>
                            <button 
                                onClick={() => setPointFilter('earn')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: pointFilter === 'earn' ? '#0072FF' : '#E2E8F0', color: pointFilter === 'earn' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                적립
                            </button>
                            <button 
                                onClick={() => setPointFilter('use')}
                                style={{ border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '11px', fontWeight: 800, backgroundColor: pointFilter === 'use' ? '#0072FF' : '#E2E8F0', color: pointFilter === 'use' ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                            >
                                사용
                            </button>
                        </div>

                        {/* Point logs mapping */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {combinedPointLogs.map((item) => (
                                <div key={item.id} className="card point-tx-item" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <strong style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{item.title}</strong>
                                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.period}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="number-font" style={{ fontSize: '16px', fontWeight: 900, color: item.isEarn ? '#10B981' : '#EF4444' }}>
                                            {item.result}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {combinedPointLogs.length === 0 && (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                    포인트 정산 및 적립/사용 내역이 존재하지 않습니다.
                                </div>
                            )}
                        </div>
                    </main>
                    <BottomNav />
                </>
            )}

            {/* ======================================================== */}
            {/* 6. TAB: shop (기프티콘 포인트 쇼핑 뷰 - Page 9 & 12) */}
            {activeTab === 'shop' && (
                <>
                    <header className="app-header" style={{ borderBottom: 'none', backgroundColor: '#FFFFFF' }}>
                        <button className="back-btn" onClick={() => changeTab('index')}>
                            <span>‹</span>
                        </button>
                        <h2>포인트 쇼핑</h2>
                        <div className="header-placeholder"></div>
                    </header>

                    <main className="app-content dr-content" style={{ padding: '16px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>나의 보유 포인트</span>
                            <strong className="number-font" style={{ fontSize: '15px', color: '#0072FF' }}>{currentTotalPoints.toLocaleString()} P</strong>
                        </div>

                        {/* Shop Main Tabs: Catalog vs My Coupons */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                            <button
                                onClick={() => setShopTab('catalog')}
                                style={{ flex: 1, height: '40px', border: 'none', borderRadius: '10px', backgroundColor: shopTab === 'catalog' ? '#0072FF' : '#F1F5F9', color: shopTab === 'catalog' ? '#FFFFFF' : '#64748B', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                🛒 포인트 기프티콘 몰
                            </button>
                            <button
                                onClick={() => setShopTab('coupons')}
                                style={{ flex: 1, height: '40px', border: 'none', borderRadius: '10px', backgroundColor: shopTab === 'coupons' ? '#0072FF' : '#F1F5F9', color: shopTab === 'coupons' ? '#FFFFFF' : '#64748B', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                🎁 나의 쿠폰함 ({purchasedCoupons.length})
                            </button>
                        </div>

                        {shopTab === 'catalog' ? (
                            <>
                                {/* Category Filter Buttons */}
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                                    {(apiCategories.length > 0 ? apiCategories : [
                                        { categorySeq: 0, categoryName: '전체' },
                                        { categorySeq: 1, categoryName: '상품권/페이' },
                                        { categorySeq: 2, categoryName: '카페/음료' },
                                        { categorySeq: 3, categoryName: '편의점/마트' }
                                    ]).map(cat => (
                                        <button
                                            key={cat.categorySeq}
                                            onClick={() => setShopCategory(cat.categorySeq)}
                                            style={{ border: 'none', borderRadius: '16px', padding: '6px 14px', fontSize: '11px', fontWeight: 800, backgroundColor: shopCategory === cat.categorySeq ? '#1E293B' : '#E2E8F0', color: shopCategory === cat.categorySeq ? '#FFFFFF' : '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            {cat.categoryName}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {(apiGoodsList.length > 0 ? apiGoodsList : mockProducts)
                                        .filter(p => shopCategory === 0 || (p.categorySeq ? p.categorySeq === shopCategory : p.category === (shopCategory === 1 ? 'pay' : shopCategory === 2 ? 'cafe' : 'store')))
                                        .map(product => (
                                            <div 
                                                key={product.goodsSeq || product.id} 
                                                className="card product-card-item" 
                                                onClick={() => setSelectedProduct(product)}
                                                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
                                            >
                                                <div style={{ height: '110px', backgroundColor: '#F8FAFC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    <img src={product.goodsImgSmall || product.image} alt={product.couponName || product.name} style={{ height: '70%', width: 'auto', objectFit: 'contain' }} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>{product.affiliate || product.provider}</span>
                                                    <strong style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B', height: '32px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>{product.couponName || product.name}</strong>
                                                    <span className="number-font" style={{ fontSize: '13px', fontWeight: 900, color: '#0072FF', marginTop: '4px' }}>{(product.appPoint || product.price).toLocaleString()} P</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </>
                        ) : (
                            /* Purchased Coupons Box View */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {purchasedCoupons.map((coupon) => (
                                    <div key={coupon.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '48px', height: '48px', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img src={coupon.image} alt={coupon.productName} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>{coupon.provider}</span>
                                                    <strong style={{ display: 'block', fontSize: '13px', color: '#0F172A', fontWeight: 800 }}>{coupon.productName}</strong>
                                                    <span style={{ fontSize: '11px', color: '#64748B' }}>발급일: {coupon.purchasedAt}</span>
                                                </div>
                                            </div>
                                            <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px' }}>
                                                {coupon.status || '사용가능'}
                                            </span>
                                        </div>

                                        <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>PIN 번호</span>
                                                <strong className="number-font" style={{ fontSize: '15px', letterSpacing: '1px', color: '#0F172A' }}>{coupon.pinCode}</strong>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(coupon.pinCode);
                                                    alert(`PIN 번호(${coupon.pinCode})가 복사되었습니다.`);
                                                }}
                                                style={{ border: '1px solid #0072FF', backgroundColor: '#EFF6FF', color: '#0072FF', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                PIN 복사
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {purchasedCoupons.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎁</div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>구매한 기프티콘이 없습니다</h4>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 20px 0' }}>포인트 몰에서 다양한 상품을 기프티콘으로 교환해보세요!</p>
                                        <button
                                            onClick={() => setShopTab('catalog')}
                                            style={{ height: '40px', padding: '0 20px', border: 'none', borderRadius: '10px', backgroundColor: '#0072FF', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            기프티콘 구경하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </main>
                    <BottomNav />
                </>
            )}

            {/* 💡 쇼핑 상세 교환 확인 팝업 모달 (Page 12) */}
            {selectedProduct && (
                <div className="modal-overlay animated-fade-in" onClick={() => setSelectedProduct(null)} style={{ zIndex: 11000 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '320px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', margin: '0 auto 12px auto', backgroundColor: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={selectedProduct.goodsImgSmall || selectedProduct.image} alt={selectedProduct.couponName || selectedProduct.name} style={{ width: '60%', height: 'auto', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>{selectedProduct.affiliate || selectedProduct.provider}</span>
                        <h4 style={{ margin: '4px 0 12px 0', fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>{selectedProduct.couponName || selectedProduct.name}</h4>
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px', fontSize: '12px', color: '#475569', marginBottom: '20px' }}>
                            <span>차감 포인트 : </span>
                            <strong className="number-font" style={{ color: '#EF4444', fontWeight: 800 }}>{(selectedProduct.appPoint || selectedProduct.price).toLocaleString()} P</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                style={{ flex: 1, height: '42px', border: '1px solid #CBD5E1', borderRadius: '10px', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleProductExchange}
                                style={{ flex: 1.5, height: '42px', border: 'none', borderRadius: '10px', backgroundColor: '#0072FF', color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                교환하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🎉 쇼핑 교환 성공 완료 모달 */}
            {showShopSuccess && (
                <div className="modal-overlay animated-fade-in" style={{ zIndex: 12000 }}>
                    <div className="modal-content" style={{ padding: '28px 24px', maxWidth: '320px', textAlign: 'center' }}>
                        <div style={{ fontSize: '42px', marginBottom: '12px' }}>✔️</div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>교환 신청 완료!</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', lineHeight: 1.5, wordBreak: 'keep-all' }}>
                            기프티콘 PIN 코드가 발급되었습니다.
                        </p>

                        {lastIssuedPin && (
                            <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #0072FF', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '4px' }}>발급된 PIN 번호</span>
                                <strong className="number-font" style={{ fontSize: '16px', letterSpacing: '1px', color: '#0072FF' }}>{lastIssuedPin}</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => {
                                    if (lastIssuedPin) {
                                        navigator.clipboard.writeText(lastIssuedPin);
                                        alert(`PIN 번호(${lastIssuedPin})가 복사되었습니다.`);
                                    }
                                }}
                                style={{ width: '100%', height: '44px', border: '1px solid #0072FF', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#0072FF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                PIN 코드 복사
                            </button>
                            <button 
                                onClick={() => {
                                    setShowShopSuccess(false);
                                    setShopTab('coupons');
                                }}
                                style={{ width: '100%', height: '44px', border: 'none', borderRadius: '10px', backgroundColor: '#3B82F6', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                나의 쿠폰함 확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📊 DR 인사이트 상세 팝업 모달 */}
            {selectedInsightItem && (
                <div className="modal-overlay animated-fade-in" onClick={() => setSelectedInsightItem(null)} style={{ zIndex: 12000 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '340px', textAlign: 'left', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', backgroundColor: selectedInsightItem.result.includes('+') ? '#ECFDF5' : '#FEF2F2', color: selectedInsightItem.result.includes('+') ? '#10B981' : '#EF4444' }}>
                                {selectedInsightItem.result.includes('+') ? '미션 성공' : '미션 실패'}
                            </span>
                            <button onClick={() => setSelectedInsightItem(null)} style={{ border: 'none', background: 'none', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>{selectedInsightItem.dr} 상세 분석</h3>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 16px 0' }}>발령 일시: {selectedInsightItem.period}</p>

                         <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#64748B' }}>획득 포인트</span>
                                <strong className="number-font" style={{ color: selectedInsightItem.result.includes('+') ? '#10B981' : '#EF4444', fontWeight: 900 }}>{selectedInsightItem.result}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#64748B' }}>기준 사용량 (CBL)</span>
                                <strong className="number-font" style={{ color: '#1E293B', fontWeight: 800 }}>2,000 Wh</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#64748B' }}>실제 에너지 사용량</span>
                                <strong className="number-font" style={{ color: '#1E293B', fontWeight: 800 }}>
                                    {selectedInsightItem.result.includes('+') ? `${(2000 - (selectedInsightItem.reductionWh || 0)).toLocaleString()} Wh` : '2,250 Wh'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                                <span style={{ color: '#0F172A', fontWeight: 800 }}>절감 에너지량</span>
                                <strong className="number-font" style={{ color: selectedInsightItem.result.includes('+') ? '#0072FF' : '#EF4444', fontWeight: 900 }}>
                                    {selectedInsightItem.result.includes('+') ? `-${(selectedInsightItem.reductionWh || 0)} Wh (달성률 ${Math.round(((selectedInsightItem.reductionWh || 0) / 200) * 100)}%)` : '+250 Wh (초과)'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#64748B' }}>탄소 감축 효과</span>
                                <strong className="number-font" style={{ color: '#10B981', fontWeight: 800 }}>
                                    {selectedInsightItem.result.includes('+') ? `${((selectedInsightItem.reductionWh || 0) * 0.000424).toFixed(2)} kgCO2` : '0.00 kgCO2'}
                                </strong>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedInsightItem(null)}
                            style={{ width: '100%', height: '46px', border: 'none', borderRadius: '12px', backgroundColor: '#0072FF', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* 💡 동의서 자세히 보기 팝업 모달 */}
            {showAgreementDetail && (
                <div className="modal-overlay animated-fade-in" onClick={() => setShowAgreementDetail(false)} style={{ zIndex: 11000 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '380px', maxHeight: '80vh', overflowY: 'auto', padding: '24px' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>광명/국민/경남 DR 참여 신청 동의서</h3>
                            <button onClick={() => setShowAgreementDetail(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong>[수요관리사업 참여를 위한 개인정보 제공 동의서]</strong>
                            <p style={{ margin: 0 }}>본인은 개인정보의 수집 및 위탁 제공에 동의합니다.</p>
                            <p style={{ margin: 0 }}>1. 정보 제공받는 자: 전력거래소, 해당 지자체, 운영사 (주)에너넷</p>
                            <p style={{ margin: 0 }}>2. 정보 이용 목적: 전력량 모니터링, 절전 실천 검증 및 성공 포인트 적립 정산</p>
                            <p style={{ margin: 0 }}>3. 정보 보유 및 이용 기간: 가입일로부터 3년 혹은 탈퇴 시 즉시 파기</p>
                        </div>
                        <button 
                            onClick={() => setShowAgreementDetail(false)}
                            style={{ width: '100%', height: '44px', border: 'none', borderRadius: '12px', backgroundColor: '#00A8FF', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', marginTop: '20px' }}
                        >
                            동의서 내용 확인 완료
                        </button>
                    </div>
                </div>
            )}

            {/* 💡 가이드북 모달 */}
            {showGuide && (
                <div className="modal-overlay animated-fade-in" onClick={() => setShowGuide(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DR 참여 방법 안내</h3>
                            <button className="close-modal-btn" onClick={() => setShowGuide(false)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <img 
                                src="/image/dr_guide_method.png" 
                                alt="DR 참여 방법 가이드" 
                                style={{ width: '100%', borderRadius: '16px', objectFit: 'contain' }} 
                            />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0, marginTop: '8px' }}>
                                * 발령 시간 동안 사용하지 않는 대기전력을 차단하고 전등을 꺼주시면 미션 성공 확률이 올라갑니다.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-action-btn primary" onClick={() => setShowGuide(false)}>확인했습니다</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🎉 축하 팝업 모달 */}
            {showSuccessPopup && (
                <div className="modal-overlay animated-fade-in" style={{ zIndex: 12000 }}>
                    <div className="modal-content" style={{ textAlign: 'center', padding: '32px 24px', maxWidth: '320px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <img src="/image/char_05.png" alt="Celebrating" style={{ width: '110px', height: '110px', objectFit: 'contain' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0' }}>
                            축하드려요!
                        </h3>
                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0', wordBreak: 'keep-all' }}>
                            수요반응 신청이 완료되었습니다.
                        </p>
                        <button 
                            onClick={closeSuccessPopup}
                            style={{ width: '100%', height: '48px', border: 'none', borderRadius: '12px', backgroundColor: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DrHistoryPage;
