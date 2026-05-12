import React, { useState } from 'react';
import './TeacherDashboard.css';
import TeacherProfile from '../../components/teacher/TeacherProfile';
import MyStudents from '../../components/teacher/MyStudents';
import MySection from '../../components/teacher/MySection';
import TeacherTimetable from '../../components/teacher/TeacherTimetable';
import TeacherAttendance from '../../components/teacher/TeacherAttendance';
import TeacherMarks from '../../components/teacher/TeacherMarks';
import TeacherNotices from '../../components/teacher/TeacherNotices';
import ChangePassword from '../../components/shared/ChangePassword';

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const userName = localStorage.getItem('userName') || 'Teacher';

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <TeacherProfile />;
            case 'students':
                return <MyStudents />;
            case 'section':
                return <MySection />;
            case 'timetable':
                return <TeacherTimetable />;
            case 'attendance':
                return <TeacherAttendance />;
            case 'notices':
                return <TeacherNotices />;
            case 'performance':
                return <TeacherMarks />;
            case 'settings':
                return <ChangePassword />;
            default:
                return <TeacherProfile />;
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="dashboard-layout">
            <aside className="teacher-sidebar">
                <div className="logo-section"><h2>TechVeda</h2></div>
                <nav className="nav-links">
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>🎓 All Students</button>
                    <button className={activeTab === 'section' ? 'active' : ''} onClick={() => setActiveTab('section')}>🏫 My Section</button>
                    <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}>🕐 Timetable</button>
                    <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
                    <button className={activeTab === 'notices' ? 'active' : ''} onClick={() => setActiveTab('notices')}>📢 Notices</button>
                    <button className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>📊 Performance</button>
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>Log Out</button>
            </aside>

            <main className="teacher-main">
                <header className="teacher-header">
                    <h1>Teacher Portal</h1>
                    <div className="profile-info">
                        <span>{userName}</span>
                        <div className="user-avatar">{userName.charAt(0)}</div>
                    </div>
                </header>
                <section className="teacher-body">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

export default TeacherDashboard;
