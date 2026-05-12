const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Admin: Generate fees for a section (bulk create for a month)
const generateFees = async (req, res) => {
    try {
        const { class: cls, section, month, year, totalAmount } = req.body;

        if (!cls || !section || !month || !year || !totalAmount) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const students = await Student.find({ class: cls, section });
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found in this section' });
        }

        const ops = students.map(s => ({
            updateOne: {
                filter: { studentId: s.userId, month, year },
                update: {
                    $setOnInsert: {
                        class: cls,
                        section,
                        totalAmount,
                        paidAmount: 0,
                        status: 'unpaid',
                        paidDate: null,
                        remarks: ''
                    }
                },
                upsert: true
            }
        }));

        await Fee.bulkWrite(ops);
        res.status(200).json({ message: `Fees generated for ${students.length} students` });
    } catch (error) {
        res.status(500).json({ message: 'Error generating fees', error: error.message });
    }
};

// Admin: Update fee payment for a student
const updateFeePayment = async (req, res) => {
    try {
        const { studentId, month, year, paidAmount, remarks } = req.body;

        const fee = await Fee.findOne({ studentId, month, year });
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        fee.paidAmount = paidAmount;
        fee.remarks = remarks || '';
        if (paidAmount >= fee.totalAmount) {
            fee.status = 'paid';
            fee.paidDate = new Date();
        } else if (paidAmount > 0) {
            fee.status = 'partial';
            fee.paidDate = new Date();
        } else {
            fee.status = 'unpaid';
            fee.paidDate = null;
        }

        await fee.save();
        res.status(200).json({ message: 'Payment updated', fee });
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
};

// Admin: Get fees for a section + month
const getFeesBySection = async (req, res) => {
    try {
        const { class: cls, section, month, year } = req.query;

        if (!cls || !section || !month || !year) {
            return res.status(400).json({ message: 'Class, section, month and year are required' });
        }

        const fees = await Fee.find({ class: cls, section, month: Number(month), year: Number(year) })
            .populate('studentId', 'name');

        const students = await Student.find({ class: cls, section }).populate('userId', 'name');

        const result = students.map(s => {
            const fee = fees.find(f => String(f.studentId?._id || f.studentId) === String(s.userId._id));
            return {
                studentId: s.userId._id,
                name: s.userId.name,
                admissionNumber: s.admissionNumber,
                totalAmount: fee?.totalAmount || 0,
                paidAmount: fee?.paidAmount || 0,
                status: fee?.status || 'not generated',
                paidDate: fee?.paidDate,
                remarks: fee?.remarks || ''
            };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fees', error: error.message });
    }
};

// Admin: Get fee summary across school
const getFeeSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const fees = await Fee.find({ month: Number(month), year: Number(year) });

        const totalStudents = fees.length;
        const totalAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
        const collectedAmount = fees.reduce((sum, f) => sum + f.paidAmount, 0);
        const pendingAmount = totalAmount - collectedAmount;
        const paidCount = fees.filter(f => f.status === 'paid').length;
        const partialCount = fees.filter(f => f.status === 'partial').length;
        const unpaidCount = fees.filter(f => f.status === 'unpaid').length;

        res.status(200).json({
            totalStudents, totalAmount, collectedAmount, pendingAmount,
            paidCount, partialCount, unpaidCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
};

// Teacher: Get fees for their section
const getTeacherSectionFees = async (req, res) => {
    try {
        const { month, year } = req.query;
        const teacher = await Teacher.findOne({ userId: req.user._id });

        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(200).json({ assigned: false, fees: [] });
        }

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const fees = await Fee.find({
            class: teacher.assignedClass,
            section: teacher.assignedSection,
            month: Number(month),
            year: Number(year)
        }).populate('studentId', 'name');

        const students = await Student.find({
            class: teacher.assignedClass,
            section: teacher.assignedSection
        }).populate('userId', 'name');

        const result = students.map(s => {
            const fee = fees.find(f => String(f.studentId?._id || f.studentId) === String(s.userId._id));
            return {
                studentId: s.userId._id,
                name: s.userId.name,
                admissionNumber: s.admissionNumber,
                totalAmount: fee?.totalAmount || 0,
                paidAmount: fee?.paidAmount || 0,
                status: fee?.status || 'not generated',
                remarks: fee?.remarks || ''
            };
        });

        res.status(200).json({
            assigned: true,
            assignedClass: teacher.assignedClass,
            assignedSection: teacher.assignedSection,
            fees: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fees', error: error.message });
    }
};

// Student: Get their own fees
const getMyFees = async (req, res) => {
    try {
        const { year } = req.query;
        const studentId = req.user._id;

        let query = { studentId };
        if (year) query.year = Number(year);

        const fees = await Fee.find(query).sort({ year: -1, month: -1 });

        const totalDue = fees.reduce((sum, f) => sum + f.totalAmount, 0);
        const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
        const totalPending = totalDue - totalPaid;

        res.status(200).json({
            summary: { totalDue, totalPaid, totalPending },
            fees
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fees', error: error.message });
    }
};

// Admin: Generate fees for a section for entire academic year (April to March)
const generateYearlyFees = async (req, res) => {
    try {
        const { class: cls, section, academicYear, totalAmount } = req.body;

        if (!cls || !section || !academicYear || !totalAmount) {
            return res.status(400).json({ message: 'Class, section, academic year and amount are required' });
        }

        const students = await Student.find({ class: cls, section });
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found in this section' });
        }

        // Academic year: April (startYear) to March (startYear + 1)
        const startYear = Number(academicYear);
        const months = [
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

        const ops = [];
        for (const { month, year } of months) {
            for (const s of students) {
                ops.push({
                    updateOne: {
                        filter: { studentId: s.userId, month, year },
                        update: {
                            $setOnInsert: {
                                class: cls,
                                section,
                                totalAmount: Number(totalAmount),
                                paidAmount: 0,
                                status: 'unpaid',
                                paidDate: null,
                                remarks: ''
                            }
                        },
                        upsert: true
                    }
                });
            }
        }

        await Fee.bulkWrite(ops);
        res.status(200).json({ message: `Yearly fees generated for ${students.length} students (Apr ${startYear} - Mar ${startYear + 1})` });
    } catch (error) {
        res.status(500).json({ message: 'Error generating yearly fees', error: error.message });
    }
};

// Student: Pay their own fee (current month or previous unpaid only)
const payMyFee = async (req, res) => {
    try {
        const { month, year } = req.body;
        const studentId = req.user._id;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Check if the fee is for current month or a previous unpaid month
        const feeDate = new Date(year, month - 1);
        const currentDate = new Date(currentYear, currentMonth - 1);

        if (feeDate > currentDate) {
            return res.status(400).json({ message: 'Cannot pay fees for future months' });
        }

        const fee = await Fee.findOne({ studentId, month: Number(month), year: Number(year) });
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (fee.status === 'paid') {
            return res.status(400).json({ message: 'Fee already paid for this month' });
        }

        fee.paidAmount = fee.totalAmount;
        fee.status = 'paid';
        fee.paidDate = new Date();
        fee.remarks = 'Paid by student';
        await fee.save();

        res.status(200).json({ message: 'Fee paid successfully', fee });
    } catch (error) {
        res.status(500).json({ message: 'Error paying fee', error: error.message });
    }
};

module.exports = { generateFees, generateYearlyFees, updateFeePayment, getFeesBySection, getFeeSummary, getTeacherSectionFees, getMyFees, payMyFee };
