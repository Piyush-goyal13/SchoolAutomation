const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return transporter;
};

const sendEmail = async (to, subject, html) => {
    const info = await getTransporter().sendMail({
        from: `"TechVeda School" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
    console.log(`📧 Email sent to ${to}`);
    return info;
};

const sendBulkEmails = async (recipients, subject, htmlGenerator) => {
    // Only send to real email addresses (skip fake @school.com in dev)
    const realRecipients = recipients.filter(r => 
        r.email && !r.email.endsWith('@school.com')
    );
    console.log(`📧 Sending to ${realRecipients.length} real emails (skipped ${recipients.length - realRecipients.length} fake)`);
    
    const promises = realRecipients.map(r => {
        const html = typeof htmlGenerator === 'function' ? htmlGenerator(r) : htmlGenerator;
        return sendEmail(r.email, subject, html).catch(err => {
            console.error(`❌ Email failed for ${r.email}:`, err.message);
        });
    });
    await Promise.allSettled(promises);
};

const noticeEmailTemplate = (notice, recipientName) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0f172a; color: white; padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0;">📢 TechVeda School</h2>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #64748b; margin-bottom: 8px;">Hi ${recipientName},</p>
            <h3 style="color: #0f172a; margin-bottom: 12px;">
                ${notice.priority === 'urgent' ? '🔴' : notice.priority === 'important' ? '🟡' : '🔵'} 
                ${notice.title}
            </h3>
            <p style="color: #334155; line-height: 1.6;">${notice.content}</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">
                Posted by ${notice.postedByName} • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
        </div>
    </div>
`;

const marksEmailTemplate = (studentName, subject, examType, marksObtained, totalMarks) => `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0f172a; color: white; padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0;">📊 TechVeda School — Results</h2>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #64748b; margin-bottom: 8px;">Hi ${studentName},</p>
            <h3 style="color: #0f172a; margin-bottom: 16px;">Your ${examType} results are out!</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Subject</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Marks</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Total</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">%</th>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">${subject}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${marksObtained}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${totalMarks}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${Math.round((marksObtained / totalMarks) * 100)}%</td>
                </tr>
            </table>
            <p style="color: #64748b; font-size: 13px;">Log in to your student portal to view all your results.</p>
        </div>
    </div>
`;

module.exports = { sendEmail, sendBulkEmails, noticeEmailTemplate, marksEmailTemplate };
