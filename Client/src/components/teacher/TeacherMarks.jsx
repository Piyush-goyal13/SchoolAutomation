import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherMarks.css';

const TeacherMarks = () => {
    const [examTypes, setExamTypes] = useState([]);
    const [sections, setSections] = useState([]);
    const [subject, setSubject] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [totalMarks, setTotalMarks] = useState('100');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examRes, sectionsRes] = await Promise.all([
                    API.get('/marks/exam-types'),
                    API.get('/marks/my-sections')
                ]);
                setExamTypes(examRes.data);
                setSections(sectionsRes.data.sections);
                setSubject(sectionsRes.data.subject);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    const fetchMarks = async () => {
        if (!selectedSection || !selectedExam) return;
        const [cls, sec] = selectedSection.split('|');
        setLoading(true);
        try {
            const res = await API.get(`/marks/section?class=${cls}&section=${sec}&examType=${selectedExam}`);
            setStudents(res.data.students.map(s => ({
                ...s,
                marksObtained: s.marksObtained !== '' ? s.marksObtained : '',
                totalMarks: s.totalMarks || totalMarks
            })));
        } catch (err) {
            console.error('Error fetching marks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarks();
    }, [selectedSection, selectedExam]);

    const handleMarksChange = (studentId, value) => {
        setStudents(prev => prev.map(s =>
            s.studentId === studentId ? { ...s, marksObtained: value } : s
        ));
    };

    const handleSave = async () => {
        const [cls, sec] = selectedSection.split('|');
        const records = students
            .filter(s => s.marksObtained !== '' && s.marksObtained !== null)
            .map(s => ({ studentId: s.studentId, marksObtained: Number(s.marksObtained) }));

        if (records.length === 0) {
            alert('Please enter marks for at least one student');
            return;
        }

        setSaving(true);
        try {
            await API.post('/marks', {
                class: cls,
                section: sec,
                examType: selectedExam,
                totalMarks: Number(totalMarks),
                records
            });
            alert('Marks saved successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving marks');
        } finally {
            setSaving(false);
        }
    };

    if (sections.length === 0) {
        return (
            <div className="tm-empty">
                <span className="placeholder-icon">📊</span>
                <h2>No Classes Assigned</h2>
                <p>You haven't been assigned to any classes in the timetable yet.</p>
            </div>
        );
    }

    return (
        <div className="teacher-marks">
            <div className="tm-header">
                <div>
                    <h2>Enter Marks — {subject}</h2>
                    <p>Select exam type and class to enter marks</p>
                </div>
            </div>

            <div className="tm-controls">
                <div className="filter-group">
                    <label>Exam Type</label>
                    <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
                        <option value="">Select Exam</option>
                        {examTypes.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Class - Section</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                        <option value="">Select Section</option>
                        {sections.map((s, i) => (
                            <option key={i} value={`${s.class}|${s.section}`}>{s.class} - {s.section}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Total Marks</label>
                    <input
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        min="1"
                    />
                </div>
                {selectedSection && selectedExam && (
                    <button className="primary-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Marks'}
                    </button>
                )}
            </div>

            {selectedSection && selectedExam && !loading && students.length > 0 && (
                <div className="tm-table-container">
                    <table className="tm-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Adm. No</th>
                                <th>Name</th>
                                <th>Marks (out of {totalMarks})</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => (
                                <tr key={s.studentId} className={s.marksObtained !== '' && Number(s.marksObtained) < totalMarks * 0.33 ? 'fail-row' : ''}>
                                    <td>{i + 1}</td>
                                    <td>{s.admissionNumber}</td>
                                    <td className="bold-text">{s.name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            className="marks-input"
                                            value={s.marksObtained}
                                            onChange={(e) => handleMarksChange(s.studentId, e.target.value)}
                                            min="0"
                                            max={totalMarks}
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="percentage-cell">
                                        {s.marksObtained !== '' ? `${Math.round((Number(s.marksObtained) / Number(totalMarks)) * 100)}%` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedSection && selectedExam && loading && (
                <div className="tm-loading">Loading...</div>
            )}

            {(!selectedSection || !selectedExam) && (
                <div className="tm-placeholder">
                    <span className="placeholder-icon">📝</span>
                    <p>Select an exam type and class-section to enter marks</p>
                </div>
            )}
        </div>
    );
};

export default TeacherMarks;
