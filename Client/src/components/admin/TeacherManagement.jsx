import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './TeacherManagement.css';

const TeacherManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [assigningTeacher, setAssigningTeacher] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        subject: ''
    });
    const [assignData, setAssignData] = useState({ assignedClass: '', assignedSection: '' });
    const [search, setSearch] = useState('');

    const filteredTeachers = teachers.filter(t => {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q);
    });

    const fetchTeachers = async () => {
        try {
            const res = await API.get('/auth/teachers');
            setTeachers(res.data);
        } catch (err) {
            console.error("Error fetching teachers:", err);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const openAddModal = () => {
        setEditingTeacher(null);
        setFormData({ name: '', email: '', password: '', subject: '' });
        setShowModal(true);
    };

    const openEditModal = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({ name: teacher.name, email: teacher.email, password: '', subject: teacher.subject || '' });
        setShowModal(true);
    };

    const openAssignModal = (teacher) => {
        setAssigningTeacher(teacher);
        setAssignData({
            assignedClass: teacher.assignedClass || '',
            assignedSection: teacher.assignedSection || ''
        });
        setShowAssignModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingTeacher) {
                await API.put(`/auth/teachers/${editingTeacher._id}`, {
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject
                });
            } else {
                await API.post('/auth/register', formData);
            }
            setShowModal(false);
            setEditingTeacher(null);
            setFormData({ name: '', email: '', password: '', subject: '' });
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.put(`/auth/teachers/${assigningTeacher._id}/assign`, assignData);
            setShowAssignModal(false);
            setAssigningTeacher(null);
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssignment = async (teacherId) => {
        if (!window.confirm('Remove section incharge assignment?')) return;
        try {
            await API.put(`/auth/teachers/${teacherId}/assign`, { assignedClass: '', assignedSection: '' });
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove assignment");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this teacher?')) return;
        try {
            await API.delete(`/auth/teachers/${id}`);
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    return (
        <div className="teacher-mgmt">
            <div className="section-header">
                <div>
                    <h2>Teacher Directory</h2>
                    <p>Manage and onboard your faculty members</p>
                </div>
                <button className="primary-btn" onClick={openAddModal}>
                    + Add New Teacher
                </button>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name, email or subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="filter-count">{filteredTeachers.length} of {teachers.length} teachers</span>
            </div>

            <div className="table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Section Incharge</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => (
                                <tr key={teacher._id}>
                                    <td className="bold-text">{teacher.name}</td>
                                    <td>{teacher.email}</td>
                                    <td>{teacher.subject}</td>
                                    <td>
                                        {teacher.assignedClass && teacher.assignedSection ? (
                                            <span className="section-badge">
                                                {teacher.assignedClass} - {teacher.assignedSection}
                                                <button className="badge-remove" onClick={() => handleRemoveAssignment(teacher._id)}>×</button>
                                            </span>
                                        ) : (
                                            <button className="text-btn assign" onClick={() => openAssignModal(teacher)}>Assign</button>
                                        )}
                                    </td>
                                    <td>
                                        <button className="text-btn edit" onClick={() => openEditModal(teacher)}>Edit</button>
                                        <button className="text-btn delete" onClick={() => handleDelete(teacher._id)}>Remove</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                    {teachers.length === 0 ? 'No teachers found. Click "Add New Teacher" to begin.' : 'No teachers match your search.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Register/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{editingTeacher ? 'Edit Teacher' : 'Register Teacher'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="e.g. Dr. Sarah Smith" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="sarah@school.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input type="text" placeholder="e.g. Mathematics" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                            </div>
                            {!editingTeacher && (
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => { setShowModal(false); setEditingTeacher(null); }}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Section Modal */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Assign Section Incharge</h3>
                        <p className="assign-subtitle">Assigning to <strong>{assigningTeacher?.name}</strong></p>
                        <form onSubmit={handleAssign}>
                            <div className="form-group">
                                <label>Class</label>
                                <input type="text" placeholder="e.g. 10th" value={assignData.assignedClass} onChange={(e) => setAssignData({ ...assignData, assignedClass: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Section</label>
                                <input type="text" placeholder="e.g. A" value={assignData.assignedSection} onChange={(e) => setAssignData({ ...assignData, assignedSection: e.target.value })} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => { setShowAssignModal(false); setAssigningTeacher(null); }}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? 'Assigning...' : 'Assign Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherManagement;
