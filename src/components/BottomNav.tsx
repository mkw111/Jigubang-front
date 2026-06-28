import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: '홈', icon: '🏠', path: '/home' },
        { name: '인사이트', icon: '📊', path: '/energy-detail' },
        { name: '수요반응', icon: '🎯', path: '/dr-history' },
        { name: '에너지 랭킹', icon: '🏆', path: '/ranking' },
        { name: '환경설정', icon: '⚙️', path: '/mypage' }
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
                                color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
                                filter: isActive ? 'drop-shadow(0 2px 8px rgba(0, 168, 255, 0.4))' : 'none',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.icon}
                        </div>
                        <span 
                            className="nav-label" 
                            style={{ 
                                color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                                fontWeight: isActive ? '700' : '500'
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
