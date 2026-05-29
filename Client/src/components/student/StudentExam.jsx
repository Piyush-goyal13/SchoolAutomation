import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/axious';
import './StudentExam.css';

const StudentExam = () => {
    const [liveExams, setLiveExams] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [completedExams, setCompletedExams] = useState([]);
    const [activeExam, setActiveExam] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitted, setSubmitted] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const fetchAll = async () => {
        try {
            const [liveRes, upcomingRes, completedRes] = await Promise.all([
                API.get('/exams/live'),
                API.get('/exams/upcoming'),
                API.get('/exams/completed')
            ]);
            setLiveExams(liveRes.data);
            setUpcomingExams(upcomingRes.data);
            setCompletedExams(completedRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    // Poll for newly live exams every 30s
    useEffect(() => {
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, []);

    const startExam = (exam) => {
        const endTime = new Date(exam.scheduledAt).getTime() + exam.durationMinutes * 60000;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setActiveExam(exam);
        setAnswers(new Array(exam.questions.length).fill(null));
        setTimeLeft(remaining);
        setSubmitted(null);
    };

    useEffect(() => {
        if (!activeExam || submitted) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [activeExam, submitted]);

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit && !window.confirm('Submit exam? You cannot change answers after submission.')) return;
        clearInterval(timerRef.current);
        try {
            const res = await API.post(`/exams/${activeExam._id}/submit`, { answers });
            setSubmitted(res.data);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Error submitting exam');
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) return <div className="se-loading">Loading exams...</div>;

    // Active exam view
    if (activeExam && !submitted) return (
        <div className="se-exam-view">
            <div className="se-exam-topbar">
                <div>
                    <h2>{activeExam.title}</h2>
                    <span>{activeExam.subject} · {activeExam.questions.length} questions</span>
                </div>
                <div className={`se-timer ${timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : ''}`}>
                    ⏱ {formatTime(timeLeft)}
                </div>
            </div>
            <div className="se-progress">
                <div className="se-progress-bar" style={{ width: `${(answers.filter(a => a !== null).length / activeExam.questions.length) * 100}%` }} />
            </div>
            <div className="se-questions">
                {activeExam.questions.map((q, qi) => (
                    <div key={qi} className="se-question-card">
                        <p className="se-q-text"><span className="se-q-num">Q{qi + 1}.</span> {q.question}</p>
                        <div className="se-options">
                            {q.options.map((opt, oi) => (
                                <button
                                    key={oi}
                                    className={`se-option ${answers[qi] === oi ? 'selected' : ''}`}
                                    onClick={() => {
                                        const updated = [...answers];
                                        updated[qi] = oi;
                                        setAnswers(updated);
                                    }}
                                >
                                    <span className="se-opt-label">{String.fromCharCode(65 + oi)}</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="se-submit-bar">
                <span>{answers.filter(a => a !== null).length}/{activeExam.questions.length} answered</span>
                <button className="primary-btn" onClick={() => handleSubmit(false)}>Submit Exam</button>
            </div>
        </div>
    );

    // Result view after submission
    if (activeExam && submitted) return (
        <div className="se-result-view">
            <div className={`se-result-card ${submitted.percentage >= 33 ? 'pass' : 'fail'}`}>
                <div className="se-result-icon">{submitted.percentage >= 33 ? '🎉' : '😔'}</div>
                <h2>{submitted.percentage >= 33 ? 'Well Done!' : 'Better Luck Next Time'}</h2>
                <div className="se-score">{submitted.score} / {submitted.totalMarks}</div>
                <div className="se-pct">{submitted.percentage}%</div>
                <p>{activeExam.title}</p>
                <button className="primary-btn" onClick={() => { setActiveExam(null); setSubmitted(null); }}>Back to Exams</button>
            </div>
        </div>
    );

    // Main list view
    return (
        <div className="se-wrap">
            <div className="se-header">
                <h2>My Exams</h2>
                <p>Live, upcoming and completed exams</p>
            </div>

            {liveExams.length > 0 && (
                <div className="se-section">
                    <h3 className="se-section-title live-title">🔴 Live Now</h3>
                    {liveExams.map(exam => {
                        const endTime = new Date(exam.scheduledAt).getTime() + exam.durationMinutes * 60000;
                        const minsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 60000));
                        return (
                            <div key={exam._id} className="se-card live-card">
                                <div className="se-card-info">
                                    <div className="se-card-title">{exam.title}</div>
                                    <div className="se-card-meta">{exam.subject} · {exam.totalMarks} marks · {exam.durationMinutes} min</div>
                                    <div className="se-card-time">⏱ {minsLeft} min remaining</div>
                                </div>
                                <button className="primary-btn" onClick={() => startExam(exam)}>Start Exam →</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {upcomingExams.length > 0 && (
                <div className="se-section">
                    <h3 className="se-section-title">📅 Upcoming</h3>
                    {upcomingExams.map(exam => (
                        <div key={exam._id} className="se-card">
                            <div className="se-card-info">
                                <div className="se-card-title">{exam.title}</div>
                                <div className="se-card-meta">{exam.subject} · {exam.totalMarks} marks · {exam.durationMinutes} min</div>
                                <div className="se-card-time">🕐 {new Date(exam.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                            <span className="se-badge upcoming">Upcoming</span>
                        </div>
                    ))}
                </div>
            )}

            {completedExams.length > 0 && (
                <div className="se-section">
                    <h3 className="se-section-title">✅ Completed</h3>
                    {completedExams.map(exam => {
                        const g = exam.percentage >= 90 ? 'A+' : exam.percentage >= 80 ? 'A' : exam.percentage >= 70 ? 'B+' : exam.percentage >= 60 ? 'B' : exam.percentage >= 50 ? 'C' : exam.percentage >= 33 ? 'D' : 'F';
                        return (
                            <div key={exam._id} className="se-card">
                                <div className="se-card-info">
                                    <div className="se-card-title">{exam.title}</div>
                                    <div className="se-card-meta">{exam.subject} · {exam.score}/{exam.totalMarks} · {exam.percentage}%</div>
                                </div>
                                <span className={`grade-pill grade-${g.replace('+', 'plus')}`}>{g}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {liveExams.length === 0 && upcomingExams.length === 0 && completedExams.length === 0 && (
                <div className="se-empty">
                    <span className="placeholder-icon">📝</span>
                    <h3>No Exams Yet</h3>
                    <p>Your teacher hasn't scheduled any exams yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentExam;
