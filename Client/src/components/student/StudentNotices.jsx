import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import '../shared/Notices.css';

const StudentNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await API.get('/notices/student');
                setNotices(res.data);
            } catch (err) {
                console.error('Error fetching notices:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    if (loading) return <div className="notices-empty">Loading notices...</div>;

    return (
        <div className="notices-section">
            <div className="notices-header">
                <div>
                    <h2>Notices & Announcements</h2>
                    <p>Stay updated with school announcements</p>
                </div>
            </div>

            <div className="notices-list">
                {notices.length > 0 ? notices.map(n => (
                    <div key={n._id} className={`notice-card ${n.priority}`}>
                        <div className="notice-top">
                            <span className="notice-title">{n.title}</span>
                            <div className="notice-meta">
                                <span className={`notice-priority ${n.priority}`}>{n.priority}</span>
                            </div>
                        </div>
                        <p className="notice-content">{n.content}</p>
                        <div className="notice-footer">
                            <span>By {n.postedBy?.name} ({n.postedByRole}) • {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                )) : (
                    <div className="notices-empty">No notices to show.</div>
                )}
            </div>
        </div>
    );
};

export default StudentNotices;
