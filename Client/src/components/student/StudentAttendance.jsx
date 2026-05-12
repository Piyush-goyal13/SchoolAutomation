import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import { generateAttendanceReport } from '../../utils/pdfGenerator';
import './StudentAttendance.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const StudentAttendance = () => {
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const [attRes, profileRes] = await Promise.all([
                API.get(`/attendance/me?month=${month}&year=${year}`),
                API.get('/students/me')
            ]);
            setData(attRes.data);
            setProfile(profileRes.data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [month, year]);

    if (loading) return <div className="sa-loading">Loading attendance...</div>;

    return (
        <div className="student-attendance">
            <div className="sa-header">
                <h2>My Attendance</h2>
                {data && data.records.length > 0 && profile && (
                    <button className="sa-download-btn" onClick={() => {
                        generateAttendanceReport(
                            profile.name, profile.class, profile.section, profile.admissionNumber,
                            data.summary, data.records, MONTH_NAMES[month - 1], year
                        );
                    }}>📄 Download Report</button>
                )}
            </div>

            <div className="sa-controls">
                <div className="filter-group">
                    <label>Month</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        {MONTH_NAMES.map((m, i) => (
                            <option key={i} value={String(i + 1)}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={String(y)}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {data && (
                <>
                    <div className="sa-summary-cards">
                        <div className="sa-card total"><h3>{data.summary.totalDays}</h3><p>Total Days</p></div>
                        <div className="sa-card present"><h3>{data.summary.presentDays}</h3><p>Present</p></div>
                        <div className="sa-card absent"><h3>{data.summary.absentDays}</h3><p>Absent</p></div>
                        <div className="sa-card late"><h3>{data.summary.lateDays}</h3><p>Late</p></div>
                        <div className="sa-card percentage"><h3>{data.summary.percentage}%</h3><p>Attendance</p></div>
                    </div>

                    <div className="sa-table-container">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.records.length > 0 ? (
                                    data.records.map((r, i) => (
                                        <tr key={i} className={`sa-row ${r.status}`}>
                                            <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>{r.day}</td>
                                            <td><span className={`sa-pill ${r.status}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
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
    );
};

export default StudentAttendance;
