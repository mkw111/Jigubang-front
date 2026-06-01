import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HeaderCheckPage.css";

const HeaderCheckPage: React.FC = () => {


    const { hoSeq } = useParams();
    const navigate = useNavigate();
    const [headerInfo, setHeaderInfo] = useState<any>(null);

    useEffect(() => {
        axios.get(`/api/households/${hoSeq}/header`).then(res => setHeaderInfo(res.data));
    }, [hoSeq]);

    if (!headerInfo) return <div>로딩 중...</div>;

    return (
        <div className="page-container">
            <header className="header"><button className="back-btn" onClick={() => navigate(-1)}>&lt;</button><h2>세대주 확인</h2></header>
            <div className="content">
                {headerInfo.isExist ? (
                    <div className="info-box">
                        <p>해당 동호에 이미 등록된 세대가 있습니다.</p>
                        <p>세대주: {headerInfo.headerName}</p>
                        <p>가족으로 가입하시겠습니까?</p>
                    </div>
                ) : (
                    <div className="info-box">
                        <p>해당 동호에 등록된 세대가 없습니다.</p>
                        <p>새로운 세대주로 가입하시겠습니까?</p>
                    </div>
                )}
            </div>
            <button className="next-btn" onClick={() => navigate('/join/cert', {state : {hoSeq}})}>다음</button>
        </div>
    );
};
export default HeaderCheckPage;
