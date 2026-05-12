import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './AdminAttendance.css';

const AdminAttendance = () => {
    const [students, setStudents] = useState([]);
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await API.get('/students');
                setStudents(res.data);
            } catch (err) {
                console.error('Error fetching students:', err);
            }
        };
        fetchStudents();
    }, []);

    const fetchHistory = async (studentId) => {
        setHistoryLoading(true);
        try {
            const res = await API.get(`/attendance/admin/${studentId}?month=${month}&year=${year}`);
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudent) fetchHistory(selectedStudent._id);
    }, [selectedStudent, month, year]);

    const sortedStudents = [...students]
        .filter(s => {
            const matchClass = !filterClass || s.class === filterClass;
            const matchSection = !filterSection || s.section === filterSection;
            if (!search) return matchClass && matchSection;
            const q = search.toLowerCase();
            return matchClass && matchSection && (
                s.name.toLowerCase().includes(q) ||
                (s.admissionNumber || '').toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const ca = parseInt(a.class) || 0, cb = parseInt(b.class) || 0;
            if (ca !== cb) return ca - cb;
            return (a.section || '').localeCompare(b.section || '');
        });

    return (
        <div className="admin-attendance">
            <div className="section-header">
                <div>
                    <h2>Attendance Records</h2>
                    <p>View attendance of any student across the school</p>
                </div>
            </div>

            <div className="aa-layout">
                <div className="aa-student-list">
                    <div className="aa-filters">
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            <option value="">All Classes</option>
                            {[...new Set(students.map(s => s.class))].sort().map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                            <option value="">All Sections</option>
                            {[...new Set(students.map(s => s.section))].sort().map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="aa-list">
                        {sortedStudents.map(s => (
                            <div
                                key={s._id}
                                className={`aa-student-item ${selectedStudent?._id === s._id ? 'active' : ''}`}
                                onClick={() => { setSelectedStudent(s); setHistory(null); }}
                            >
                                <div className="aa-student-name">{s.name}</div>
                                <div className="aa-student-meta">{s.admissionNumber} • {s.class} - {s.section}</div>
                            </div>
                        ))}
                        {sortedStudents.length === 0 && (
                            <div className="aa-empty-list">No students found.</div>
                        )}
                    </div>
                </div>

                <div className="aa-detail">
                    {!selectedStudent && (
                        <div className="aa-detail-empty">
                            <span className="placeholder-icon">📋</span>
                            <h3>Select a Student</h3>
                            <p>Choose a student from the list to view their attendance.</p>
                        </div>
                    )}

                    {selectedStudent && (
                        <>
                            <div className="aa-detail-header">
                                <div>
                                    <h3>{selectedStudent.name}</h3>
                                    <p>{selectedStudent.admissionNumber} • {selectedStudent.class} - {selectedStudent.section}</p>
                                </div>
                                <div className="aa-month-filter">
                                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                            <option key={i} value={String(i + 1)}>{m}</option>
                                        ))}
                                    </select>
                                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                                        {[2024, 2025, 2026].map(y => (
                                            <option key={y} value={String(y)}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {historyLoading && <div className="aa-loading">Loading...</div>}

                            {history && !historyLoading && (
                                <>
                                    <div className="aa-summary-cards">
                                        <div className="aa-card total"><h4>{history.summary.totalDays}</h4><p>Total</p></div>
                                        <div className="aa-card present"><h4>{history.summary.presentDays}</h4><p>Present</p></div>
                                        <div className="aa-card absent"><h4>{history.summary.absentDays}</h4><p>Absent</p></div>
                                        <div className="aa-card late"><h4>{history.summary.lateDays}</h4><p>Late</p></div>
                                        <div className="aa-card percentage"><h4>{history.summary.percentage}%</h4><p>Rate</p></div>
                                    </div>

                                    <div className="aa-records-table">
                                        <table>
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
                                                        <tr key={i} className={`aa-row ${r.status}`}>
                                                            <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                            <td>{r.day}</td>
                                                            <td><span className={`aa-pill ${r.status}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAttendance;
