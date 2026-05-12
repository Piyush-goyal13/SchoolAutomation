# TechVeda - School Management System

A comprehensive full-stack School Management System with role-based access for Admin, Teachers, and Students.

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, React Router v7, Axios, jsPDF
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
- **Authentication:** JWT (JSON Web Tokens), bcrypt
- **Payments:** Razorpay Integration (Test Mode)
- **Email:** Nodemailer + Gmail
- **PDF Generation:** jsPDF + AutoTable

## ✨ Features

### 👨‍💼 Admin Dashboard
- Manage Teachers & Students (CRUD with search & filters)
- Assign Section Incharge to teachers
- Create & manage Timetables (6 periods + breaks, Mon-Sat)
- View attendance of any student
- Post notices (school-wide, role-specific, or section-specific)
- Fee management (generate monthly/yearly, track payments)
- Change password

### 👨‍🏫 Teacher Dashboard
- View profile with assigned section info
- My Students (from timetable assignments)
- My Section (incharge students)
- Auto-generated timetable from class schedules
- Mark attendance for assigned section
- View student attendance history with summary
- Enter marks by exam type (Unit Tests, Mid Term, Final)
- Post notices to section
- Change password

### 🎓 Student Dashboard
- View profile with section incharge info
- View attendance with monthly summary
- View class timetable
- View marks/grades with report card
- View notices
- Pay fees via Razorpay (test mode)
- Download PDFs (Report Card, Fee Receipt, Attendance Report)
- Change password

### 📧 Email Notifications
- Notice posted → email to relevant audience
- Marks entered → email to students with results

### 💳 Payment Gateway
- Razorpay integration (test mode - no real money)
- Secure server-side verification with HMAC signature
- Academic year based fee structure (April - March)

## 📁 Project Structure

```
SchoolAutomation/
├── Client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/           # Axios instance
│   │   ├── components/    # Reusable components
│   │   │   ├── admin/    # Admin-specific components
│   │   │   ├── teacher/  # Teacher-specific components
│   │   │   ├── student/  # Student-specific components
│   │   │   └── shared/   # Shared components
│   │   ├── pages/        # Dashboard pages
│   │   └── utils/        # PDF generators
│   └── index.html
│
└── Server/                 # Node.js Backend
    ├── config/            # Database configuration
    ├── Controllers/       # Route handlers
    ├── middleware/        # Auth middleware
    ├── models/           # Mongoose schemas
    ├── routes/           # API routes
    ├── utils/            # Email service
    ├── seed.js           # Database seeder
    └── server.js         # Entry point
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account (for email notifications)
- Razorpay account (for payment gateway)

### Backend Setup
```bash
cd Server
npm install
# Create .env file with:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret
# EMAIL_USER=your_gmail
# EMAIL_PASS=your_app_password
# RAZORPAY_KEY_ID=your_key
# RAZORPAY_KEY_SECRET=your_secret
# CLIENT_URL=http://localhost:5173
npm start
```

### Frontend Setup
```bash
cd Client
npm install
# Create .env file with:
# VITE_API_BASE_URL=http://localhost:4000/api
npm run dev
```

### Seed Database
```bash
cd Server
node seed.js
```

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | adminpassword123 |
| Teacher | sarah@school.com | teacher123 |
| Student | rahul@school.com | student123 |

## 💳 Razorpay Test Payment

- UPI: `success@razorpay`
- Card: `5267 3181 8797 5449` (any expiry, any CVV)

## 📄 License

MIT
