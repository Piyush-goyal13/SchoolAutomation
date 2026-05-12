import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherProfile.css';

const TeacherProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get('/auth/me');
                setProfile(res.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="profile-loading">Loading profile...</div>;
    if (!profile) return <div className="profile-loading">Profile not found.</div>;

    return (
        <div className="teacher-profile">
            <div className="profile-header">
                <div className="profile-avatar">{profile.name.charAt(0)}</div>
                <div>
                    <h2>{profile.name}</h2>
                    <p className="profile-subtitle">{profile.subject} Teacher</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-card">
                    <h3>Personal Info</h3>
                    <div className="info-row">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{profile.name}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{profile.email}</span>
                    </div>
                </div>

                <div className="profile-card">
                    <h3>Academic Info</h3>
                    <div className="info-row">
                        <span className="info-label">Subject</span>
                        <span className="info-value">{profile.subject}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Role</span>
                        <span className="info-value">Teacher</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Section Incharge</span>
                        <span className="info-value">
                            {profile.assignedClass && profile.assignedSection
                                ? `${profile.assignedClass} - ${profile.assignedSection}`
                                : 'Not Assigned'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherProfile;
