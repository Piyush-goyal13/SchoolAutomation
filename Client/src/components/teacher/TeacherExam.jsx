import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherExam.css';

const CLASSES = ['10th', '11th', '12th'];
const SECTIONS = ['A', 'B'];

const TeacherExam = () => {
    const [view, setView] = useState('list'); // list | create | preview | results
    const [exams, setExams] = useState([]);
    const [form, setForm] = useState({ title: '', class: '', section: '', scheduledAt: '', durationMinutes: '30', numQuestions: '10' });
    const [pdfFile, setPdfFile] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState(null); // generated exam before saving
    const [saving, setSaving] = useState(false);
    const [resultsExam, setResultsExam] = useState(null);
    const [results, setResults] = useState([]);

    const fetchExams = async () => {
        try {
            const res = await API.get('/exams/my');
            setExams(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchExams(); }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!pdfFile) return alert('Please select a PDF file');
        setGenerating(true);
        try {
            const fd = new FormData();
            fd.append('pdf', pdfFile);
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            const res = await API.post('/exams/generate', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setPreview(res.data);
            setView('preview');
        } catch (err) {
            alert(err.response?.data?.message || 'Error generating exam');
        } finally {
            setGenerating(false);
        }
    };

    const handleQuestionEdit = (qi, field, value) => {
        const updated = { ...preview };
        updated.questions[qi][field] = value;
        setPreview(updated);
    };

    const handleOptionEdit = (qi, oi, value) => {
        const updated = { ...preview };
        updated.questions[qi].options[oi] = value;
        setPreview(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.post('/exams', preview);
            alert('Exam scheduled successfully!');
            setView('list');
            setPreview(null);
            setPdfFile(null);
            setForm({ title: '', class: '', section: '', scheduledAt: '', durationMinutes: '30', numQuestions: '10' });
            fetchExams();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving exam');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this exam?')) return;
        try {
            await API.delete(`/exams/${id}`);
            fetchExams();
        } catch (err) { alert('Error deleting exam'); }
    };

    const handleViewResults = async (exam) => {
        try {
            const res = await API.get(`/exams/${exam._id}/results`);
            setResults(res.data.results);
            setResultsExam(exam);
            setView('results');
        } catch (err) { alert('Error fetching results'); }
    };

    const getStatus = (exam) => {
        const now = new Date();
        const start = new Date(exam.scheduledAt);
        const end = new Date(start.getTime() + exam.durationMinutes * 60000);
        if (now < start) return { label: 'Upcoming', cls: 'status-upcoming' };
        if (now <= end) return { label: 'Live', cls: 'status-live' };
        return { label: 'Ended', cls: 'status-ended' };
    };

    if (view === 'create') return (
        <div className="te-wrap">
            <div className="te-header">
                <div>
                    <h2>Create AI Exam</h2>
                    <p>Upload a PDF and let AI generate MCQ questions</p>
                </div>
                <button className="secondary-btn" onClick={() => setView('list')}>← Back</button>
            </div>
            <form className="te-form" onSubmit={handleGenerate}>
                <div className="te-form-grid">
                    <div className="filter-group">
                        <label>Exam Title</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 3 Quiz" required />
                    </div>
                    <div className="filter-group">
                        <label>Class</label>
                        <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} required>
                            <option value="">Select Class</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Section</label>
                        <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required>
                            <option value="">Select Section</option>
                            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Scheduled Date & Time</label>
                        <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} required />
                    </div>
                    <div className="filter-group">
                        <label>Duration (minutes)</label>
                        <input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} min="5" max="180" required />
                    </div>
                    <div className="filter-group">
                        <label>Number of Questions</label>
                        <input type="number" value={form.numQuestions} onChange={e => setForm({ ...form, numQuestions: e.target.value })} min="3" max="20" required />
                    </div>
                </div>
                <div className="te-upload-area" onClick={() => document.getElementById('pdf-input').click()}>
                    <input id="pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files[0])} />
                    <span className="te-upload-icon">📄</span>
                    <p>{pdfFile ? pdfFile.name : 'Click to upload PDF'}</p>
                    <span>{pdfFile ? `${(pdfFile.size / 1024).toFixed(1)} KB` : 'Max 10MB'}</span>
                </div>
                <button className="ai-btn" type="submit" disabled={generating}>
                    {generating ? '⏳ Generating Questions...' : '✨ Generate MCQ with AI'}
                </button>
            </form>
        </div>
    );

    if (view === 'preview' && preview) return (
        <div className="te-wrap">
            <div className="te-header">
                <div>
                    <h2>Review Questions</h2>
                    <p>{preview.title} · {preview.class}-{preview.section} · {preview.questions.length} questions · {preview.durationMinutes} min</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="secondary-btn" onClick={() => setView('create')}>← Back</button>
                    <button className="primary-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Scheduling...' : '📅 Schedule Exam'}
                    </button>
                </div>
            </div>
            <div className="te-questions">
                {preview.questions.map((q, qi) => (
                    <div key={qi} className="te-question-card">
                        <div className="te-q-num">Q{qi + 1}</div>
                        <input
                            className="te-q-text"
                            value={q.question}
                            onChange={e => handleQuestionEdit(qi, 'question', e.target.value)}
                        />
                        <div className="te-options">
                            {q.options.map((opt, oi) => (
                                <div key={oi} className={`te-option ${q.correctIndex === oi ? 'correct' : ''}`}>
                                    <span className="te-opt-label" onClick={() => handleQuestionEdit(qi, 'correctIndex', oi)}>
                                        {q.correctIndex === oi ? '✅' : '⬜'} {String.fromCharCode(65 + oi)}.
                                    </span>
                                    <input
                                        value={opt}
                                        onChange={e => handleOptionEdit(qi, oi, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="te-hint">Click ⬜ to mark correct answer</p>
                    </div>
                ))}
            </div>
        </div>
    );

    if (view === 'results' && resultsExam) return (
        <div className="te-wrap">
            <div className="te-header">
                <div>
                    <h2>{resultsExam.title} — Results</h2>
                    <p>{results.length} submissions · Total marks: {resultsExam.totalMarks}</p>
                </div>
                <button className="secondary-btn" onClick={() => setView('list')}>← Back</button>
            </div>
            {results.length === 0 ? (
                <div className="te-empty"><p>No submissions yet.</p></div>
            ) : (
                <div className="te-results-table">
                    <table>
                        <thead>
                            <tr><th>#</th><th>Student</th><th>Score</th><th>Percentage</th><th>Grade</th></tr>
                        </thead>
                        <tbody>
                            {results.sort((a, b) => b.score - a.score).map((r, i) => {
                                const g = r.percentage >= 90 ? 'A+' : r.percentage >= 80 ? 'A' : r.percentage >= 70 ? 'B+' : r.percentage >= 60 ? 'B' : r.percentage >= 50 ? 'C' : r.percentage >= 33 ? 'D' : 'F';
                                return (
                                    <tr key={r.studentId} className={r.percentage < 33 ? 'fail-row' : ''}>
                                        <td>{i + 1}</td>
                                        <td className="bold-text">{r.name}</td>
                                        <td>{r.score}/{r.totalMarks}</td>
                                        <td>{r.percentage}%</td>
                                        <td><span className={`grade-pill grade-${g.replace('+', 'plus')}`}>{g}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // List view
    return (
        <div className="te-wrap">
            <div className="te-header">
                <div>
                    <h2>My Exams</h2>
                    <p>Manage AI-generated MCQ exams</p>
                </div>
                <button className="primary-btn" onClick={() => setView('create')}>+ Create Exam</button>
            </div>
            {exams.length === 0 ? (
                <div className="te-empty">
                    <span className="placeholder-icon">📝</span>
                    <h3>No exams yet</h3>
                    <p>Upload a PDF to generate your first AI exam</p>
                </div>
            ) : (
                <div className="te-exam-list">
                    {exams.map(exam => {
                        const status = getStatus(exam);
                        return (
                            <div key={exam._id} className="te-exam-card">
                                <div className="te-exam-info">
                                    <div className="te-exam-title">{exam.title}</div>
                                    <div className="te-exam-meta">
                                        {exam.subject} · {exam.class}-{exam.section} · {exam.totalMarks} marks · {exam.durationMinutes} min
                                    </div>
                                    <div className="te-exam-time">
                                        🕐 {new Date(exam.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                                <div className="te-exam-actions">
                                    <span className={`te-status ${status.cls}`}>{status.label}</span>
                                    <button className="secondary-btn" onClick={() => handleViewResults(exam)}>Results</button>
                                    <button className="danger-btn" onClick={() => handleDelete(exam._id)}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeacherExam;
