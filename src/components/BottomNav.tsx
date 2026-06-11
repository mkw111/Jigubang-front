import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../pages/HomePage.css';

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
        <nav className="quick-menu">
            {menuItems.map((item) => (
                <div 
                    key={item.path} 
                    className="menu-item" 
                    onClick={() => navigate(item.path)}
                    style={{ opacity: location.pathname === item.path ? 1 : 0.5 }}
                >
                    <div className="menu-icon">{item.icon}</div>
                    <span style={{ color: location.pathname === item.path ? '#1A1C1E' : '#8E9196' }}>
                        {item.name}
                    </span>
                </div>
            ))}
        </nav>
    );
};

export default BottomNav;
