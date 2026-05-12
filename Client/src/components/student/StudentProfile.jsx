import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './StudentProfile.css';

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get('/students/me');
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
        <div className="student-profile">
            <div className="profile-header">
                <div className="profile-avatar">{profile.name.charAt(0)}</div>
                <div>
                    <h2>{profile.name}</h2>
                    <p className="profile-subtitle">{profile.class} - Section {profile.section}</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-card">
                    <h3>Academic Info</h3>
                    <div className="info-row">
                        <span className="info-label">Admission No.</span>
                        <span className="info-value">{profile.admissionNumber}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Class</span>
                        <span className="info-value">{profile.class}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Section</span>
                        <span className="info-value">{profile.section}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Section Incharge</span>
                        <span className="info-value">
                            {profile.sectionIncharge
                                ? `${profile.sectionIncharge.name} (${profile.sectionIncharge.subject})`
                                : 'Not Assigned'}
                        </span>
                    </div>
                </div>

                <div className="profile-card">
                    <h3>Contact Info</h3>
                    <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{profile.email}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Parent Name</span>
                        <span className="info-value">{profile.parentName}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Parent Contact</span>
                        <span className="info-value">{profile.parentContact}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
