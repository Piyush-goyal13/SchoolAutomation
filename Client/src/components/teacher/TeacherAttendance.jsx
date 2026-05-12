import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherAttendance.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherAttendance = () => {
    const [tab, setTab] = useState('mark');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [sectionInfo, setSectionInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // View history state
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [historyMonth, setHistoryMonth] = useState(String(new Date().getMonth() + 1));
    const [historyYear, setHistoryYear] = useState(String(new Date().getFullYear()));
    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/attendance?date=${date}`);
            if (!res.data.assigned) {
                setSectionInfo(null);
                setStudents([]);
            } else {
                setSectionInfo({ class: res.data.assignedClass, section: res.data.assignedSection });
                setStudents(res.data.students.map(s => ({
                    ...s,
                    status: s.status || 'present'
                })));
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const handleStatusChange = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.studentId === studentId ? { ...s, status } : s
        ));
    };

    const markAll = (status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dayName = DAYS[new Date(date).getDay()];
            await API.post('/attendance', {
                date,
                day: dayName,
                records: students.map(s => ({ studentId: s.studentId, status: s.status }))
            });
            alert('Attendance saved successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving attendance');
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        if (!selectedStudent) return;
        setHistoryLoading(true);
        try {
            const res = await API.get(`/attendance/student/${selectedStudent.studentId}?month=${historyMonth}&year=${historyYear}`);
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudent) fetchHistory();
    }, [selectedStudent, historyMonth, historyYear]);

    if (!sectionInfo && !loading) {
        return (
            <div className="att-empty">
                <span className="placeholder-icon">📋</span>
                <h2>No Section Assigned</h2>
                <p>You need to be assigned as section incharge to mark attendance.</p>
            </div>
        );
    }

    return (
        <div className="teacher-attendance">
            <div className="att-tabs">
                <button className={tab === 'mark' ? 'active' : ''} onClick={() => setTab('mark')}>📝 Mark Attendance</button>
                <button className={tab === 'view' ? 'active' : ''} onClick={() => setTab('view')}>📊 View History</button>
            </div>

            {tab === 'mark' && (
                <div className="att-mark">
                    <div className="att-header">
                        <div>
                            <h2>Mark Attendance — {sectionInfo?.class} {sectionInfo?.section}</h2>
                            <p>{DAYS[new Date(date).getDay()]}, {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="att-header-actions">
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            <button className="primary-btn" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    </div>

                    <div className="att-quick-actions">
                        <button className="quick-btn present" onClick={() => markAll('present')}>All Present</button>
                        <button className="quick-btn absent" onClick={() => markAll('absent')}>All Absent</button>
                        <span className="att-summary-inline">
                            ✅ {students.filter(s => s.status === 'present').length} &nbsp;
                            ❌ {students.filter(s => s.status === 'absent').length} &nbsp;
                            ⏰ {students.filter(s => s.status === 'late').length}
                        </span>
                    </div>

                    <div className="att-table-container">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Adm. No</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, i) => (
                                    <tr key={s.studentId} className={`status-row ${s.status}`}>
                                        <td>{i + 1}</td>
                                        <td>{s.admissionNumber}</td>
                                        <td className="bold-text">{s.name}</td>
                                        <td>
                                            <div className="status-btns">
                                                <button className={`status-btn present ${s.status === 'present' ? 'active' : ''}`} onClick={() => handleStatusChange(s.studentId, 'present')}>Present</button>
                                                <button className={`status-btn absent ${s.status === 'absent' ? 'active' : ''}`} onClick={() => handleStatusChange(s.studentId, 'absent')}>Absent</button>
                                                <button className={`status-btn late ${s.status === 'late' ? 'active' : ''}`} onClick={() => handleStatusChange(s.studentId, 'late')}>Late</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'view' && (
                <div className="att-view">
                    <div className="att-view-header">
                        <h2>Attendance History — {sectionInfo?.class} {sectionInfo?.section}</h2>
                    </div>

                    <div className="att-view-controls">
                        <div className="filter-group">
                            <label>Student</label>
                            <select value={selectedStudent?.studentId || ''} onChange={(e) => {
                                const s = students.find(st => st.studentId === e.target.value);
                                setSelectedStudent(s || null);
                                setHistory(null);
                            }}>
                                <option value="">Select Student</option>
                                {students.map(s => (
                                    <option key={s.studentId} value={s.studentId}>{s.name} ({s.admissionNumber})</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Month</label>
                            <select value={historyMonth} onChange={(e) => setHistoryMonth(e.target.value)}>
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                    <option key={i} value={String(i + 1)}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Year</label>
                            <select value={historyYear} onChange={(e) => setHistoryYear(e.target.value)}>
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!selectedStudent && (
                        <div className="att-empty-inline">Select a student to view their attendance history.</div>
                    )}

                    {selectedStudent && historyLoading && (
                        <div className="att-empty-inline">Loading...</div>
                    )}

                    {selectedStudent && history && !historyLoading && (
                        <>
                            <div className="att-summary-cards">
                                <div className="summary-card total"><h3>{history.summary.totalDays}</h3><p>Total Days</p></div>
                                <div className="summary-card present"><h3>{history.summary.presentDays}</h3><p>Present</p></div>
                                <div className="summary-card absent"><h3>{history.summary.absentDays}</h3><p>Absent</p></div>
                                <div className="summary-card late"><h3>{history.summary.lateDays}</h3><p>Late</p></div>
                                <div className="summary-card percentage"><h3>{history.summary.percentage}%</h3><p>Attendance</p></div>
                            </div>

                            <div className="att-table-container">
                                <table className="att-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Day</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.records.length > 0 ? (
                                            history.records.map((r, i) => (
                                                <tr key={i} className={`status-row ${r.status}`}>
                                                    <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                    <td>{r.day}</td>
                                                    <td><span className={`status-pill-att ${r.status}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                    No attendance records for this month.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherAttendance;
