import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './MySection.css';

const MySection = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchSection = async () => {
            try {
                const res = await API.get('/auth/my-section');
                setData(res.data);
            } catch (err) {
                console.error('Error fetching section:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSection();
    }, []);

    if (loading) return <div className="section-loading">Loading section data...</div>;

    if (!data?.assigned) {
        return (
            <div className="no-section">
                <span className="placeholder-icon">🏫</span>
                <h2>No Section Assigned</h2>
                <p>You haven't been assigned as a section incharge yet. Contact your admin.</p>
            </div>
        );
    }

    const filteredStudents = data.students.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.admissionNumber || '').toLowerCase().includes(q);
    });

    return (
        <div className="my-section">
            <div className="section-info-header">
                <div>
                    <h2>My Section — {data.assignedClass} {data.assignedSection}</h2>
                    <p>You are the section incharge • {data.students.length} students</p>
                </div>
            </div>

            <div className="section-search-bar">
                <input
                    type="text"
                    placeholder="Search by name or admission no..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="section-count">{filteredStudents.length} of {data.students.length} students</span>
            </div>

            <div className="section-table-container">
                <table className="section-table">
                    <thead>
                        <tr>
                            <th>Adm. No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Parent</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student._id}>
                                    <td>{student.admissionNumber}</td>
                                    <td className="bold-text">{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>{student.parentName}</td>
                                    <td>{student.parentContact}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                    {data.students.length === 0 ? 'No students in this section yet.' : 'No students match your search.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MySection;
