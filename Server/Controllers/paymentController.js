const Razorpay = require('razorpay');
const crypto = require('crypto');
const Fee = require('../models/Fee');

let razorpay = null;

const getRazorpay = () => {
    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpay;
};

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
        const { month, year } = req.body;
        const studentId = req.user._id;

        const fee = await Fee.findOne({ studentId, month: Number(month), year: Number(year) });
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        if (fee.status === 'paid') {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        // Check if payable (current or past month only)
        const now = new Date();
        const feeDate = new Date(year, month - 1);
        const currentDate = new Date(now.getFullYear(), now.getMonth());
        if (feeDate > currentDate) {
            return res.status(400).json({ message: 'Cannot pay fees for future months' });
        }

        const amountDue = fee.totalAmount - fee.paidAmount;

        const order = await getRazorpay().orders.create({
            amount: amountDue * 100, // Razorpay expects paise
            currency: 'INR',
            receipt: `fee_${studentId}_${month}_${year}`,
            notes: {
                studentId: String(studentId),
                month: String(month),
                year: String(year)
            }
        });

        res.status(200).json({
            orderId: order.id,
            amount: amountDue,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

// Verify payment and update fee
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, month, year } = req.body;
        const studentId = req.user._id;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        // Update fee record
        const fee = await Fee.findOne({ studentId, month: Number(month), year: Number(year) });
        if (!fee) {
            return res.status(404).json({ message: 'Fee record not found' });
        }

        fee.paidAmount = fee.totalAmount;
        fee.status = 'paid';
        fee.paidDate = new Date();
        fee.remarks = `Paid via Razorpay (${razorpay_payment_id})`;
        await fee.save();

        res.status(200).json({ message: 'Payment verified and fee updated', fee });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

module.exports = { createOrder, verifyPayment };
