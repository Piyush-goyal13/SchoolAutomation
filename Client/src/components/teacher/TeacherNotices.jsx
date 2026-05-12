import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import '../shared/Notices.css';

const TeacherNotices = () => {
    const [notices, setNotices] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });

    const fetchNotices = async () => {
        try {
            const res = await API.get('/notices/teacher');
            setNotices(res.data);
        } catch (err) {
            console.error('Error fetching notices:', err);
        }
    };

    useEffect(() => { fetchNotices(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/notices/teacher', formData);
            setFormData({ title: '', content: '', priority: 'normal' });
            setShowForm(false);
            fetchNotices();
        } catch (err) {
            alert(err.response?.data?.message || 'Error posting notice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notices-section">
            <div className="notices-header">
                <div>
                    <h2>Notices</h2>
                    <p>View notices and post to your section</p>
                </div>
                <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Post to My Section'}
                </button>
            </div>

            {showForm && (
                <div className="notice-form">
                    <h3>Post Notice to Your Section</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Title</label>
                            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Notice title" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Content</label>
                            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Write your notice here..." required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="normal">Normal</option>
                                    <option value="important">Important</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        <div className="notice-form-actions">
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? 'Posting...' : 'Post Notice'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="notices-list">
                {notices.length > 0 ? notices.map(n => (
                    <div key={n._id} className={`notice-card ${n.priority}`}>
                        <div className="notice-top">
                            <span className="notice-title">{n.title}</span>
                            <div className="notice-meta">
                                <span className={`notice-priority ${n.priority}`}>{n.priority}</span>
                                <span className="notice-audience">
                                    {n.audience === 'section' ? `${n.targetClass} - ${n.targetSection}` : n.audience}
                                </span>
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

export default TeacherNotices;
