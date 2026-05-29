# 🏫 TechVeda — School Management System

> A full-stack web app that runs an entire school from a single browser tab.

---

## 🤔 What is TechVeda?

Imagine running a school — you have hundreds of students, dozens of teachers, exams every month, fees to collect, attendance to track, and notices to send. Doing all of this manually with registers and spreadsheets is a nightmare.

**TechVeda** solves this. It's a smart school management system where:
- 👨‍💼 **Admins** manage everything from one dashboard
- 👨‍🏫 **Teachers** handle their classes, attendance, marks and exams
- 🎓 **Students** track their progress, pay fees and take live exams

All of it — in one web app, accessible from anywhere.

---

## 🌐 Live App

| | URL |
|---|---|
| 🖥️ Frontend | https://school-automation-gamma.vercel.app |
| ⚙️ Backend API | https://techveda-server.onrender.com/api |

### 🔐 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.com | adminpassword123 |
| Teacher | sarah@school.com | teacher123 |
| Student | rahul@school.com | student123 |

---

## 🧠 The Cool Parts

### ✨ AI-Generated Timetable
The admin doesn't manually assign teachers to periods. Instead, they click one button and the system:
1. Looks at all teachers and their subjects
2. Checks which teachers are already busy in other classes
3. Automatically builds a conflict-free timetable with balanced workload

No double-booking. No manual effort.

### 🤖 AI Exam Generator
Teachers upload a PDF (textbook chapter, notes, anything) and the system:
1. Extracts the text from the PDF
2. Sends it to **Groq AI (LLaMA 3.3)** with a prompt
3. Gets back 10–20 MCQ questions with 4 options each
4. Teacher reviews, edits if needed, sets a date/time and schedules it

At the scheduled time, the exam **automatically goes live** for students. They take it, submit it, and get their score instantly — all auto-graded.

### 💳 Online Fee Payment
Students can pay their monthly fees directly through the app using **Razorpay** (UPI, cards, netbanking). No need to visit the school office.

### 📧 Automatic Email Notifications
The system sends emails automatically when:
- A notice is posted (to all relevant students/teachers)
- Marks are entered (students get their results by email)

---

## 👥 Who Can Do What?

### 👨‍💼 Admin
- Add/edit/remove teachers and students
- Generate timetables with AI
- View attendance of any student
- Generate and track fee payments
- Post notices to the whole school or specific sections

### 👨‍🏫 Teacher
- View their auto-generated personal timetable
- Mark daily attendance for their section
- Enter exam marks for their subject
- Upload a PDF → get AI-generated MCQ exam → schedule it
- Post notices to their section
- View results of their exams

### 🎓 Student
- View attendance with monthly summary
- See class timetable
- Check marks and download report card as PDF
- Take live MCQ exams with a countdown timer
- Pay fees online
- Download fee receipts and attendance reports as PDF

---

## 🛠️ How It's Built

```
TechVeda
├── Frontend (React + Vite)          → What you see in the browser
│   ├── React 19                     → UI components
│   ├── React Router v7              → Page navigation
│   ├── Axios                        → API calls to backend
│   └── jsPDF                        → PDF generation in browser
│
└── Backend (Node.js + Express)      → The brain of the app
    ├── Express 5                    → API server
    ├── MongoDB + Mongoose           → Database
    ├── JWT + bcrypt                 → Login & security
    ├── Nodemailer                   → Email notifications
    ├── Razorpay                     → Payment gateway
    ├── Groq AI (LLaMA 3.3)         → MCQ generation from PDF
    └── pdf2json                     → PDF text extraction
```

---

## 🔄 How a Request Works

Here's what happens when a student logs in:

```
Student types email + password
        ↓
Browser sends POST /api/auth/login
        ↓
Server checks MongoDB for the user
        ↓
bcrypt compares the password hash
        ↓
Server sends back a JWT token
        ↓
Browser stores token in localStorage
        ↓
Every future request includes the token
        ↓
Server verifies token → allows access
```

---

## 🗄️ Database Structure

The app has **9 collections** in MongoDB:

| Collection | What it stores |
|---|---|
| `users` | Login info for all roles |
| `teachers` | Subject, assigned class/section |
| `students` | Class, section, parent info |
| `timetables` | 6-day schedule per class/section |
| `attendances` | Daily present/absent/late records |
| `marks` | Exam scores per student per subject |
| `exams` | AI-generated MCQ exams + submissions |
| `fees` | Monthly fee records + payment status |
| `notices` | Announcements with audience targeting |

---

## 🚀 How to Run Locally

### Backend
```bash
cd Server
npm install
# Create .env with your credentials (see .env.example)
npm start
# Runs on http://localhost:4000
```

### Frontend
```bash
cd Client
npm install
# Create .env with VITE_API_BASE_URL=http://localhost:4000/api
npm run dev
# Runs on http://localhost:5173
```

### Seed the Database
```bash
cd Server
node seed.js
# Creates admin, 10 teachers, 30 students
```

---

## 🔑 Environment Variables

### Server `.env`
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
GROQ_API_KEY=gsk_...
CLIENT_URL=https://your-frontend.vercel.app
```

### Client `.env`
```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## 📦 Deployment

| Service | Platform | Purpose |
|---|---|---|
| Frontend | Vercel | Hosts the React app |
| Backend | Render | Runs the Node.js server |
| Database | MongoDB Atlas | Cloud database |

---

## 💳 Test Payments (Razorpay)

Since this is in test mode, no real money is charged.

| Method | Details |
|---|---|
| UPI | `success@razorpay` |
| Card | `5267 3181 8797 5449` (any expiry, any CVV) |

---

## 📄 License

MIT — free to use, modify and distribute.

---

*Built with ❤️ by the TechVeda team*
