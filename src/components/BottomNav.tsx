import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { 
            name: '홈', 
            activeIcon: '/image/nav_home_active.png', 
            inactiveIcon: '/image/nav_home_inactive.png', 
            path: '/home' 
        },
        { 
            name: '인사이트', 
            activeIcon: '/image/nav_insight_active.png', 
            inactiveIcon: '/image/nav_insight_inactive.png', 
            path: '/energy-detail' 
        },
        { 
            name: '수요반응', 
            activeIcon: '/image/nav_dr_active.png', 
            inactiveIcon: '/image/nav_dr_inactive.png', 
            path: '/dr-history' 
        },
        { 
            name: '에너지 랭킹', 
            activeIcon: '/image/nav_ranking_active.png', 
            inactiveIcon: '/image/nav_ranking_inactive.png', 
            path: '/ranking' 
        },
        { 
            name: '환경설정', 
            activeIcon: '/image/nav_setting_active.png', 
            inactiveIcon: '/image/nav_setting_inactive.png', 
            path: '/mypage' 
        }
    ];

    return (
        <nav className="bottom-nav" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '72px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F0F0F0',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <div 
                        key={item.path} 
                        className="nav-item" 
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            flex: 1,
                            gap: '4px'
                        }}
                    >
                        <img 
                            src={isActive ? item.activeIcon : item.inactiveIcon} 
                            alt={item.name}
                            style={{ 
                                width: '26px', 
                                height: '26px',
                                objectFit: 'contain',
                                transition: 'all 0.2s',
                                transform: isActive ? 'scale(1.08)' : 'scale(1)'
                            }}
                        />
                        <span 
                            className="nav-label" 
                            style={{ 
                                color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '10px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.name}
                        </span>
                    </div>
                );
            })}
        </nav>
    );
};

export default BottomNav;
