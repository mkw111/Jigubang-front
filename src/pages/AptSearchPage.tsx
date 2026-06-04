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
    const [selectedHoSeq, setSelectedHoSeq] = useState<number | null>(null);

    useEffect(() => {
        if (search.length >= 2) {
            axios.get(`/api/apt/sites?aptName=${search}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setSites(res.data);
                    } else {
                        console.error("Invalid sites data:", res.data);
                        setSites([]);
                    }
                })
                .catch(err => console.error("Search failed:", err));
        }
    }, [search]);

    const handleSiteSelect = (site: any) => {
        setSelectedSite(site);
        axios.get(`/api/apt/sites/${site.siteSeq}/dongs`)
            .then(res => {
                if (res.data && Array.isArray(res.data.dongs)) {
                    setDongs(res.data.dongs);
                } else {
                    alert("동 정보를 불러오지 못했습니다.");
                }
            })
            .catch(err => alert("서버 통신 오류"));
    };

    const handleDongSelect = (dong: string) => {
        setSelectedDong(dong);
        axios.get(`/api/apt/sites/${selectedSite.siteSeq}/dongs/${dong}/hos`)
            .then(res => {
                if (Array.isArray(res.data)) {
                    setHos(res.data);
                } else {
                    alert("호 정보를 불러오지 못했습니다.");
                }
            })
            .catch(err => alert("서버 통신 오류"));
    };

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const mode = query.get('mode');

    const handleNext = async () => {
        if (!selectedHoSeq) return;

        if (mode === 'change') {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert("로그인 정보가 없습니다.");
                navigate('/login');
                return;
            }
            const user = JSON.parse(userStr);
            try {
                const res = await axios.post(`/api/users/change-address?uuid=${user.uuid}&hoSeq=${selectedHoSeq}`);
                if (res.status === 200 || res.data.success) {
                    alert('주소가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else {
                    throw new Error("Change failed");
                }
            } catch (e) {
                alert('주소 변경에 실패했습니다. 다시 시도해주세요.');
            }
        } else {
            navigate(`/join/header-check/${selectedHoSeq}`);
        }
    };

    return (
        <div className="page-container">
            <header className="header"><button className="back-btn" onClick={() => navigate(-1)}>&lt;</button><h2>아파트 찾기</h2></header>
            <div className="content">
                <h3>아파트 검색</h3>
                <div className="search-box"><input type="text" placeholder="아파트 이름 검색" value={search} onChange={e => setSearch(e.target.value)} /></div>
                {!selectedSite && sites.map(s => <div key={s.siteSeq} onClick={() => handleSiteSelect(s)} className="apt-item">{s.aptName}</div>)}
                {selectedSite && <div className="selected-info">선택됨: {selectedSite.aptName}</div>}
                {selectedSite && !selectedDong && dongs.map(d => <div key={d} onClick={() => handleDongSelect(d)} className="apt-item">{d}</div>)}
                {selectedDong && <div className="selected-info">{selectedDong}</div>}
                {selectedDong && hos.map(h => <div key={h.hoSeq} onClick={() => setSelectedHoSeq(h.hoSeq)} className={`apt-item ${selectedHoSeq === h.hoSeq ? "active" : ""}`}>{h.ho}</div>)}
            </div>
            <button className="next-btn" disabled={!selectedHoSeq} onClick={handleNext}>다음</button>
        </div>
    );
};
export default AptSearchPage;
