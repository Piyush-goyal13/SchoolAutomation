import React, { useState } from 'react';
import API from '../../api/axious';
import './ChangePassword.css';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            const res = await API.put('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            setMessage({ type: 'success', text: res.data.message });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error changing password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password">
            <div className="cp-card">
                <h2>Change Password</h2>
                <p className="cp-subtitle">Enter your current password and choose a new one</p>

                {message.text && (
                    <div className={`cp-message ${message.type}`}>{message.text}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="cp-field">
                        <label>Current Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="cp-field">
                        <label>New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="cp-field">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="cp-btn" disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
