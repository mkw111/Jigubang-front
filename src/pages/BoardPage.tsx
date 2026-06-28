import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './BoardPage.css';

const BoardPage: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Core states
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create post states
    const [writeModalOpen, setWriteModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    
    // View post detail states
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    const fetchPosts = async () => {
        if (!user.hoSeq) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/board/posts?hoSeq=${user.hoSeq}&page=0&size=20`);
            if (res.ok) {
                const data = await res.json();
                // Sort posts by createdAt desc so latest shows first
                const content = data.content || [];
                content.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPosts(content);
            }
        } catch (e) {
            console.error("Failed to fetch posts", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [user.hoSeq]);

    const handleCreatePost = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/board/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent,
                    authorUuid: user.uuid,
                    hoSeq: user.hoSeq
                })
            });

            if (response.ok) {
                alert('게시글이 성공적으로 등록되었습니다.');
                setNewTitle('');
                setNewContent('');
                setWriteModalOpen(false);
                fetchPosts();
            } else {
                alert('게시글 작성 실패');
            }
        } catch (error) {
            alert('서버 통신 오류');
        }
    };

    const handleViewPost = async (post: any) => {
        setSelectedPost(post);
        setDetailModalOpen(true);
        
        // Increase view count
        try {
            await fetch(`/api/board/posts/${post.id}`);
        } catch (e) {
            // silent fail
        }

        // Fetch comments
        fetchComments(post.id);
    };

    const fetchComments = async (postId: number) => {
        try {
            const response = await fetch(`/api/board/posts/${postId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost) return;

        try {
            const response = await fetch(`/api/board/posts/${selectedPost.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    authorUuid: user.uuid
                })
            });

            if (response.ok) {
                setNewComment('');
                fetchComments(selectedPost.id);
            } else {
                alert('댓글 등록 실패');
            }
        } catch (error) {
            alert('서버 통신 오류');
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/board/posts/${postId}?uuid=${user.uuid}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('게시글이 삭제되었습니다.');
                setDetailModalOpen(false);
                setSelectedPost(null);
                fetchPosts();
            } else {
                alert('게시글 삭제 권한이 없거나 실패했습니다.');
            }
        } catch (error) {
            alert('서버 통신 오류');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/board/comments/${commentId}?uuid=${user.uuid}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (selectedPost) {
                    fetchComments(selectedPost.id);
                }
            } else {
                alert('댓글 삭제 권한이 없거나 실패했습니다.');
            }
        } catch (error) {
            alert('서버 통신 오류');
        }
    };

    const formatTime = (timeStr: string) => {
        try {
            const date = new Date(timeStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.round(diffMs / 60000);
            
            if (diffMin < 1) return '방금 전';
            if (diffMin < 60) return `${diffMin}분 전`;
            
            const diffHr = Math.round(diffMin / 60);
            if (diffHr < 24) return `${diffHr}시간 전`;
            
            const diffDays = Math.round(diffHr / 24);
            if (diffDays < 7) return `${diffDays}일 전`;
            
            return date.toLocaleDateString();
        } catch (e) {
            return '알 수 없음';
        }
    };

    return (
        <div className="page-container board-wrapper">
            {/* Header */}
            <header className="board-header">
                <button className="action-icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '20px' }}>
                    ‹
                </button>
                <h2 className="board-title">우리 단지 커뮤니티</h2>
                <button className="action-icon-btn" onClick={() => setWriteModalOpen(true)}>
                    +
                </button>
            </header>

            {/* List */}
            <main className="board-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        게시글을 불러오는 중...
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="post-card" onClick={() => handleViewPost(post)}>
                            <h4 className="post-card-title">{post.title}</h4>
                            <p className="post-card-body">{post.content}</p>
                            <div className="post-card-meta">
                                <div className="post-card-meta-left">
                                    <span>{post.authorUuid === user.uuid ? '나' : '입주민'}</span>
                                    <span>•</span>
                                    <span>조회수 {post.viewCount || 0}</span>
                                </div>
                                <span>{formatTime(post.createdAt)}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        <p>등록된 게시글이 없습니다. 첫 게시글을 작성해보세요! ✍️</p>
                    </div>
                )}
            </main>

            <BottomNav />

            {/* --- SLIDE-UP MODAL: WRITE POST --- */}
            {writeModalOpen && (
                <div className="board-modal-overlay" onClick={() => setWriteModalOpen(false)}>
                    <div className="board-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="board-modal-header">
                            <h3>새 게시글 작성</h3>
                            <button className="board-modal-close" onClick={() => setWriteModalOpen(false)}>&times;</button>
                        </div>
                        <div className="board-modal-body">
                            <div className="form-group">
                                <label>제목</label>
                                <input 
                                    className="form-input" 
                                    placeholder="제목을 입력하세요."
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>내용</label>
                                <textarea 
                                    className="form-input form-textarea" 
                                    placeholder="단지 입주민들과 소통할 내용을 입력하세요."
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="board-modal-footer">
                            <button 
                                className="btn login-btn" 
                                onClick={handleCreatePost}
                                style={{ margin: 0, height: '48px', flex: 1 }}
                            >
                                등록하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SLIDE-UP MODAL: VIEW DETAIL & COMMENTS --- */}
            {detailModalOpen && selectedPost && (
                <div className="board-modal-overlay" onClick={() => setDetailModalOpen(false)}>
                    <div className="board-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="board-modal-header">
                            <h3>게시글 상세</h3>
                            <button className="board-modal-close" onClick={() => setDetailModalOpen(false)}>&times;</button>
                        </div>
                        <div className="board-modal-body">
                            <h4 className="post-detail-title">{selectedPost.title}</h4>
                            <div className="post-detail-author">
                                <span>작성자: {selectedPost.authorUuid === user.uuid ? '나 (본인)' : '입주민'}</span>
                                <span style={{ margin: '0 8px' }}>|</span>
                                <span>{formatTime(selectedPost.createdAt)}</span>
                            </div>
                            
                            <p className="post-detail-content">{selectedPost.content}</p>

                            {/* Comments area */}
                            <div className="comments-section">
                                <h4 className="comments-title">댓글 ({comments.length})</h4>
                                <div className="comments-list">
                                    {comments.map((comment: any) => (
                                        <div key={comment.id} className="comment-item">
                                            <div className="comment-meta">
                                                {comment.authorUuid === user.uuid ? '나 (본인)' : '입주민'}
                                                <span style={{ fontSize: '9px', fontWeight: 'normal', marginLeft: '6px', color: '#999' }}>
                                                    {formatTime(comment.createdAt)}
                                                </span>
                                            </div>
                                            <div className="comment-content">{comment.content}</div>
                                            {comment.authorUuid === user.uuid && (
                                                <button 
                                                    className="comment-delete-btn"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="comment-form">
                                    <input 
                                        className="comment-input" 
                                        placeholder="댓글을 입력하세요..." 
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleAddComment();
                                        }}
                                    />
                                    <button className="comment-submit-btn" onClick={handleAddComment}>
                                        등록
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Show delete button if user is the author */}
                        {selectedPost.authorUuid === user.uuid && (
                            <div className="board-modal-footer" style={{ paddingTop: 0 }}>
                                <button 
                                    className="post-delete-btn" 
                                    onClick={() => handleDeletePost(selectedPost.id)}
                                    style={{ flex: 1 }}
                                >
                                    🗑️ 게시글 삭제하기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardPage;
