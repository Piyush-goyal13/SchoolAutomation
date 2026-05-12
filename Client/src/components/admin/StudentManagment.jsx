import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import './Management.css'; // You can reuse your teacher CSS or create a new one

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        rollNumber: '', grade: '', section: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await API.get('/auth/students'); // Ensure this route exists
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/register', { ...formData, role: 'student' });
            setShowModal(false);
            fetchStudents(); // Refresh list
            setFormData({ name: '', email: '', password: '', rollNumber: '', grade: '', section: '' });
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="mgmt-container">
            <div className="mgmt-header">
                <h2>Student Management</h2>
                <button className="add-btn" onClick={() => setShowModal(true)}>+ Add New Student</button>
            </div>

            <table className="mgmt-table">
                <thead>
                    <tr>
                        <th>Roll No.</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Class</th>
                        <th>Section</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s._id}>
                            <td>{s.rollNumber}</td>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{s.grade}</td>
                            <td>{s.section}</td>
                            <td>
                                <button className="delete-btn">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal Overlay */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Enroll New Student</h3>
                        <form onSubmit={handleSubmit}>
                            <input type="text" placeholder="Full Name" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input type="email" placeholder="Email" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            <input type="password" placeholder="Password" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                            <input type="text" placeholder="Roll Number" onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} required />
                            <input type="text" placeholder="Grade (e.g. 10th)" onChange={e => setFormData({ ...formData, grade: e.target.value })} required />
                            <input type="text" placeholder="Section (e.g. A)" onChange={e => setFormData({ ...formData, section: e.target.value })} required />

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-btn">Save Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;