import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './StudentManagement.css';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        admissionNumber: '',
        class: '',
        section: '',
        parentName: '',
        parentContact: ''
    });
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [search, setSearch] = useState('');

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
            const matchesFilter = (!filterClass || s.class === filterClass) && (!filterSection || s.section === filterSection);
            if (!search) return matchesFilter;
            const q = search.toLowerCase();
            return matchesFilter && (
                s.name.toLowerCase().includes(q) ||
                (s.admissionNumber || '').toLowerCase().includes(q) ||
                (s.parentName || '').toLowerCase().includes(q) ||
                (s.parentContact || '').includes(q)
            );
        })
    );

    const fetchStudents = async () => {
        try {
            const res = await API.get('/students');
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const openAddModal = () => {
        setEditingStudent(null);
        setFormData({ name: '', email: '', password: '', admissionNumber: '', class: '', section: '', parentName: '', parentContact: '' });
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            password: '',
            admissionNumber: student.admissionNumber || '',
            class: student.class || '',
            section: student.section || '',
            parentName: student.parentName || '',
            parentContact: student.parentContact || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingStudent) {
                await API.put(`/students/${editingStudent._id}`, {
                    name: formData.name,
                    email: formData.email,
                    admissionNumber: formData.admissionNumber,
                    class: formData.class,
                    section: formData.section,
                    parentName: formData.parentName,
                    parentContact: formData.parentContact
                });
            } else {
                await API.post('/students', formData);
            }
            setShowModal(false);
            setEditingStudent(null);
            setFormData({ name: '', email: '', password: '', admissionNumber: '', class: '', section: '', parentName: '', parentContact: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this student?')) return;
        try {
            await API.delete(`/students/${id}`);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    return (
        <div className="student-mgmt">
            <div className="section-header">
                <div>
                    <h2>Student Directory</h2>
                    <p>Manage and enroll your students</p>
                </div>
                <button className="primary-btn" onClick={openAddModal}>
                    + Add New Student
                </button>
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, admission no, parent..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="filter-group">
                    <label>Class</label>
                    <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                        <option value="">All Classes</option>
                        {[...new Set(students.map(s => s.class))].sort().map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Section</label>
                    <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                        <option value="">All Sections</option>
                        {[...new Set(students.map(s => s.section))].sort().map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <span className="filter-count">
                    Showing {filteredStudents.length} of {students.length} students
                </span>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student._id}>
                                    <td>{student.admissionNumber}</td>
                                    <td className="bold-text">{student.name}</td>
                                    <td>{student.class}</td>
                                    <td>{student.section}</td>
                                    <td>{student.parentName}</td>
                                    <td>{student.parentContact}</td>
                                    <td>
                                        <button className="text-btn edit" onClick={() => openEditModal(student)}>Edit</button>
                                        <button className="text-btn delete" onClick={() => handleDelete(student._id)}>Remove</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                    {students.length === 0 ? 'No students found. Click "Add New Student" to begin.' : 'No students match the selected filters.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{editingStudent ? 'Edit Student' : 'Register Student'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="john@school.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Admission Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ADM-2025-001"
                                        value={formData.admissionNumber}
                                        onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Class</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10th"
                                        value={formData.class}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A"
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Parent Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Robert Doe"
                                        value={formData.parentName}
                                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Parent Contact</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9876543210"
                                        value={formData.parentContact}
                                        onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            {!editingStudent && (
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => { setShowModal(false); setEditingStudent(null); }}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? 'Saving...' : editingStudent ? 'Save Changes' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
