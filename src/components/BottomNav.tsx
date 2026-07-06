import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: '홈', iconA: '/images/nav_home_active.png', iconB: '/images/nav_home_inactive.png', path: '/home' },
        { name: '인사이트', iconA: '/images/nav_insight_active.png', iconB: '/images/nav_insight_inactive.png', path: '/energy-detail' },
        { name: '수요반응', iconA: '/images/nav_dr_active.png', iconB: '/images/nav_dr_inactive.png', path: '/dr-history' },
        { name: '에너지 랭킹', iconA: '/images/nav_ranking_active.png', iconB: '/images/nav_ranking_inactive.png', path: '/ranking' },
        { name: '환경설정', iconA: '/images/nav_setting_active.png', iconB: '/images/nav_setting_inactive.png', path: '/mypage' }
    ];

    return (
        <nav className="bottom-nav">
            {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <div 
                        key={item.path} 
                        className="nav-item" 
                        onClick={() => navigate(item.path)}
                    >
                        <div 
                            className="nav-icon" 
                            style={{ 
                                filter: isActive ? 'drop-shadow(0 2px 8px rgba(0, 168, 255, 0.3))' : 'none',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '24px'
                            }}
                        >
                            <img 
                                src={isActive ? item.iconA : item.iconB} 
                                alt={item.name} 
                                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                            />
                        </div>
                        <span 
                            className="nav-label" 
                            style={{ 
                                color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                                fontWeight: isActive ? '700' : '500',
                                marginTop: '4px'
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
