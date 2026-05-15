import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");

    return (
        <div className="page-container">
            <header className="header"><button className="back-btn" onClick={() => navigate(-1)}>&lt;</button><h2>비밀번호 설정</h2></header>
            <div className="content">
                <div className="input-group">
                    <label>비밀번호</label>
                    <input type="password" placeholder="비밀번호 입력" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </div>
            <button className="next-btn" onClick={() => alert('가입 완료!')}>가입 완료</button>
        </div>
    );
};
export default PasswordPage;
