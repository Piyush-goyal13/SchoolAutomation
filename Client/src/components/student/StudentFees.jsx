import React, { useState, useEffect } from 'react';
import API from '../../api/axious';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import './StudentFees.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Auto-detect current academic year (April = new year starts)
const getCurrentAcademicYear = () => {
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

// Academic year months: Apr(startYear) to Mar(startYear+1)
const getAcademicMonths = (startYear) => [
    { month: 4, year: startYear },
    { month: 5, year: startYear },
    { month: 6, year: startYear },
    { month: 7, year: startYear },
    { month: 8, year: startYear },
    { month: 9, year: startYear },
    { month: 10, year: startYear },
    { month: 11, year: startYear },
    { month: 12, year: startYear },
    { month: 1, year: startYear + 1 },
    { month: 2, year: startYear + 1 },
    { month: 3, year: startYear + 1 }
];

const StudentFees = () => {
    const [tab, setTab] = useState('pay');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);
    const [profile, setProfile] = useState(null);
    const currentAcademicYear = getCurrentAcademicYear();

    const fetchFees = async () => {
        setLoading(true);
        try {
            const [feeRes, profileRes] = await Promise.all([
                API.get('/fees/me'),
                API.get('/students/me')
            ]);
            setData(feeRes.data);
            setProfile(profileRes.data);
        } catch (err) {
            console.error('Error fetching fees:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFees(); }, []);

    const handlePay = async (fee) => {
        setPaying(`${fee.month}-${fee.year}`);
        try {
            // Create Razorpay order
            const orderRes = await API.post('/payment/create-order', { month: fee.month, year: fee.year });
            const { orderId, amount, keyId } = orderRes.data;

            const options = {
                key: keyId,
                amount: amount * 100,
                currency: 'INR',
                name: 'TechVeda School',
                description: `Fee for ${MONTHS[fee.month - 1]} ${fee.year}`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        await API.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            month: fee.month,
                            year: fee.year
                        });
                        alert('Payment successful!');
                        fetchFees();
                    } catch (err) {
                        alert('Payment verification failed. Contact admin.');
                    }
                },
                prefill: {
                    name: localStorage.getItem('userName') || '',
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: () => setPaying(null)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert(err.response?.data?.message || 'Error initiating payment');
            setPaying(null);
        }
    };

    const isPayable = (month, year) => {
        const now = new Date();
        const feeDate = new Date(year, month - 1);
        const currentDate = new Date(now.getFullYear(), now.getMonth());
        return feeDate <= currentDate;
    };

    if (loading) return <div className="sf-loading">Loading fee details...</div>;

    const academicMonths = getAcademicMonths(currentAcademicYear);

    // Map fees to academic year months
    const feeMap = {};
    if (data?.fees) {
        for (const f of data.fees) {
            feeMap[`${f.month}-${f.year}`] = f;
        }
    }

    const unpaidFees = academicMonths
        .map(am => {
            const fee = feeMap[`${am.month}-${am.year}`];
            return fee && fee.status !== 'paid' ? fee : null;
        })
        .filter(Boolean);

    const paidFees = data?.fees.filter(f => f.status === 'paid')
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        }) || [];

    // Calculate summary only for current academic year, up to current month
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth());
    const academicStart = new Date(currentAcademicYear, 3); // April of academic year
    const dueToDate = data?.fees.filter(f => {
        const feeDate = new Date(f.year, f.month - 1);
        return feeDate >= academicStart && feeDate <= currentDate;
    }) || [];
    const totalDueToDate = dueToDate.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaidToDate = dueToDate.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalPendingToDate = totalDueToDate - totalPaidToDate;

    return (
        <div className="student-fees">
            <div className="sf-header">
                <h2>Fee Management</h2>
                <span className="sf-academic-year">Academic Year: Apr {currentAcademicYear} - Mar {currentAcademicYear + 1}</span>
            </div>

            {data && (
                <div className="sf-summary">
                    <div className="sf-card total"><h3>₹{totalDueToDate.toLocaleString()}</h3><p>Total Due (Till Date)</p></div>
                    <div className="sf-card paid"><h3>₹{totalPaidToDate.toLocaleString()}</h3><p>Total Paid</p></div>
                    <div className="sf-card pending"><h3>₹{totalPendingToDate.toLocaleString()}</h3><p>Pending</p></div>
                </div>
            )}

            <div className="sf-tabs">
                <button className={tab === 'pay' ? 'active' : ''} onClick={() => setTab('pay')}>💳 Pay Fees ({unpaidFees.length})</button>
                <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>✅ Payment History ({paidFees.length})</button>
            </div>

            {tab === 'pay' && (
                <div className="sf-table-container">
                    <table className="sf-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpaidFees.length > 0 ? (
                                unpaidFees.map((f) => (
                                    <tr key={`${f.month}-${f.year}`} className={`sf-row ${f.status}`}>
                                        <td className="bold-text">{MONTHS[f.month - 1]} {f.year}</td>
                                        <td>₹{f.totalAmount.toLocaleString()}</td>
                                        <td>
                                            <span className={`sf-status ${f.status}`}>
                                                {f.status === 'partial' ? `Partial (₹${f.paidAmount})` : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td>
                                            {isPayable(f.month, f.year) ? (
                                                <button
                                                    className="sf-pay-btn"
                                                    onClick={() => handlePay(f)}
                                                    disabled={paying === `${f.month}-${f.year}`}
                                                >
                                                    {paying === `${f.month}-${f.year}` ? 'Processing...' : `Pay ₹${(f.totalAmount - f.paidAmount).toLocaleString()}`}
                                                </button>
                                            ) : (
                                                <span className="sf-future">Upcoming</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        🎉 All fees are paid for this academic year!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'history' && (
                <div className="sf-table-container">
                    <table className="sf-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Amount Paid</th>
                                <th>Paid On</th>
                                <th>Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidFees.length > 0 ? (
                                paidFees.map((f) => (
                                    <tr key={`${f.month}-${f.year}`} className="sf-row paid">
                                        <td className="bold-text">{MONTHS[f.month - 1]} {f.year}</td>
                                        <td>₹{f.paidAmount.toLocaleString()}</td>
                                        <td>{f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                                        <td>
                                            <button className="sf-receipt-btn" onClick={() => {
                                                if (profile) generateFeeReceipt(profile.name, profile.class, profile.section, profile.admissionNumber, f);
                                            }}>📄 Receipt</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        No payment history yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentFees;
