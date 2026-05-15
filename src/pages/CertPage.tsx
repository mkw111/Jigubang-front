import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CertPage.css";

const CertPage: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    return (
        <div className="page-container">
            <header className="header"><button className="back-btn" onClick={() => navigate(-1)}>&lt;</button><h2>본인 인증</h2></header>
            <div className="content">
                <div className="input-group">
                    <label>이름</label>
                    <input type="text" placeholder="이름 입력" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="input-group">
                    <label>휴대폰 번호</label>
                    <div className="with-btn">
                        <input type="text" placeholder="01012345678" value={phone} onChange={e => setPhone(e.target.value)} />
                        <button>인증요청</button>
                    </div>
                </div>
            </div>
            <button className="next-btn" onClick={() => navigate('/join/password')}>다음</button>
        </div>
    );
};
export default CertPage;
