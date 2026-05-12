import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TimetableManagement.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManagement = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [slots, setSlots] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [timetableExists, setTimetableExists] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [slotsRes, teachersRes] = await Promise.all([
                    API.get('/timetable/slots'),
                    API.get('/auth/teachers')
                ]);
                setSlots(slotsRes.data);
                setTeachers(teachersRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    const initEmptySchedule = () => {
        return DAYS.map(day => ({
            day,
            periods: slots.filter(s => s.type === 'class').map(s => ({
                slotNumber: s.slotNumber,
                subject: '',
                teacherId: ''
            }))
        }));
    };

    const fetchTimetable = async () => {
        if (!selectedClass || !selectedSection) return;
        setLoading(true);
        try {
            const res = await API.get(`/timetable?class=${selectedClass}&section=${selectedSection}`);
            if (res.data.exists) {
                setSchedule(res.data.schedule);
                setTimetableExists(true);
            } else {
                setSchedule(initEmptySchedule());
                setTimetableExists(false);
            }
            setEditing(false);
        } catch (err) {
            console.error('Error fetching timetable:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClass && selectedSection && slots.length > 0) {
            fetchTimetable();
        }
    }, [selectedClass, selectedSection, slots]);

    const handlePeriodChange = (dayIndex, slotNumber, field, value) => {
        const updated = [...schedule];
        const period = updated[dayIndex].periods.find(p => p.slotNumber === slotNumber);
        if (period) {
            period[field] = value;
            if (field === 'subject') {
                period.teacherId = '';
            }
            if (field === 'teacherId' && value) {
                const teacher = teachers.find(t => t._id === value);
                if (teacher && !period.subject) {
                    period.subject = teacher.subject;
                }
            }
        }
        setSchedule(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await API.post('/timetable', {
                class: selectedClass,
                section: selectedSection,
                schedule
            });
            setEditing(false);
            setTimetableExists(true);
            alert('Timetable saved successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete timetable for ${selectedClass} - ${selectedSection}?`)) return;
        try {
            await API.delete(`/timetable?class=${selectedClass}&section=${selectedSection}`);
            setSchedule(initEmptySchedule());
            setTimetableExists(false);
            setEditing(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting timetable');
        }
    };

    const getSlotTime = (slotNumber) => {
        const slot = slots.find(s => s.slotNumber === slotNumber && s.type === 'class');
        return slot ? slot.time : '';
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t._id === teacherId);
        return teacher ? teacher.name : '';
    };

    return (
        <div className="timetable-mgmt">
            <div className="section-header">
                <div>
                    <h2>Timetable Management</h2>
                    <p>Create and manage class timetables</p>
                </div>
            </div>

            <div className="tt-selector">
                <div className="filter-group">
                    <label>Class</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {['10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Section</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                        <option value="">Select Section</option>
                        {['A', 'B'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                {selectedClass && selectedSection && (
                    <div className="tt-actions">
                        {!editing ? (
                            <>
                                <button className="primary-btn" onClick={() => setEditing(true)}>
                                    {timetableExists ? 'Edit Timetable' : 'Create Timetable'}
                                </button>
                                {timetableExists && (
                                    <button className="danger-btn" onClick={handleDelete}>Delete</button>
                                )}
                            </>
                        ) : (
                            <>
                                <button className="primary-btn" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Timetable'}
                                </button>
                                <button className="secondary-btn" onClick={() => { fetchTimetable(); setEditing(false); }}>Cancel</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {selectedClass && selectedSection && schedule.length > 0 && (
                <div className="tt-table-wrapper">
                    <table className="tt-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                {slots.map((slot, i) => (
                                    <th key={i} className={slot.type === 'break' ? 'break-header' : ''}>
                                        {slot.type === 'break' ? slot.label : `P${slot.slotNumber}`}
                                        <span className="slot-time">{slot.time}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((dayData, dayIndex) => (
                                <tr key={dayData.day}>
                                    <td className="day-cell">{dayData.day}</td>
                                    {slots.map((slot, slotIdx) => {
                                        if (slot.type === 'break') {
                                            return <td key={slotIdx} className="break-cell">{slot.label}</td>;
                                        }
                                        const period = dayData.periods.find(p => p.slotNumber === slot.slotNumber);
                                        if (editing) {
                                            return (
                                                <td key={slotIdx} className="edit-cell">
                                                    <input
                                                        type="text"
                                                        placeholder="Subject"
                                                        value={period?.subject || ''}
                                                        onChange={(e) => handlePeriodChange(dayIndex, slot.slotNumber, 'subject', e.target.value)}
                                                    />
                                                    <select
                                                        value={period?.teacherId || ''}
                                                        onChange={(e) => handlePeriodChange(dayIndex, slot.slotNumber, 'teacherId', e.target.value)}
                                                    >
                                                        <option value="">Teacher</option>
                                                        {teachers
                                                            .filter(t => !period?.subject || t.subject.toLowerCase() === period.subject.toLowerCase())
                                                            .map(t => (
                                                                <option key={t._id} value={t._id}>{t.name}</option>
                                                            ))}
                                                        {period?.subject && teachers.filter(t => t.subject.toLowerCase() === period.subject.toLowerCase()).length === 0 && (
                                                            <option disabled>No teachers for this subject</option>
                                                        )}
                                                    </select>
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={slotIdx} className="view-cell">
                                                <span className="cell-subject">{period?.subject || '-'}</span>
                                                {period?.teacherId && (
                                                    <span className="cell-teacher">{getTeacherName(period.teacherId)}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedClass && selectedSection && !loading && schedule.length === 0 && (
                <div className="placeholder-view">
                    <span className="placeholder-icon">🕐</span>
                    <h2>No Timetable</h2>
                    <p>Click "Create Timetable" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default TimetableManagement;
