import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css'; // Reuse landing page base styles

const LoginPage: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post('/api/users/login', { phoneNumber, password });
            
            // 응답 데이터에 유저 정보(최소한 name)가 있는지 확인
            if (res.data && res.data.name) {
                localStorage.setItem('user', JSON.stringify(res.data));
                navigate('/mypage');
            } else {
                console.error("Invalid login response:", res.data);
                alert('로그인 정보가 올바르지 않거나 데이터가 없습니다.');
            }
        } catch (e: any) {
            console.error("Login failed:", e.response?.data || e.message);
            const errorMsg = e.response?.data?.message || '로그인 서버와 통신할 수 없습니다.';
            alert(`로그인 실패: ${errorMsg}`);
        }
    };

    return (
        <div className="landing-container">
            <header className="header" style={{width: '100%', textAlign: 'center'}}>
                <h2 className="main-title">로그인</h2>
            </header>
            <div className="button-group" style={{marginTop: '50px'}}>
                <div style={{marginBottom: '20px'}}>
                    <input 
                        type="text" 
                        placeholder="전화번호" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)}
                        style={{width: '100%', height: '50px', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px', marginBottom: '10px'}}
                    />
                    <input 
                        type="password" 
                        placeholder="비밀번호" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        style={{width: '100%', height: '50px', borderRadius: '12px', border: '1px solid #ddd', padding: '0 15px'}}
                    />
                </div>
                <button className="btn login-btn" onClick={handleLogin}>로그인</button>
                <button className="btn join-btn" onClick={() => navigate(-1)} style={{backgroundColor: '#ccc'}}>취소</button>
            </div>
            <footer className="footer">
                © ENERNET Inc.
            </footer>
        </div>
    );
};
export default LoginPage;
