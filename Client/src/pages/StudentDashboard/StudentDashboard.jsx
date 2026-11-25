import React, { useState } from 'react';
import './StudentDashboard.css';
import StudentProfile from '../../components/student/StudentProfile';
import StudentTimetable from '../../components/student/StudentTimetable';
import StudentAttendance from '../../components/student/StudentAttendance';
import StudentMarks from '../../components/student/StudentMarks';
import StudentNotices from '../../components/student/StudentNotices';
import StudentFees from '../../components/student/StudentFees';
import StudentExam from '../../components/student/StudentExam';
import ChangePassword from '../../components/shared/ChangePassword';
import Chatbot from '../../components/shared/Chatbot';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const userName = localStorage.getItem('userName') || 'Student';

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <StudentProfile />;
            case 'attendance':
                return <StudentAttendance />;
            case 'timetable':
                return <StudentTimetable />;
            case 'notices':
                return <StudentNotices />;
            case 'performance':
                return <StudentMarks />;
            case 'dues':
                return <StudentFees />;
            case 'exams':
                return <StudentExam />;
            case 'chatbot':
                return <Chatbot />;
            case 'settings':
                return <ChangePassword />;
            default:
                return <StudentProfile />;
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="dashboard-layout">
            <aside className="student-sidebar">
                <div className="logo-section"><h2>TechVeda</h2></div>
                <nav className="nav-links">
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
                    <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}>🕐 Timetable</button>
                    <button className={activeTab === 'notices' ? 'active' : ''} onClick={() => setActiveTab('notices')}>📢 Notices</button>
                    <button className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>📊 Performance</button>
                    <button className={activeTab === 'dues' ? 'active' : ''} onClick={() => setActiveTab('dues')}>💰 Pending Dues</button>
                    <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>🧠 Exams</button>
                    <button className={activeTab === 'chatbot' ? 'active' : ''} onClick={() => setActiveTab('chatbot')}>🤖 AI Chat</button>
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>Log Out</button>
            </aside>

            <main className="student-main">
                <header className="student-header">
                    <h1>Student Portal</h1>
                    <div className="profile-info">
                        <span>{userName}</span>
                        <div className="user-avatar">{userName.charAt(0)}</div>
                    </div>
                </header>
                <section className="student-body">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

export default StudentDashboard;
