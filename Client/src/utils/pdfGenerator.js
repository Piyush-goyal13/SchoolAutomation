import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SCHOOL_NAME = 'TechVeda School';
const SCHOOL_TAGLINE = 'Excellence in Education';

const addHeader = (doc) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(SCHOOL_NAME, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(SCHOOL_TAGLINE, 105, 23, { align: 'center' });
    doc.setTextColor(0, 0, 0);
};

const addFooter = (doc) => {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated document. No signature required.', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 105, pageHeight - 10, { align: 'center' });
};

// Report Card PDF
export const generateReportCard = (studentName, className, section, admissionNumber, marks) => {
    const doc = new jsPDF();
    addHeader(doc);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT CARD', 105, 48, { align: 'center' });

    // Student Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoY = 58;
    doc.text(`Student Name: ${studentName}`, 20, infoY);
    doc.text(`Class: ${className} - ${section}`, 20, infoY + 7);
    doc.text(`Admission No: ${admissionNumber}`, 130, infoY);

    // Marks tables per exam
    let currentY = infoY + 20;

    Object.entries(marks).forEach(([examType, subjects]) => {
        if (currentY > 240) {
            doc.addPage();
            addHeader(doc);
            currentY = 45;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(examType, 20, currentY);
        currentY += 5;

        const tableData = subjects.map(s => [
            s.subject,
            String(s.marksObtained),
            String(s.totalMarks),
            `${s.percentage}%`,
            getGrade(s.percentage)
        ]);

        const totalObtained = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
        const totalMax = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
        const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        tableData.push(['Total', String(totalObtained), String(totalMax), `${overallPct}%`, getGrade(overallPct)]);

        autoTable(doc, {
            startY: currentY,
            head: [['Subject', 'Marks', 'Total', '%', 'Grade']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' }
            },
            foot: [],
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [248, 250, 252];
                }
            }
        });

        currentY = doc.lastAutoTable.finalY + 15;
    });

    addFooter(doc);
    doc.save(`ReportCard_${studentName.replace(/\s/g, '_')}.pdf`);
};

// Fee Receipt PDF
export const generateFeeReceipt = (studentName, className, section, admissionNumber, fee) => {
    const doc = new jsPDF();
    addHeader(doc);

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', 105, 48, { align: 'center' });

    // Receipt details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const y = 60;
    doc.text(`Receipt No: TV-${Date.now().toString().slice(-8)}`, 20, y);
    doc.text(`Date: ${new Date(fee.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, y);

    // Student info box
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, y + 10, 170, 35, 3, 3);
    doc.text(`Student Name: ${studentName}`, 28, y + 22);
    doc.text(`Class: ${className} - ${section}`, 28, y + 30);
    doc.text(`Admission No: ${admissionNumber}`, 120, y + 22);
    doc.text(`Month: ${MONTHS[fee.month - 1]} ${fee.year}`, 120, y + 30);

    // Fee table
    autoTable(doc, {
        startY: y + 55,
        head: [['Description', 'Amount']],
        body: [
            [`Tuition Fee - ${MONTHS[fee.month - 1]} ${fee.year}`, `₹${fee.totalAmount.toLocaleString()}`],
            ['Amount Paid', `₹${fee.paidAmount.toLocaleString()}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 1: { halign: 'right' } }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (fee.status === 'paid') {
        doc.setTextColor(22, 101, 52);
        doc.text('STATUS: PAID ✓', 20, finalY);
    } else {
        doc.setTextColor(185, 28, 28);
        doc.text(`STATUS: ${fee.status.toUpperCase()}`, 20, finalY);
    }
    doc.setTextColor(0, 0, 0);

    if (fee.remarks) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Remarks: ${fee.remarks}`, 20, finalY + 8);
    }

    addFooter(doc);
    doc.save(`FeeReceipt_${studentName.replace(/\s/g, '_')}_${MONTHS[fee.month - 1]}_${fee.year}.pdf`);
};

// Attendance Report PDF
export const generateAttendanceReport = (studentName, className, section, admissionNumber, summary, records, monthName, year) => {
    const doc = new jsPDF();
    addHeader(doc);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE REPORT', 105, 48, { align: 'center' });

    // Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const y = 58;
    doc.text(`Student: ${studentName}`, 20, y);
    doc.text(`Class: ${className} - ${section}`, 20, y + 7);
    doc.text(`Admission No: ${admissionNumber}`, 130, y);
    doc.text(`Period: ${monthName} ${year}`, 130, y + 7);

    // Summary
    autoTable(doc, {
        startY: y + 18,
        head: [['Total Days', 'Present', 'Absent', 'Late', 'Attendance %']],
        body: [[
            String(summary.totalDays),
            String(summary.presentDays),
            String(summary.absentDays),
            String(summary.lateDays),
            `${summary.percentage}%`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 6, halign: 'center' }
    });

    // Records table
    if (records.length > 0) {
        const tableData = records.map(r => [
            new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            r.day,
            r.status.charAt(0).toUpperCase() + r.status.slice(1)
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Date', 'Day', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 4 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 2) {
                    const status = data.cell.raw.toLowerCase();
                    if (status === 'present') data.cell.styles.textColor = [22, 101, 52];
                    else if (status === 'absent') data.cell.styles.textColor = [185, 28, 28];
                    else if (status === 'late') data.cell.styles.textColor = [161, 98, 7];
                }
            }
        });
    }

    addFooter(doc);
    doc.save(`Attendance_${studentName.replace(/\s/g, '_')}_${monthName}_${year}.pdf`);
};

const getGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 33) return 'D';
    return 'F';
};
