import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import TeacherManagement from '../../components/admin/TeacherManagement';
import StudentManagement from '../../components/admin/StudentManagement';
import TimetableManagement from '../../components/admin/TimetableManagement';
import AdminAttendance from '../../components/admin/AdminAttendance';
import AdminNotices from '../../components/admin/AdminNotices';
import AdminFees from '../../components/admin/AdminFees';
import ChangePassword from '../../components/shared/ChangePassword';
import Chatbot from '../../components/shared/Chatbot';
import API from '../../api/axious';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [teacherCount, setTeacherCount] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const userName = localStorage.getItem('userName') || 'Admin';

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [teacherRes, studentRes] = await Promise.all([
                    API.get('/auth/teachers'),
                    API.get('/students')
                ]);
                setTeacherCount(teacherRes.data.length);
                setStudentCount(studentRes.data.length);
            } catch (err) {
                console.error('Error fetching counts:', err);
            }
        };
        fetchCounts();
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'teachers':
                return <TeacherManagement />;
            case 'students':
                return <StudentManagement />;
            case 'timetable':
                return <TimetableManagement />;
            case 'attendance':
                return <AdminAttendance />;
            case 'notices':
                return <AdminNotices />;
            case 'fees':
                return <AdminFees />;
            case 'chatbot':
                return <Chatbot />;
            case 'settings':
                return <ChangePassword />;
            case 'overview':
            default:
                return (
                    <div className="stats-grid">
                        <div className="stat-card"><h3>{teacherCount}</h3><p>Teachers</p></div>
                        <div className="stat-card"><h3>{studentCount}</h3><p>Students</p></div>
                    </div>
                );
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="dashboard-layout">
            <aside className="admin-sidebar">
                <div className="logo-section"><h2>EduFlow</h2></div>
                <nav className="nav-links">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                    <button className={activeTab === 'teachers' ? 'active' : ''} onClick={() => setActiveTab('teachers')}>👨‍🏫 Teachers</button>
                    <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>🎓 Students</button>
                    <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}>🕐 Timetable</button>
                    <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
                    <button className={activeTab === 'notices' ? 'active' : ''} onClick={() => setActiveTab('notices')}>📢 Notices</button>
                    <button className={activeTab === 'fees' ? 'active' : ''} onClick={() => setActiveTab('fees')}>💰 Fees</button>
                    <button className={activeTab === 'chatbot' ? 'active' : ''} onClick={() => setActiveTab('chatbot')}>🤖 AI Chat</button>
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>Log Out</button>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>Admin Portal</h1>
                    <div className="profile-info">
                        <span>{userName}</span>
                        <div className="user-avatar">{userName.charAt(0)}</div>
                    </div>
                </header>
                <section className="admin-body">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;