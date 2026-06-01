import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="landing-container">
            <header className="header" style={{width: '100%', textAlign: 'center'}}>
                <h2 className="main-title">내 정보</h2>
            </header>
            <div className="button-group" style={{marginTop: '30px', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
                <div style={{marginBottom: '30px', textAlign: 'left'}}>
                    <p style={{fontSize: '18px', margin: '10px 0'}}><strong>이름:</strong> {user.name}</p>
                    <p style={{fontSize: '18px', margin: '10px 0'}}><strong>권한:</strong> {user.householdsType}</p>
                </div>
                
                <div className="btn login-btn" 
                     onClick={() => navigate('/join/apt?mode=change')}
                     style={{display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '15px'}}>
                    아파트 정보 변경 (이사)
                </div>

                <div className="btn join-btn" 
                     onClick={() => {
                        localStorage.removeItem('user');
                        navigate('/');
                     }}
                     style={{display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#FF5252'}}>
                    로그아웃
                </div>
            </div>
            <footer className="footer">
                © ENERNET Inc.
            </footer>
        </div>
    );
};
export default MyPage;
