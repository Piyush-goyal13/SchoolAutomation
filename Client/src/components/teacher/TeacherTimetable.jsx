import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherTimetable.css';

const TeacherTimetable = () => {
    const [schedule, setSchedule] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ttRes, slotsRes] = await Promise.all([
                    API.get('/timetable/teacher/me'),
                    API.get('/timetable/slots')
                ]);
                setSchedule(ttRes.data.schedule);
                setSlots(slotsRes.data);
            } catch (err) {
                console.error('Error fetching timetable:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="tt-loading">Loading timetable...</div>;

    const hasAnyPeriod = schedule.some(day =>
        day.periods.some(p => p.subject)
    );

    if (!hasAnyPeriod) {
        return (
            <div className="tt-empty">
                <span className="placeholder-icon">🕐</span>
                <h2>No Timetable Yet</h2>
                <p>You haven't been assigned to any periods yet.</p>
            </div>
        );
    }

    return (
        <div className="teacher-timetable">
            <div className="tt-header">
                <h2>My Timetable</h2>
                <p>Auto-generated from class schedules</p>
            </div>

            <div className="tt-view-wrapper">
                <table className="tt-view-table">
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
                        {schedule.map((dayData) => (
                            <tr key={dayData.day}>
                                <td className="day-cell">{dayData.day}</td>
                                {slots.map((slot, slotIdx) => {
                                    if (slot.type === 'break') {
                                        return <td key={slotIdx} className="break-cell">{slot.label}</td>;
                                    }
                                    const period = dayData.periods.find(p => p.slotNumber === slot.slotNumber);
                                    if (period?.subject) {
                                        return (
                                            <td key={slotIdx} className="view-cell filled">
                                                <span className="cell-subject">{period.subject}</span>
                                                <span className="cell-class">{period.class} - {period.section}</span>
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={slotIdx} className="view-cell free">
                                            <span className="cell-free">Free</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherTimetable;
