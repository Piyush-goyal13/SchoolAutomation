import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './MyStudents.css';

const MyStudents = () => {
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [filterSection, setFilterSection] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyStudents = async () => {
            try {
                const res = await API.get('/auth/my-students');
                setStudents(res.data.students);
                setSections(res.data.sections);
            } catch (err) {
                console.error('Error fetching students:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyStudents();
    }, []);

    const sortStudents = (list) => {
        return [...list].sort((a, b) => {
            const classA = parseInt(a.class) || 0;
            const classB = parseInt(b.class) || 0;
            if (classA !== classB) return classA - classB;
            return (a.section || '').localeCompare(b.section || '');
        });
    };

    const filteredStudents = sortStudents(
        students.filter(s => {
            const matchesSection = !filterSection || `${s.class}-${s.section}` === filterSection;
            if (!search) return matchesSection;
            const q = search.toLowerCase();
            return matchesSection && (
                s.name.toLowerCase().includes(q) ||
                (s.admissionNumber || '').toLowerCase().includes(q)
            );
        })
    );

    if (loading) return <div className="my-students-loading">Loading students...</div>;

    if (students.length === 0) {
        return (
            <div className="my-students-empty">
                <span className="placeholder-icon">🎓</span>
                <h2>No Students Yet</h2>
                <p>You haven't been assigned to any classes yet. Once the admin creates timetables or assigns you as section incharge, your students will appear here.</p>
            </div>
        );
    }

    return (
        <div className="my-students">
            <div className="section-header">
                <div>
                    <h2>My Students</h2>
                    <p>Students from your classes and section</p>
                </div>
            </div>

            <div className="my-sections-tags">
                {sections.map((s, i) => (
                    <span key={i} className={`section-tag ${s.isIncharge ? 'incharge' : ''}`}>
                        {s.class} - {s.section}
                        {s.isIncharge && <span className="incharge-label">Incharge</span>}
                    </span>
                ))}
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name or admission no..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="filter-group">
                    <label>Section</label>
                    <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                        <option value="">All Sections</option>
                        {sections.map((s, i) => (
                            <option key={i} value={`${s.class}-${s.section}`}>
                                {s.class} - {s.section} {s.isIncharge ? '(Incharge)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <span className="filter-count">{filteredStudents.length} of {students.length} students</span>
            </div>

            <div className="table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Adm. No</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Parent</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student._id} className={student.isIncharge ? 'incharge-row' : ''}>
                                    <td>{student.admissionNumber}</td>
                                    <td className="bold-text">{student.name}</td>
                                    <td>{student.class}</td>
                                    <td>{student.section}</td>
                                    <td>{student.parentName}</td>
                                    <td>{student.parentContact}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                    No students match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyStudents;
