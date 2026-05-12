import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './StudentTimetable.css';

const StudentTimetable = () => {
    const [timetable, setTimetable] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const profileRes = await API.get('/students/me');
                const { class: cls, section } = profileRes.data;

                const [ttRes, slotsRes] = await Promise.all([
                    API.get(`/timetable?class=${cls}&section=${section}`),
                    API.get('/timetable/slots')
                ]);

                setSlots(slotsRes.data);
                if (ttRes.data.exists) {
                    setTimetable(ttRes.data);
                }
            } catch (err) {
                console.error('Error fetching timetable:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    if (loading) return <div className="tt-loading">Loading timetable...</div>;

    if (!timetable) {
        return (
            <div className="tt-empty">
                <span className="placeholder-icon">🕐</span>
                <h2>No Timetable Available</h2>
                <p>Your class timetable hasn't been created yet.</p>
            </div>
        );
    }

    return (
        <div className="student-timetable">
            <div className="tt-header">
                <h2>My Timetable — {timetable.class} {timetable.section}</h2>
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
                        {timetable.schedule.map((dayData) => (
                            <tr key={dayData.day}>
                                <td className="day-cell">{dayData.day}</td>
                                {slots.map((slot, slotIdx) => {
                                    if (slot.type === 'break') {
                                        return <td key={slotIdx} className="break-cell">{slot.label}</td>;
                                    }
                                    const period = dayData.periods.find(p => p.slotNumber === slot.slotNumber);
                                    return (
                                        <td key={slotIdx} className="view-cell">
                                            <span className="cell-subject">{period?.subject || '-'}</span>
                                            {period?.teacherId?.name && (
                                                <span className="cell-teacher">{period.teacherId.name}</span>
                                            )}
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

export default StudentTimetable;
