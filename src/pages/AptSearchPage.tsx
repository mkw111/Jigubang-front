import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./AptSearchPage.css";

const AptSearchPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [dongs, setDongs] = useState<string[]>([]);
    const [selectedDong, setSelectedDong] = useState("");
    const [hos, setHos] = useState<any[]>([]);
    const [selectedHoId, setSelectedHoId] = useState<number | null>(null);

    useEffect(() => {
        if (search.length >= 2) {
            axios.get(`/api/apt/sites?aptName=${search}`).then(res => setSites(res.data));
        }
    }, [search]);

    const handleSiteSelect = (site: any) => {
        setSelectedSite(site);
        axios.get(`/api/apt/sites/${site.aptSiteId}/dongs`).then(res => setDongs(res.data.dongs));
    };

    const handleDongSelect = (dong: string) => {
        setSelectedDong(dong);
        axios.get(`/api/apt/sites/${selectedSite.aptSiteId}/dongs/${dong}/hos`).then(res => setHos(res.data));
    };

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const mode = query.get('mode');

    const handleNext = async () => {
        if (!selectedHoId) return;

        if (mode === 'change') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            try {
                await axios.post(`/api/users/change-address?uuid=${user.uuid}&aptDongHoId=${selectedHoId}`);
                alert('주소가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
                localStorage.removeItem('user');
                navigate('/login');
            } catch (e) {
                alert('주소 변경 실패');
            }
        } else {
            navigate(`/join/header-check/${selectedHoId}`);
        }
    };

    return (
        <div className="page-container">
            <header className="header"><button className="back-btn" onClick={() => navigate(-1)}>&lt;</button><h2>아파트 찾기</h2></header>
            <div className="content">
                <h3>아파트 검색</h3>
                <div className="search-box"><input type="text" placeholder="아파트 이름 검색" value={search} onChange={e => setSearch(e.target.value)} /></div>
                {!selectedSite && sites.map(s => <div key={s.aptSiteId} onClick={() => handleSiteSelect(s)} className="apt-item">{s.aptName}</div>)}
                {selectedSite && <div className="selected-info">선택됨: {selectedSite.aptName}</div>}
                {selectedSite && !selectedDong && dongs.map(d => <div key={d} onClick={() => handleDongSelect(d)} className="apt-item">{d}</div>)}
                {selectedDong && <div className="selected-info">{selectedDong}</div>}
                {selectedDong && hos.map(h => <div key={h.aptDongHoId} onClick={() => setSelectedHoId(h.aptDongHoId)} className={`apt-item ${selectedHoId === h.aptDongHoId ? "active" : ""}`}>{h.ho}</div>)}
            </div>
            <button className="next-btn" disabled={!selectedHoId} onClick={handleNext}>다음</button>
        </div>
    );
};
export default AptSearchPage;
