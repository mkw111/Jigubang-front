import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './HomePage.css';
import './MyPage.css';

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>({});
    const [pushEnabled, setPushEnabled] = useState(true);
    const [fcmToken, setFcmToken] = useState('');
    
    // Drawers states
    const [noticeOpen, setNoticeOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
    const [ourHouseDrawerOpen, setOurHouseDrawerOpen] = useState(false);
    const [alarmSettingsOpen, setAlarmSettingsOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [activeTerm, setActiveTerm] = useState<string | null>(null);

    // Member management states
    const [activeTab, setActiveTab] = useState<'approved' | 'waiting'>('approved');
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Alarm states
    const [alarms, setAlarms] = useState({
        all: true,
        drReduce: true,
        drState: true,
        permission: true,
        noticeInfo: true,
        community: true,
        powerUsage: true
    });
    
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
            fetchMembers(parsedUser.hoSeq);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchMembers = async (hoSeqToUse?: number) => {
        const seq = hoSeqToUse || user.hoSeq;
        if (!seq) return;
        setLoadingMembers(true);
        try {
            const response = await fetch(`/api/households/members?hoSeq=${seq}`);
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (e) {
            console.error("Failed to fetch household members", e);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleApproveMember = async (member: any) => {
        const confirmText = `${member.name}\n${maskPhone(member.phoneNumber, false)}\n구성원 요청 : 2026-06-09 11:59\n\n상기 회원을 세대 구성원으로 승인합니다.\n\n대기 구성원을 추가 하시겠어요?\n(세대 구성원을 승인 하더라도 언제든 세대 구성원 승인을 취소할 수 있습니다.)`;
        if (!window.confirm(confirmText)) return;
        
        try {
            const response = await fetch('/api/households/member/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberUuid: member.uuid })
            });
            if (response.ok) {
                alert('새로운 세대 구성원으로 추가 되었습니다. 감사합니다.');
                fetchMembers();
            } else {
                alert('승인 처리 실패');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    const handleRejectMember = async (member: any) => {
        const isApproved = member.approvedYn === 'Y';
        const confirmText = isApproved 
            ? `${member.name}\n${maskPhone(member.phoneNumber, false)}\n\n상기 회원의 세대 구성원 승인을 취소합니다.\n\n세대 구성원을 내보내시겠어요?\n(승인이 취소된 지구방 회원은 언제든 세대 구성원 재가입 신청이 가능합니다.)`
            : `${member.name}\n${maskPhone(member.phoneNumber, false)}\n\n대기 구성원을 목록에서 제거하시겠어요?`;
            
        if (!window.confirm(confirmText)) return;
        
        try {
            const response = await fetch('/api/households/member/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberUuid: member.uuid })
            });
            if (response.ok) {
                if (isApproved) {
                    alert('세대 구성원 내보내기가 성공 하였습니다. 감사합니다.');
                } else {
                    alert('대기 구성원을 제거했습니다.');
                }
                fetchMembers();
            } else {
                alert('처리 실패');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    const handleAssignHeader = async (member: any) => {
        const confirmText = `${member.name}\n${maskPhone(member.phoneNumber, false)}\n\n상기 회원에게 세대 대표권한을 위임합니다.\n\n구성원을 세대 대표로 설정 하시겠어요?\n※세대 구성원 관리는 세대 대표만 가능합니다.\n언제든 세대 대표가 다른 세대 구성원에게 세대 대표 권한을 위임할 수 있습니다.`;
        if (!window.confirm(confirmText)) return;

        try {
            const response = await fetch('/api/households/header/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hoSeq: user.hoSeq, newHeaderUuid: member.uuid })
            });
            if (response.ok) {
                alert('새로운 세대 대표가 설정 되었습니다. 감사합니다.');
                // Update role locally
                const updatedUser = { ...user, householdsType: 'MEMBER' };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                fetchMembers();
            } else {
                alert('대표 변경 처리 실패');
            }
        } catch (err: any) {
            alert('서버 통신 오류: ' + err.message);
        }
    };

    const handleRejectAllWaiters = async () => {
        const waiters = members.filter(m => m.approvedYn === 'N');
        if (waiters.length === 0) {
            alert('목록에 대기 구성원이 없습니다.');
            return;
        }

        const confirmText = `대기 구성원을 목록에서 제거하시겠어요?\n\n대기 구성원을 목록에서 제거 하더라도 지구방 회원은 세대 구성원을 재신청할 수 있습니다.`;
        if (!window.confirm(confirmText)) return;

        try {
            setLoadingMembers(true);
            await Promise.all(waiters.map(w => 
                fetch('/api/households/member/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberUuid: w.uuid })
                })
            ));
            alert('대기 구성원 목록을 모두 제거하였습니다. 감사합니다.');
            fetchMembers();
        } catch (e: any) {
            alert('처리 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setLoadingMembers(false);
        }
    };

    const toggleAllAlarms = (checked: boolean) => {
        setAlarms({
            all: checked,
            drReduce: checked,
            drState: checked,
            permission: checked,
            noticeInfo: checked,
            community: checked,
            powerUsage: checked
        });
    };

    const toggleAlarm = (key: keyof typeof alarms, checked: boolean) => {
        const newAlarms = { ...alarms, [key]: checked };
        // If any is unchecked, "all" is false. If all are checked, "all" is true.
        const allChecked = newAlarms.drReduce && newAlarms.drState && newAlarms.permission && newAlarms.noticeInfo && newAlarms.community && newAlarms.powerUsage;
        newAlarms.all = allChecked;
        setAlarms(newAlarms);
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data && data.type === 'SET_FCM_TOKEN') {
                    localStorage.setItem('fcmToken', data.token);
                    setFcmToken(data.token);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        document.addEventListener('message', handleMessage as any);

        const storedToken = localStorage.getItem('fcmToken');
        if (storedToken) {
            setFcmToken(storedToken);
        }

        // Proactively request latest token from React Native shell
        const win = window as any;
        if (win.ReactNativeWebView) {
            win.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_FCM_TOKEN' }));
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            document.removeEventListener('message', handleMessage as any);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const maskName = (name: string, isSelf: boolean) => {
        if (isSelf) return `${name} (나)`;
        if (!name) return '';
        if (name.length <= 1) return name;
        if (name.length === 2) {
            return name[0] + '★';
        }
        return name[0] + '★' + name.slice(2);
    };

    const maskPhone = (phone: string, isSelf: boolean) => {
        if (isSelf) return phone;
        if (!phone) return '';
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length >= 10) {
            const last4 = clean.slice(-4);
            return `010-****-${last4}`;
        }
        return phone;
    };

    // Filter members
    const approvedMembers = members.filter(m => m.approvedYn === 'Y');
    const waitingMembers = members.filter(m => m.approvedYn === 'N');

    const isHeader = user.householdsType === 'HEADER';

    // FAQ items
    const faqData = [
        { q: 'Q. 실거주 인증은 왜 필요한가요?', a: '지구방 서비스는 아파트 관리비 데이터와 연계되어 전력 사용량을 실시간으로 확인하는 맞춤형 서비스입니다. 따라서 입주자 확인 및 개인정보보호를 위해 실거주 인증이 필수적으로 진행됩니다.' },
        { q: 'Q. 에너지 포인트는 어떻게 적립하나요?', a: '정부/지자체 또는 지구방에서 발령하는 수요반응(DR) 미션 시간에 절전을 성공적으로 수행하시면, 감축량에 비례하여 포인트가 적립됩니다.' },
        { q: 'Q. 비밀번호를 변경하고 싶어요.', a: '환경설정 메뉴의 "내 프로필 관리" 또는 로그인 화면의 "비밀번호 찾기"를 통해 언제든 새로운 비밀번호로 재설정하실 수 있습니다.' }
    ];

    // Notice items
    const notices = [
        { title: '지구방 앱 v1.0 정식 서비스 런칭 안내', date: '2026.06.20' },
        { title: '6월 호국보훈의 달 국민쉼표 집중 발령 혜택 안내', date: '2026.06.15' },
        { title: '개인정보처리방침 일부 변경 사전 고지', date: '2026.06.01' }
    ];

    const termsContent: { [key: string]: string } = {
        'service': `제1 장 총칙

제1 조 (목적)
이 약관은 ㈜에너넷(이하 ‘회사’)에서 제공하는 지구방 앱 서비스 및 제반 서비스(이하 ‘서비스’)를 이용하는 이용자(이하 ‘회원’)의 권리와 의무 및 책임사항, 기타 필요한 사항을 규정하는 것을 목적으로 합니다.

제2 조 (약관의 게시, 효력 및 변경)
① 본 약관은 서비스의 가입 과정 및 서비스 화면에 게시하여 회원에게 공시하고, 회원이 이 약관에 동의함으로써 효력이 발생합니다.
② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.`,
        'privacy': `개인정보 처리방침

1. 개인정보의 처리 목적
회사는 회원가입, 원활한 고객상담, 서비스 제공 등을 위해 최소한의 개인정보를 수집하고 있습니다.

2. 수집하는 개인정보 항목
- 필수항목: 이름, 전화번호, 아파트 동/호수
- 선택항목: 푸시 수신여부`,
        'thirdparty': `개인정보 제3자 제공 동의

1. 제공받는 자: 해당 아파트 관리사무소, 지자체 전력 관리 부서
2. 제공 목적: 실거주민 인증 확인 및 전력 감축 챌린지 포인트 연계 정산
3. 제공 항목: 이름, 전화번호, 동/호수 정보, DR 참여 결과
4. 보유 및 이용기간: 목적 달성 후 즉시 파기`,
        'point': `포인트 사용 및 개인정보 처리방침

1. 포인트 적립 및 사용을 위해 수집된 데이터는 포인트 적립 목적 이외의 용도로 사용되지 않습니다.
2. 회원의 탈퇴 시 적립된 포인트 정보는 세대 정보의 유지를 위해 상속되거나 자동 소멸될 수 있습니다.`
    };

    return (
        <div className="page-container mypage-wrapper">
            {/* Header */}
            <header className="app-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>‹</span>
                </button>
                <h2>환경설정</h2>
                <div className="header-placeholder"></div>
            </header>

            {/* Content */}
            <main className="app-content mypage-content">
                {/* Title Section */}
                <div className="mypage-title-section">
                    지구방을 <strong>{user.name || '김화경'}님</strong>께<br />맞게 설정해 볼까요?
                </div>

                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', marginBottom: '-8px', display: 'block' }}>지구방 환경 설정</span>

                {/* Side-by-side cards row */}
                <div className="mypage-cards-row">
                    {/* Left Card: 우리집 정보 */}
                    <div className="mypage-half-card" onClick={() => setOurHouseDrawerOpen(true)}>
                        <div>
                            <span className="card-title-lbl">우리집 정보</span>
                            <div className="card-subtitle-lbl">아파트 단지 정보<br />및 실거주 인증</div>
                        </div>
                        <div className="card-details-lbl">
                            {user.aptName ? `${user.aptName} ${user.dong}동` : '숲속마을 벨라시온 701동'}
                        </div>
                    </div>

                    {/* Right Card: 나의 프로필 */}
                    <div className="mypage-half-card" onClick={() => {
                        setMemberDrawerOpen(true);
                        fetchMembers();
                    }}>
                        <div>
                            <span className="card-title-lbl">나의 프로필</span>
                            <div className="card-subtitle-lbl">개인정보 및<br />세대원 가입 현황</div>
                        </div>
                        <div className="card-details-lbl">
                            {user.name || '김화경'}님
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="setting-menu-list">
                    <div className="menu-item" onClick={() => setNoticeOpen(true)}>
                        <span className="menu-text">📢 공지사항</span>
                        <span className="menu-arrow">›</span>
                    </div>
                    <div className="menu-item" onClick={() => setFaqOpen(true)}>
                        <span className="menu-text">❓ 자주하는 질문 (FAQ)</span>
                        <span className="menu-arrow">›</span>
                    </div>
                    <div className="menu-item" onClick={() => setAlarmSettingsOpen(true)}>
                        <span className="menu-text">🔔 알림 설정</span>
                        <span className="menu-arrow">›</span>
                    </div>
                    <div className="menu-item" onClick={() => setTermsOpen(true)}>
                        <span className="menu-text">📄 이용 약관 및 정책</span>
                        <span className="menu-arrow">›</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reset-password')}>
                        <span className="menu-text">🔐 비밀번호 재설정</span>
                        <span className="menu-arrow">›</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/join/apt?mode=change')}>
                        <span className="menu-text">🏠 아파트 주소 변경 (이사)</span>
                        <span className="menu-arrow">›</span>
                    </div>
                </div>

                {/* FCM Push Test Card */}
                <div className="card mypage-card" style={{ marginTop: '10px', background: 'var(--color-bg-light-blue)', border: '1px solid rgba(0, 168, 255, 0.1)' }}>
                    <div className="card-top-row">
                        <span className="card-lbl" style={{ color: 'var(--color-primary-dark)' }}>FCM Push Test</span>
                        <span className="auth-status-badge" style={{ backgroundColor: fcmToken ? 'var(--color-success)' : 'var(--color-text-light)', color: 'white' }}>
                            {fcmToken ? '연결됨' : '대기중'}
                        </span>
                    </div>
                    
                    <div style={{ margin: '12px 0 8px 0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-dark)', display: 'block', marginBottom: '6px' }}>
                            내 디바이스 FCM 토큰 정보:
                        </span>
                        <div style={{ 
                            padding: '10px', 
                            background: '#f1f3f5', 
                            borderRadius: '8px', 
                            border: '1px solid #dee2e6',
                            fontSize: '11px', 
                            color: '#495057', 
                            fontFamily: 'monospace', 
                            wordBreak: 'break-all', 
                            userSelect: 'all',
                            lineHeight: 1.4
                        }}>
                            {fcmToken || '토큰 수신 대기 중... (앱 실행 및 페이지 재진입 필요)'}
                        </div>
                    </div>

                    <button 
                        className="btn login-btn" 
                        disabled={!fcmToken}
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/push/test', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        token: fcmToken,
                                        title: '지구방 테스트 푸시',
                                        message: '김화경님, 지구방 전력 차단 미션이 발령되었습니다!'
                                    })
                                });
                                const result = await response.json();
                                if (result.success) {
                                    alert('테스트 푸시가 성공적으로 발송되었습니다!');
                                } else {
                                    alert('푸시 발송 실패: ' + result.error);
                                }
                            } catch (error: any) {
                                alert('푸시 발송 서버 통신 오류: ' + error.message);
                            }
                        }}
                        style={{ height: '42px', fontSize: '13px', margin: '8px 0 0 0', opacity: fcmToken ? 1 : 0.6 }}
                    >
                        테스트 푸시 발송
                    </button>
                </div>

                {/* Version Information */}
                <div className="version-info-box">
                    <p className="version-status">지구방 최신 버전을 사용 중 입니다.</p>
                    <p className="version-number number-font">Version 1.2.0</p>
                </div>

                {/* Logout Button */}
                <button className="logout-action-btn" onClick={handleLogout}>
                    로그아웃
                </button>
            </main>

            <BottomNav />

            {/* --- SLIDE DRAWERS --- */}
            
            {/* Our House Info Drawer */}
            <div className={`slide-drawer ${ourHouseDrawerOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => setOurHouseDrawerOpen(false)}>
                        <span>‹</span>
                    </button>
                    <h2>우리집 정보</h2>
                    <div className="header-placeholder"></div>
                </header>
                <div className="app-content drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-text-muted)' }}>인증된 우리집 주소</span>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
                            {user.aptName || '숲속마을 벨라시온 아파트'}<br />
                            {user.dong ? `${user.dong}동 ${user.ho}호` : '701동 1001호'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-body)', marginTop: '4px' }}>
                            지번주소 : 경기도 고양시 일산동구 숲속마을1로 116
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-bg-main)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-body)' }}>관리사무소 연락처</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-primary-dark)' }}>031-4760-1112</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-body)' }}>우리아파트 검침일</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-text-dark)' }}>매월 18일</span>
                        </div>
                    </div>

                    <button 
                        className="btn login-btn" 
                        onClick={() => window.open('tel:031-4760-1112')}
                        style={{ height: '50px', fontSize: '14px', marginTop: 'auto' }}
                    >
                        📞 관리사무소 통화하기
                    </button>
                </div>
            </div>

            {/* Notice Drawer */}
            <div className={`slide-drawer ${noticeOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => setNoticeOpen(false)}>
                        <span>‹</span>
                    </button>
                    <h2>공지사항</h2>
                    <div className="header-placeholder"></div>
                </header>
                <div className="app-content drawer-content">
                    <div className="drawer-list">
                        {notices.map((item, index) => (
                            <div key={index} className="drawer-item">
                                <div className="drawer-item-title">{item.title}</div>
                                <div className="drawer-item-date">{item.date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Drawer */}
            <div className={`slide-drawer ${faqOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => setFaqOpen(false)}>
                        <span>‹</span>
                    </button>
                    <h2>자주하는 질문 (FAQ)</h2>
                    <div className="header-placeholder"></div>
                </header>
                <div className="app-content drawer-content">
                    <div className="drawer-accordion">
                        {faqData.map((item, index) => (
                            <div key={index} className="faq-item">
                                <div className="faq-question">{item.q}</div>
                                <div className="faq-answer">{item.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alarm Settings Drawer */}
            <div className={`slide-drawer ${alarmSettingsOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => setAlarmSettingsOpen(false)}>
                        <span>‹</span>
                    </button>
                    <h2>알림 설정</h2>
                    <div className="header-placeholder"></div>
                </header>
                <div className="app-content drawer-content" style={{ padding: '16px' }}>
                    <div className="setting-menu-list" style={{ borderRadius: '16px' }}>
                        {/* All Alarms Toggle */}
                        <div className="menu-item no-click" style={{ borderBottom: '2px solid var(--color-bg-main)' }}>
                            <div>
                                <span className="menu-text" style={{ fontSize: '15px' }}>🔔 전체 알림 수신 설정</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.all} 
                                    onChange={e => toggleAllAlarms(e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* DR 감축 발령 */}
                        <div className="menu-item no-click" style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">DR 감축 발령 알림</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>DR 발령 예보 및 시행 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.drReduce} 
                                    onChange={e => toggleAlarm('drReduce', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* DR 상태 변화 */}
                        <div className="menu-item no-click">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">DR 상태 변화 알림</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>신청 승인, 감축 성공 및 포인트 지급 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.drState} 
                                    onChange={e => toggleAlarm('drState', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* 권한 알림 */}
                        <div className="menu-item no-click">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">권한 알림</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>관리사무소 실거주 인증 및 구성원 승인 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.permission} 
                                    onChange={e => toggleAlarm('permission', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* 공지/정보 알림 */}
                        <div className="menu-item no-click">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">공지/정보 알림</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>지구방 공지사항, 정보 및 이벤트 등의 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.noticeInfo} 
                                    onChange={e => toggleAlarm('noticeInfo', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* 커뮤니티 알림 */}
                        <div className="menu-item no-click">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">커뮤니티 알림</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>인앱 커뮤니티와 관련한 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.community} 
                                    onChange={e => toggleAlarm('community', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* 전력 사용량 알림 */}
                        <div className="menu-item no-click">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                <span className="menu-text">전력 사용량 알림 전체</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>월간 사용량 및 누진 도달 안내 등의 알림</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={alarms.powerUsage} 
                                    onChange={e => toggleAlarm('powerUsage', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms Drawer */}
            <div className={`slide-drawer ${termsOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => {
                        if (activeTerm) {
                            setActiveTerm(null);
                        } else {
                            setTermsOpen(false);
                        }
                    }}>
                        <span>‹</span>
                    </button>
                    <h2>{activeTerm ? "이용 약관 상세" : "이용 약관"}</h2>
                    <div className="header-placeholder"></div>
                </header>
                <div className="app-content drawer-content">
                    {activeTerm ? (
                        <div className="card" style={{ padding: '20px', whiteSpace: 'pre-line', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-body)' }}>
                            {termsContent[activeTerm]}
                        </div>
                    ) : (
                        <div className="setting-menu-list">
                            <div className="menu-item" onClick={() => setActiveTerm('service')}>
                                <span className="menu-text">📄 서비스 이용약관 (필수)</span>
                                <span className="menu-arrow">›</span>
                            </div>
                            <div className="menu-item" onClick={() => setActiveTerm('privacy')}>
                                <span className="menu-text">📄 개인정보 처리방침 (필수)</span>
                                <span className="menu-arrow">›</span>
                            </div>
                            <div className="menu-item" onClick={() => setActiveTerm('thirdparty')}>
                                <span className="menu-text">📄 개인정보 제3자 제공동의 (필수)</span>
                                <span className="menu-arrow">›</span>
                            </div>
                            <div className="menu-item" onClick={() => setActiveTerm('point')}>
                                <span className="menu-text">📄 포인트 사용 및 개인정보 처리방침 (필수)</span>
                                <span className="menu-arrow">›</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Management (Household Member List) Drawer */}
            <div className={`slide-drawer ${memberDrawerOpen ? 'open' : ''}`}>
                <header className="app-header">
                    <button className="back-btn" onClick={() => setMemberDrawerOpen(false)}>
                        <span>‹</span>
                    </button>
                    <h2>세대 구성원 관리</h2>
                    <div className="header-placeholder"></div>
                </header>
                
                <div className="app-content drawer-content">
                    {/* Tabs */}
                    <div className="members-tabs">
                        <button 
                            className={`members-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('approved')}
                        >
                            승인된 구성원 ({approvedMembers.length})
                        </button>
                        <button 
                            className={`members-tab-btn ${activeTab === 'waiting' ? 'active' : ''}`}
                            onClick={() => setActiveTab('waiting')}
                        >
                            대기 구성원 ({waitingMembers.length})
                        </button>
                    </div>

                    <div className="card" style={{ marginBottom: '16px', background: 'var(--color-bg-light-blue)', border: '1px solid rgba(0, 168, 255, 0.1)', padding: '12px' }}>
                        <div className="info-alert-text" style={{ fontSize: '11px', color: 'var(--color-primary-dark)', lineHeight: 1.4 }}>
                            {activeTab === 'approved' 
                                ? "📢 세대대표가 승인한 세대 구성원 목록입니다. 세대대표는 구성원을 내보내거나 대표권한을 위임할 수 있습니다."
                                : "📢 세대대표 미승인 상태의 세대 구성원 가입 대기 목록입니다. 확인 후 가입 승인 또는 취소를 처리해주세요."
                            }
                        </div>
                    </div>

                    <div className="drawer-list">
                        {loadingMembers ? (
                            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>목록을 불러오는 중...</span>
                        ) : activeTab === 'approved' ? (
                            approvedMembers.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                    등록된 세대원이 없습니다.
                                </div>
                            ) : (
                                approvedMembers.map((member: any) => {
                                    const isSelf = member.uuid === user.uuid;
                                    return (
                                        <div key={member.uuid} className="member-list-card">
                                            <div className="member-item-row">
                                                <div className="member-info-col">
                                                    <div className="member-name-tag">
                                                        <span className="member-name-txt">{maskName(member.name, isSelf)}</span>
                                                        <span className="member-relation-tag">
                                                            {member.householdsType === 'HEADER' ? '세대대표' : '세대원'}
                                                        </span>
                                                    </div>
                                                    <span className="member-phone-txt">{maskPhone(member.phoneNumber, isSelf)}</span>
                                                </div>
                                                <span className="member-req-date">가입회원</span>
                                            </div>
                                            
                                            {/* Show action buttons only to representative and for other members */}
                                            {isHeader && !isSelf && (
                                                <div className="member-actions-row">
                                                    <button 
                                                        className="member-action-btn danger" 
                                                        onClick={() => handleRejectMember(member)}
                                                    >
                                                        내보내기
                                                    </button>
                                                    <button 
                                                        className="member-action-btn primary" 
                                                        onClick={() => handleAssignHeader(member)}
                                                    >
                                                        대표 설정
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            <>
                                {waitingMembers.length === 0 ? (
                                    <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                        전입 신청 대기자가 없습니다.
                                    </div>
                                ) : (
                                    waitingMembers.map((member: any) => (
                                        <div key={member.uuid} className="member-list-card">
                                            <div className="member-item-row">
                                                <div className="member-info-col">
                                                    <div className="member-name-tag">
                                                        <span className="member-name-txt">{maskName(member.name, false)}</span>
                                                        <span className="member-relation-tag" style={{ backgroundColor: '#FFF6E0', color: '#E6A23C' }}>대기중</span>
                                                    </div>
                                                    <span className="member-phone-txt">{maskPhone(member.phoneNumber, false)}</span>
                                                </div>
                                                <span className="member-req-date">요청됨</span>
                                            </div>
                                            
                                            {isHeader && (
                                                <div className="member-actions-row">
                                                    <button 
                                                        className="member-action-btn primary" 
                                                        onClick={() => handleApproveMember(member)}
                                                    >
                                                        구성원 승인
                                                    </button>
                                                    <button 
                                                        className="member-action-btn danger" 
                                                        onClick={() => handleRejectMember(member)}
                                                    >
                                                        거절
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                
                                {isHeader && waitingMembers.length > 0 && (
                                    <button 
                                        className="bulk-action-btn"
                                        onClick={handleRejectAllWaiters}
                                    >
                                        모든 대기 구성원을 목록에서 제거하기
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
