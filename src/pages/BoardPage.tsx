import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const BoardPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(`/api/board/posts?hoSeq=${user.hoSeq}&page=0&size=20`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.content || []);
                }
            } catch (e) {
                console.error("Failed to fetch posts", e);
            }
        };
        fetchPosts();
    }, [user.hoSeq]);

    return (
        <div className="home-container">
            <header className="home-header">
                <div onClick={() => navigate(-1)} style={{cursor: 'pointer', fontSize: '20px'}}>←</div>
                <h2 className="ho-info">우리 단지 커뮤니티</h2>
                <div onClick={() => alert('글쓰기 기능 준비 중')} style={{fontSize: '24px'}}>+</div>
            </header>

            <main className="dashboard-content">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="card" onClick={() => alert('상세보기 준비 중')}>
                        <h4 style={{fontSize: '16px', marginBottom: '8px'}}>{post.title}</h4>
                        <p style={{fontSize: '13px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {post.content}
                        </p>
                        <div style={{marginTop: '12px', fontSize: '11px', color: '#AAA'}}>
                            <span>조회수 {post.viewCount}</span> • <span>방금 전</span>
                        </div>
                    </div>
                )) : (
                    <div style={{textAlign: 'center', padding: '50px 0', color: '#999'}}>
                        <p>첫 게시글을 남겨보세요!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BoardPage;
