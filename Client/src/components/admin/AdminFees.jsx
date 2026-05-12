import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import './AdminFees.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Get current academic year start (April = new year)
const getCurrentAcademicYear = () => {
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

// Get available months for a given year based on academic year
const getMonthsForYear = (yr) => {
    const academicStart = getCurrentAcademicYear();
    const startYear = academicStart;
    const endYear = academicStart + 1;

    if (Number(yr) === startYear) {
        // April to December
        return MONTHS.map((m, i) => ({ name: m, value: i + 1 })).filter(m => m.value >= 4);
    } else if (Number(yr) === endYear) {
        // January to March
        return MONTHS.map((m, i) => ({ name: m, value: i + 1 })).filter(m => m.value <= 3);
    }
    // For other years show all
    return MONTHS.map((m, i) => ({ name: m, value: i + 1 }));
};

const getAcademicYears = () => {
    const current = getCurrentAcademicYear();
    return [current - 1, current, current + 1];
};

const AdminFees = () => {
    const academicYear = getCurrentAcademicYear();
    const now = new Date();
    const defaultYear = now.getMonth() >= 3 ? String(now.getFullYear()) : String(now.getFullYear());
    const defaultMonth = String(now.getMonth() + 1);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [month, setMonth] = useState(defaultMonth);
    const [year, setYear] = useState(defaultYear);
    const [fees, setFees] = useState([]);
    const [summary, setSummary] = useState(null);
    const [generateAmount, setGenerateAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [paymentData, setPaymentData] = useState({ paidAmount: '', remarks: '' });

    const availableMonths = getMonthsForYear(year);

    // Reset month when year changes if current month isn't valid
    useEffect(() => {
        const valid = availableMonths.find(m => m.value === Number(month));
        if (!valid && availableMonths.length > 0) {
            setMonth(String(availableMonths[0].value));
        }
    }, [year]);

    const fetchFees = async () => {
        if (!selectedClass || !selectedSection) return;
        setLoading(true);
        try {
            const res = await API.get(`/fees/section?class=${selectedClass}&section=${selectedSection}&month=${month}&year=${year}`);
            setFees(res.data);
        } catch (err) {
            console.error('Error fetching fees:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await API.get(`/fees/summary?month=${month}&year=${year}`);
            setSummary(res.data);
        } catch (err) {
            console.error('Error fetching summary:', err);
        }
    };

    useEffect(() => { fetchSummary(); }, [month, year]);
    useEffect(() => { if (selectedClass && selectedSection) fetchFees(); }, [selectedClass, selectedSection, month, year]);

    const handleGenerate = async () => {
        if (!selectedClass || !selectedSection || !generateAmount) {
            alert('Select class, section and enter amount');
            return;
        }
        try {
            await API.post('/fees/generate', {
                class: selectedClass,
                section: selectedSection,
                month: Number(month),
                year: Number(year),
                totalAmount: Number(generateAmount)
            });
            alert('Fees generated successfully!');
            fetchFees();
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Error generating fees');
        }
    };

    const handleGenerateYearly = async () => {
        if (!selectedClass || !selectedSection || !generateAmount) {
            alert('Select class, section and enter amount');
            return;
        }
        if (!window.confirm(`Generate ₹${generateAmount}/month for Apr ${academicYear} - Mar ${academicYear + 1} for ${selectedClass}-${selectedSection}?`)) return;
        try {
            await API.post('/fees/generate-yearly', {
                class: selectedClass,
                section: selectedSection,
                academicYear,
                totalAmount: Number(generateAmount)
            });
            alert(`Yearly fees generated! (Apr ${academicYear} - Mar ${academicYear + 1})`);
            fetchFees();
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Error generating yearly fees');
        }
    };

    const handlePayment = async () => {
        try {
            await API.put('/fees/payment', {
                studentId: editingStudent.studentId,
                month: Number(month),
                year: Number(year),
                paidAmount: Number(paymentData.paidAmount),
                remarks: paymentData.remarks
            });
            setEditingStudent(null);
            setPaymentData({ paidAmount: '', remarks: '' });
            fetchFees();
            fetchSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating payment');
        }
    };

    return (
        <div className="admin-fees">
            <div className="section-header">
                <div>
                    <h2>Fee Management</h2>
                    <p>Academic Year: Apr {academicYear} - Mar {academicYear + 1}</p>
                </div>
            </div>

            <div className="af-controls">
                <div className="filter-group">
                    <label>Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                        {getAcademicYears().map(y => (
                            <option key={y} value={String(y)}>{y}</option>
                        ))}
                        {!getAcademicYears().includes(academicYear + 1) && (
                            <option value={String(academicYear + 1)}>{academicYear + 1}</option>
                        )}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Month</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        {availableMonths.map(m => (
                            <option key={m.value} value={String(m.value)}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Class</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">Select</option>
                        {['10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Section</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                        <option value="">Select</option>
                        {['A', 'B'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {summary && (
                <div className="af-summary">
                    <div className="af-card total"><h4>₹{summary.totalAmount.toLocaleString()}</h4><p>Total Due</p></div>
                    <div className="af-card collected"><h4>₹{summary.collectedAmount.toLocaleString()}</h4><p>Collected</p></div>
                    <div className="af-card pending"><h4>₹{summary.pendingAmount.toLocaleString()}</h4><p>Pending</p></div>
                    <div className="af-card paid-count"><h4>{summary.paidCount}</h4><p>Paid</p></div>
                    <div className="af-card partial-count"><h4>{summary.partialCount}</h4><p>Partial</p></div>
                    <div className="af-card unpaid-count"><h4>{summary.unpaidCount}</h4><p>Unpaid</p></div>
                </div>
            )}

            {selectedClass && selectedSection && (
                <div className="af-generate-bar">
                    <input
                        type="number"
                        placeholder="Monthly fee amount (e.g. 5000)"
                        value={generateAmount}
                        onChange={(e) => setGenerateAmount(e.target.value)}
                    />
                    <button className="primary-btn" onClick={handleGenerate}>
                        Generate for {MONTHS[month - 1]}
                    </button>
                    <button className="secondary-btn" onClick={handleGenerateYearly}>
                        Generate Year (Apr {academicYear} - Mar {academicYear + 1})
                    </button>
                </div>
            )}

            {selectedClass && selectedSection && fees.length > 0 && (
                <div className="af-table-container">
                    <table className="af-table">
                        <thead>
                            <tr>
                                <th>Adm. No</th>
                                <th>Name</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Pending</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map(f => (
                                <tr key={f.studentId} className={`af-row ${f.status}`}>
                                    <td>{f.admissionNumber}</td>
                                    <td className="bold-text">{f.name}</td>
                                    <td>₹{f.totalAmount.toLocaleString()}</td>
                                    <td>₹{f.paidAmount.toLocaleString()}</td>
                                    <td>₹{(f.totalAmount - f.paidAmount).toLocaleString()}</td>
                                    <td><span className={`af-status ${f.status}`}>{f.status}</span></td>
                                    <td>
                                        <button className="text-btn edit" onClick={() => {
                                            setEditingStudent(f);
                                            setPaymentData({ paidAmount: f.paidAmount || '', remarks: f.remarks || '' });
                                        }}>Update</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingStudent && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Update Payment — {editingStudent.name}</h3>
                        <p style={{ color: '#64748b', marginBottom: '20px' }}>Total: ₹{editingStudent.totalAmount}</p>
                        <div className="form-group">
                            <label>Paid Amount</label>
                            <input type="number" value={paymentData.paidAmount} onChange={(e) => setPaymentData({ ...paymentData, paidAmount: e.target.value })} max={editingStudent.totalAmount} />
                        </div>
                        <div className="form-group">
                            <label>Remarks</label>
                            <input type="text" value={paymentData.remarks} onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })} placeholder="e.g. Paid via UPI" />
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setEditingStudent(null)}>Cancel</button>
                            <button className="primary-btn" onClick={handlePayment}>Save Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFees;
