const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // --- SEED ADMIN ---
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: process.env.ADMIN_NAME || 'Super Admin',
                email: process.env.ADMIN_EMAIL || 'admin@school.com',
                password: process.env.ADMIN_PASSWORD || 'adminpassword123',
                role: 'admin'
            });
            console.log('✅ Admin created');
        } else {
            console.log('⏭️  Admin already exists, skipping');
        }

        // --- SEED TEACHERS ---
        const sampleTeachers = [
            { name: 'Dr. Sarah Smith', email: 'sarah@school.com', password: 'teacher123', subject: 'Mathematics' },
            { name: 'Mr. James Wilson', email: 'james@school.com', password: 'teacher123', subject: 'Physics' },
            { name: 'Ms. Priya Sharma', email: 'priya@school.com', password: 'teacher123', subject: 'English' },
            { name: 'Mr. Ravi Verma', email: 'ravi@school.com', password: 'teacher123', subject: 'Chemistry' },
            { name: 'Mrs. Neha Gupta', email: 'neha@school.com', password: 'teacher123', subject: 'Biology' },
            { name: 'Mr. Amit Joshi', email: 'amit@school.com', password: 'teacher123', subject: 'Computer Science' },
            { name: 'Ms. Kavita Rao', email: 'kavita@school.com', password: 'teacher123', subject: 'History' },
            { name: 'Dr. Sunil Mehta', email: 'sunil@school.com', password: 'teacher123', subject: 'Geography' },
            { name: 'Mrs. Anjali Nair', email: 'anjali@school.com', password: 'teacher123', subject: 'Hindi' },
            { name: 'Mr. David Thomas', email: 'david@school.com', password: 'teacher123', subject: 'Physical Education' }
        ];

        for (const t of sampleTeachers) {
            const exists = await User.findOne({ email: t.email });
            if (exists) {
                // Ensure Teacher profile exists
                const profileExists = await Teacher.findOne({ userId: exists._id });
                if (!profileExists) {
                    await Teacher.create({ userId: exists._id, subject: t.subject });
                    console.log(`🔧 Created missing profile for teacher: ${t.name}`);
                } else {
                    console.log(`⏭️  Teacher ${t.name} already exists, skipping`);
                }
                continue;
            }
            const user = await User.create({ name: t.name, email: t.email, password: t.password, role: 'teacher' });
            await Teacher.create({ userId: user._id, subject: t.subject });
            console.log(`✅ Teacher created: ${t.name} (${t.subject})`);
        }

        // --- SEED STUDENTS ---
        const sampleStudents = [
            { name: 'Rahul Kumar', email: 'rahul@school.com', password: 'student123', admissionNumber: 'ADM-2025-001', class: '10th', section: 'A', parentName: 'Suresh Kumar', parentContact: '9876543210' },
            { name: 'Ananya Patel', email: 'ananya@school.com', password: 'student123', admissionNumber: 'ADM-2025-002', class: '10th', section: 'B', parentName: 'Rajesh Patel', parentContact: '9876543211' },
            { name: 'Arjun Singh', email: 'arjun@school.com', password: 'student123', admissionNumber: 'ADM-2025-003', class: '12th', section: 'A', parentName: 'Vikram Singh', parentContact: '9876543212' },
            { name: 'Sneha Reddy', email: 'sneha@school.com', password: 'student123', admissionNumber: 'ADM-2025-004', class: '10th', section: 'A', parentName: 'Ramesh Reddy', parentContact: '9876543213' },
            { name: 'Karan Malhotra', email: 'karan@school.com', password: 'student123', admissionNumber: 'ADM-2025-005', class: '11th', section: 'B', parentName: 'Deepak Malhotra', parentContact: '9876543214' },
            { name: 'Meera Iyer', email: 'meera@school.com', password: 'student123', admissionNumber: 'ADM-2025-006', class: '12th', section: 'A', parentName: 'Srinivas Iyer', parentContact: '9876543215' },
            { name: 'Rohan Desai', email: 'rohan@school.com', password: 'student123', admissionNumber: 'ADM-2025-007', class: '10th', section: 'B', parentName: 'Mahesh Desai', parentContact: '9876543216' },
            { name: 'Pooja Saxena', email: 'pooja@school.com', password: 'student123', admissionNumber: 'ADM-2025-008', class: '11th', section: 'A', parentName: 'Anil Saxena', parentContact: '9876543217' },
            { name: 'Aditya Chopra', email: 'aditya@school.com', password: 'student123', admissionNumber: 'ADM-2025-009', class: '12th', section: 'B', parentName: 'Rakesh Chopra', parentContact: '9876543218' },
            { name: 'Ishita Bansal', email: 'ishita@school.com', password: 'student123', admissionNumber: 'ADM-2025-010', class: '10th', section: 'A', parentName: 'Vivek Bansal', parentContact: '9876543219' },
            { name: 'Varun Tiwari', email: 'varun@school.com', password: 'student123', admissionNumber: 'ADM-2025-011', class: '11th', section: 'B', parentName: 'Ashok Tiwari', parentContact: '9876543220' },
            { name: 'Nisha Agarwal', email: 'nisha@school.com', password: 'student123', admissionNumber: 'ADM-2025-012', class: '12th', section: 'A', parentName: 'Pankaj Agarwal', parentContact: '9876543221' },
            { name: 'Siddharth Jain', email: 'siddharth@school.com', password: 'student123', admissionNumber: 'ADM-2025-013', class: '10th', section: 'B', parentName: 'Hemant Jain', parentContact: '9876543222' },
            { name: 'Divya Mishra', email: 'divya@school.com', password: 'student123', admissionNumber: 'ADM-2025-014', class: '11th', section: 'A', parentName: 'Rajendra Mishra', parentContact: '9876543223' },
            { name: 'Aman Kapoor', email: 'aman@school.com', password: 'student123', admissionNumber: 'ADM-2025-015', class: '12th', section: 'B', parentName: 'Sanjeev Kapoor', parentContact: '9876543224' },
            { name: 'Tanvi Bhatt', email: 'tanvi@school.com', password: 'student123', admissionNumber: 'ADM-2025-016', class: '10th', section: 'A', parentName: 'Nitin Bhatt', parentContact: '9876543225' },
            { name: 'Harsh Pandey', email: 'harsh@school.com', password: 'student123', admissionNumber: 'ADM-2025-017', class: '10th', section: 'B', parentName: 'Manoj Pandey', parentContact: '9876543226' },
            { name: 'Riya Chauhan', email: 'riya@school.com', password: 'student123', admissionNumber: 'ADM-2025-018', class: '11th', section: 'A', parentName: 'Dinesh Chauhan', parentContact: '9876543227' },
            { name: 'Kunal Srivastava', email: 'kunal@school.com', password: 'student123', admissionNumber: 'ADM-2025-019', class: '11th', section: 'B', parentName: 'Alok Srivastava', parentContact: '9876543228' },
            { name: 'Simran Kaur', email: 'simran@school.com', password: 'student123', admissionNumber: 'ADM-2025-020', class: '12th', section: 'A', parentName: 'Gurpreet Singh', parentContact: '9876543229' },
            { name: 'Yash Goyal', email: 'yash@school.com', password: 'student123', admissionNumber: 'ADM-2025-021', class: '10th', section: 'A', parentName: 'Sanjay Goyal', parentContact: '9876543230' },
            { name: 'Prachi Dubey', email: 'prachi@school.com', password: 'student123', admissionNumber: 'ADM-2025-022', class: '10th', section: 'B', parentName: 'Ramesh Dubey', parentContact: '9876543231' },
            { name: 'Mohit Yadav', email: 'mohit@school.com', password: 'student123', admissionNumber: 'ADM-2025-023', class: '11th', section: 'A', parentName: 'Surender Yadav', parentContact: '9876543232' },
            { name: 'Neha Thakur', email: 'nehathakur@school.com', password: 'student123', admissionNumber: 'ADM-2025-024', class: '11th', section: 'B', parentName: 'Rajat Thakur', parentContact: '9876543233' },
            { name: 'Abhishek Rawat', email: 'abhishek@school.com', password: 'student123', admissionNumber: 'ADM-2025-025', class: '12th', section: 'A', parentName: 'Prakash Rawat', parentContact: '9876543234' },
            { name: 'Sakshi Oberoi', email: 'sakshi@school.com', password: 'student123', admissionNumber: 'ADM-2025-026', class: '12th', section: 'B', parentName: 'Manish Oberoi', parentContact: '9876543235' },
            { name: 'Tushar Bhatia', email: 'tushar@school.com', password: 'student123', admissionNumber: 'ADM-2025-027', class: '10th', section: 'A', parentName: 'Lalit Bhatia', parentContact: '9876543236' },
            { name: 'Ankita Sen', email: 'ankita@school.com', password: 'student123', admissionNumber: 'ADM-2025-028', class: '10th', section: 'B', parentName: 'Debashish Sen', parentContact: '9876543237' },
            { name: 'Gaurav Luthra', email: 'gaurav@school.com', password: 'student123', admissionNumber: 'ADM-2025-029', class: '11th', section: 'A', parentName: 'Harish Luthra', parentContact: '9876543238' },
            { name: 'Shruti Pillai', email: 'shruti@school.com', password: 'student123', admissionNumber: 'ADM-2025-030', class: '12th', section: 'B', parentName: 'Mohan Pillai', parentContact: '9876543239' }
        ];

        for (const s of sampleStudents) {
            const exists = await User.findOne({ email: s.email });
            if (exists) {
                // Ensure Student profile exists
                const profileExists = await Student.findOne({ userId: exists._id });
                if (!profileExists) {
                    await Student.create({
                        userId: exists._id,
                        admissionNumber: s.admissionNumber,
                        class: s.class,
                        section: s.section,
                        parentName: s.parentName,
                        parentContact: s.parentContact
                    });
                    console.log(`🔧 Created missing profile for student: ${s.name}`);
                } else {
                    console.log(`⏭️  Student ${s.name} already exists, skipping`);
                }
                continue;
            }
            const user = await User.create({ name: s.name, email: s.email, password: s.password, role: 'student' });
            await Student.create({
                userId: user._id,
                admissionNumber: s.admissionNumber,
                class: s.class,
                section: s.section,
                parentName: s.parentName,
                parentContact: s.parentContact
            });
            console.log(`✅ Student created: ${s.name} (${s.admissionNumber})`);
        }

        console.log('\n🎉 Seeding complete!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedData();
