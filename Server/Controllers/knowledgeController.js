const KnowledgeBase = require('../models/KnowledgeBase');

// Admin: Add a document to the knowledge base
const addDocument = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ message: 'Title, content, and category are required' });
        }

        const doc = await KnowledgeBase.create({
            title,
            content,
            category,
            tags: tags || [],
            addedBy: req.user._id
        });

        res.status(201).json({ message: 'Document added to knowledge base', doc });
    } catch (error) {
        res.status(500).json({ message: 'Error adding document', error: error.message });
    }
};

// Get all knowledge base documents
const getDocuments = async (req, res) => {
    try {
        const docs = await KnowledgeBase.find()
            .select('-content')
            .populate('addedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};

// Admin: Delete a document
const deleteDocument = async (req, res) => {
    try {
        const doc = await KnowledgeBase.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.status(200).json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
};

// Seed default school documents (run once)
const seedKnowledgeBase = async (req, res) => {
    try {
        const count = await KnowledgeBase.countDocuments();
        if (count > 0) return res.status(200).json({ message: `Knowledge base already has ${count} documents` });

        const defaultDocs = [
            {
                title: 'School Admission Policy',
                content: 'Admissions are open for classes 10th, 11th, and 12th. The admission process requires submission of previous academic records, transfer certificate, and a registration fee of ₹500. Students must maintain a minimum of 50% aggregate in their previous class. Admission for the new academic session begins in March and closes by April 30. Late admissions may be considered based on seat availability with an additional fee of ₹200. All admissions are subject to document verification and principal approval.',
                category: 'policy',
                tags: ['admission', 'enrollment', 'registration']
            },
            {
                title: 'Fee Structure and Payment Policy',
                content: 'Monthly tuition fee is ₹5000 for all classes. Fee is due by the 10th of each month. Late payment attracts a penalty of ₹100 per week. Payment can be made online via UPI, debit card, credit card, or netbanking through the Razorpay gateway integrated in the student portal. Fee receipts are generated automatically and can be downloaded as PDF. Students with unpaid fees for more than 2 consecutive months may face restrictions on exam participation. Fee concessions are available for merit students (above 90% aggregate) and economically weaker sections upon application to the admin office.',
                category: 'policy',
                tags: ['fee', 'payment', 'tuition', 'penalty']
            },
            {
                title: 'Attendance Policy',
                content: 'Students must maintain a minimum attendance of 75% to be eligible for final examinations. Attendance is marked daily by the class teacher during the first period. Three categories are recorded: Present, Absent, and Late. Students arriving after 9:15 AM are marked Late. Three Late marks in a month are equivalent to one Absent. Students with attendance below 60% will receive a warning notice sent to parents via email. Medical leave requires a doctor certificate submitted within 3 days of returning to school. Attendance records are visible to students and parents through the student portal.',
                category: 'policy',
                tags: ['attendance', 'leave', 'absence', 'punctuality']
            },
            {
                title: 'Examination Rules and Grading System',
                content: 'The school follows a continuous assessment pattern with five exam types: Unit Test 1, Unit Test 2, Unit Test 3, Mid Term, and Final. Unit Tests carry 25 marks each, Mid Term carries 50 marks, and Final carries 100 marks. The grading scale is: A+ (90-100%), A (80-89%), B+ (70-79%), B (60-69%), C (50-59%), and F (below 50%). AI-generated MCQ exams may be conducted online through the student portal with live timer and auto-grading. Students caught using unfair means will receive zero marks and a disciplinary notice. Report cards with all marks can be downloaded as PDF from the student portal.',
                category: 'guideline',
                tags: ['exam', 'grading', 'marks', 'assessment', 'test']
            },
            {
                title: 'Code of Conduct',
                content: 'Students must wear the prescribed school uniform on all working days. Mobile phones are not permitted in classrooms. Students must respect all teachers, staff, and fellow students. Bullying, harassment, or discrimination of any kind will result in strict disciplinary action including suspension. Students must maintain cleanliness in classrooms and common areas. Damage to school property will require compensation from the student. Regular participation in school activities and events is encouraged. Students must carry their ID cards at all times within school premises.',
                category: 'policy',
                tags: ['conduct', 'discipline', 'uniform', 'rules', 'behavior']
            },
            {
                title: 'Academic Calendar Overview',
                content: 'The academic year runs from April to March. First term: April to September. Second term: October to March. Unit Test 1 is conducted in June, Unit Test 2 in August, Mid Term in September, Unit Test 3 in December, and Final exams in February-March. Summer vacation: May 15 to June 30. Diwali break: 1 week in October/November. Winter break: December 25 to January 1. Republic Day, Independence Day, and Gandhi Jayanti are observed as holidays. Parent-Teacher meetings are held quarterly: July, October, January, and April.',
                category: 'general',
                tags: ['calendar', 'schedule', 'holiday', 'vacation', 'term']
            },
            {
                title: 'Timetable and Schedule Policy',
                content: 'School hours are 8:00 AM to 2:30 PM. Each day has 6 periods of 40 minutes each with a lunch break of 30 minutes after the 4th period. The timetable is generated using an AI-powered algorithm that ensures no teacher conflicts and balanced workload distribution. The school operates 6 days a week (Monday to Saturday). Timetables are published at the beginning of each term and can be viewed on the respective dashboards. Any changes to the timetable are communicated via the notice board.',
                category: 'guideline',
                tags: ['timetable', 'schedule', 'period', 'timing']
            },
            {
                title: 'Leave Application Procedure',
                content: 'For planned leave, students must submit a written application signed by their parent/guardian to the class teacher at least 2 days in advance. For medical emergencies, parents should inform the school office by phone on the same day and submit a medical certificate upon return. Leave for more than 3 consecutive days requires approval from the principal. Leave during exam periods is not permitted except for medical emergencies with valid documentation. All leave applications are recorded and affect the attendance percentage visible on the student portal.',
                category: 'procedure',
                tags: ['leave', 'application', 'absence', 'medical']
            },
            {
                title: 'Notice Board and Communication Policy',
                content: 'All official communications are posted through the digital notice board on the TechVeda platform. Notices can be targeted to specific audiences: all users, students only, teachers only, or specific class sections. Priority levels include Normal, Important, and Urgent. Email notifications are automatically sent for Important and Urgent notices. Parents receive email notifications for notices concerning their child class and section. Teachers can post notices for their assigned sections. Only admins can post school-wide notices. Students should check the notice board daily for updates.',
                category: 'procedure',
                tags: ['notice', 'communication', 'announcement', 'email']
            },
            {
                title: 'Online Exam Portal Guide',
                content: 'The TechVeda platform supports AI-generated online MCQ examinations. Teachers upload study material as PDF, and the AI (powered by LLaMA 3.3) automatically generates multiple-choice questions with 4 options each. Teachers can review and edit questions before scheduling. During a live exam, students see a countdown timer and must submit before time expires. Answers are auto-graded instantly and scores are recorded in the marks collection. Students can view their results and correct answers after the exam window closes. Each exam attempt is recorded and cannot be retaken.',
                category: 'guideline',
                tags: ['exam', 'online', 'mcq', 'ai', 'portal']
            }
        ];

        await KnowledgeBase.insertMany(defaultDocs.map(d => ({ ...d, addedBy: req.user._id })));
        res.status(201).json({ message: `Seeded ${defaultDocs.length} documents into knowledge base` });
    } catch (error) {
        res.status(500).json({ message: 'Error seeding knowledge base', error: error.message });
    }
};

module.exports = { addDocument, getDocuments, deleteDocument, seedKnowledgeBase };
