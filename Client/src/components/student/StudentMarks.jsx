import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import { generateReportCard } from '../../utils/pdfGenerator';
import './StudentMarks.css';

const StudentMarks = () => {
    const [marks, setMarks] = useState({});
    const [examTypes, setExamTypes] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [marksRes, examRes, profileRes] = await Promise.all([
                    API.get('/marks/me'),
                    API.get('/marks/exam-types'),
                    API.get('/students/me')
                ]);
                setMarks(marksRes.data.marks);
                setExamTypes(examRes.data);
                setProfile(profileRes.data);
            } catch (err) {
                console.error('Error fetching marks:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="sm-loading">Loading results...</div>;

    const availableExams = Object.keys(marks);

    if (availableExams.length === 0) {
        return (
            <div className="sm-empty">
                <span className="placeholder-icon">📊</span>
                <h2>No Results Yet</h2>
                <p>Your exam results will appear here once teachers enter marks.</p>
            </div>
        );
    }

    const currentExam = selectedExam || availableExams[0];
    const currentMarks = marks[currentExam] || [];
    const totalObtained = currentMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = currentMarks.reduce((sum, m) => sum + m.totalMarks, 0);
    const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    const handleDownloadReport = () => {
        if (!profile) return;
        generateReportCard(profile.name, profile.class, profile.section, profile.admissionNumber, marks);
    };

    return (
        <div className="student-marks">
            <div className="sm-header">
                <h2>My Results</h2>
                <button className="sm-download-btn" onClick={handleDownloadReport}>📄 Download Report Card</button>
            </div>

            <div className="sm-exam-tabs">
                {availableExams.map(exam => (
                    <button
                        key={exam}
                        className={`sm-tab ${currentExam === exam ? 'active' : ''}`}
                        onClick={() => setSelectedExam(exam)}
                    >
                        {exam}
                    </button>
                ))}
            </div>

            <div className="sm-overall">
                <div className="sm-overall-card">
                    <h3>{overallPercentage}%</h3>
                    <p>Overall — {totalObtained}/{totalMax}</p>
                </div>
            </div>

            <div className="sm-table-container">
                <table className="sm-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>Total</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMarks.map((m, i) => {
                            const pct = m.percentage;
                            let grade = 'F';
                            if (pct >= 90) grade = 'A+';
                            else if (pct >= 80) grade = 'A';
                            else if (pct >= 70) grade = 'B+';
                            else if (pct >= 60) grade = 'B';
                            else if (pct >= 50) grade = 'C';
                            else if (pct >= 33) grade = 'D';

                            return (
                                <tr key={i} className={pct < 33 ? 'fail-row' : ''}>
                                    <td className="bold-text">{m.subject}</td>
                                    <td>{m.marksObtained}</td>
                                    <td>{m.totalMarks}</td>
                                    <td>{pct}%</td>
                                    <td><span className={`grade-pill grade-${grade.replace('+', 'plus')}`}>{grade}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentMarks;
