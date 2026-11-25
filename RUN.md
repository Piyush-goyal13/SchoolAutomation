# How to Run TechVeda on a New Machine (Windows/Mac/Linux)

A complete step-by-step guide to set up and run this project on a fresh machine — for demo, presentation, or development.

---

## Do I Need to Install Pinecone or Any Vector Database?

**No.** This project does **NOT** use Pinecone, Weaviate, ChromaDB, or any external vector database.

For RAG (Retrieval-Augmented Generation), we use **MongoDB's built-in text search** (`$text` queries with text indexes). Since MongoDB is already the project's database, no additional installation is needed. The knowledge base documents are stored in a regular MongoDB collection with a text index — no vector embeddings, no separate vector store.

---

## Prerequisites

You need only **3 things** installed:

| Tool | Why | Download |
|:---|:---|:---|
| **Node.js** (v18 or above) | Runs the backend server and frontend build | https://nodejs.org (download LTS) |
| **Git** | Clone the repository | https://git-scm.com/downloads |
| **A web browser** | Open the application | Chrome, Edge, Firefox — anything works |

**You do NOT need to install:**
- MongoDB locally (we use MongoDB Atlas — cloud-hosted)
- Python
- Docker
- Pinecone or any vector database
- Any AI model files (we use Groq's cloud API)

---

## Step-by-Step Setup

### Step 1: Install Node.js

**Windows:**
1. Go to https://nodejs.org
2. Download the **LTS** version (green button)
3. Run the installer → click Next through everything → Finish
4. Open **Command Prompt** or **PowerShell** and verify:
   ```
   node --version
   npm --version
   ```
   Both should show version numbers.

**Mac:**
```bash
brew install node
```
Or download from https://nodejs.org

---

### Step 2: Clone the Repository

Open a terminal (Command Prompt / PowerShell on Windows, Terminal on Mac) and run:

```bash
git clone https://github.com/Piyush-goyal13/SchoolAutomation.git
cd SchoolAutomation
```

---

### Step 3: Set Up the Backend

```bash
cd Server
npm install
```

This installs all backend dependencies (Express, Mongoose, JWT, etc.).

Now create the environment file. Create a file called `.env` inside the `Server` folder with this content:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=my_super_secret_school_key_123
EMAIL_USER=techveda271@gmail.com
EMAIL_PASS="your_gmail_app_password_here"
RAZORPAY_KEY_ID=rzp_test_SnK38MdZOCfxAv
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
GROQ_API_KEY=your_groq_api_key_here
```

> **Note:** The `MONGO_URI` points to a shared MongoDB Atlas cluster. If the connection fails, you may need to create your own free cluster at https://cloud.mongodb.com and update the URI.

---

### Step 4: Seed the Database

This populates the database with sample admin, teachers (10), and students (30):

```bash
node seed.js
```

You should see output like:
```
✅ Admin created
✅ Teacher created: Dr. Sarah Smith (Mathematics)
✅ Teacher created: Mr. James Wilson (Physics)
...
✅ Student created: Rahul Kumar (ADM-2025-001)
...
🎉 Seeding complete!
```

---

### Step 5: Start the Backend Server

```bash
node server.js
```

You should see:
```
Server running on port 4000
✅ Connected to MongoDB
```

**Keep this terminal open.** The server must stay running.

---

### Step 6: Set Up the Frontend

Open a **new terminal** (keep the backend terminal running), then:

```bash
cd Client
npm install
```

Create a `.env` file inside the `Client` folder:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npx vite
```

You should see:
```
VITE v8.x.x  ready in XXms
  ➜  Local:   http://localhost:5173/
```

---

### Step 7: Seed the Knowledge Base (for RAG)

Open a **third terminal** and run:

```bash
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@school.com\",\"password\":\"adminpassword123\"}"
```

Copy the `token` value from the response. Then run (replace `YOUR_TOKEN` with the actual token):

```bash
curl -X POST http://localhost:4000/api/knowledge/seed -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json"
```

You should see: `{"message":"Seeded 10 documents into knowledge base"}`

**Alternative (easier):** If `curl` isn't available on Windows, skip this step. Log in as admin in the browser, open the AI Chat, and type "What is the attendance policy?" — if the knowledge base is empty, it will just answer from general knowledge instead of RAG. You can seed it via any API testing tool like Postman.

---

### Step 8: Open the Application

Open your browser and go to: **http://localhost:5173**

---

## Login Credentials

| Role | Email | Password |
|:---|:---|:---|
| **Admin** | admin@school.com | adminpassword123 |
| **Teacher** | sarah@school.com | teacher123 |
| **Student** | rahul@school.com | student123 |

More teacher emails: james@school.com, priya@school.com, ravi@school.com, neha@school.com, amit@school.com

More student emails: ananya@school.com, arjun@school.com, sneha@school.com, karan@school.com

All teachers use password `teacher123`. All students use password `student123`.

---

## What to Demo

### 1. Admin Dashboard
- **Overview** — Shows teacher and student counts
- **Teachers** — Add, edit, delete teachers
- **Students** — Add, edit, delete students with parent info
- **Timetable** — Generate AI-powered conflict-free timetables
- **Attendance** — View attendance across all classes
- **Fees** — Generate fee records, track payments
- **AI Chat** — The full AI agent chatbot (see below)

### 2. Teacher Dashboard
- **My Section** — View assigned students
- **Attendance** — Mark daily attendance
- **Performance** — Enter marks
- **Exams** — Upload PDF → AI generates MCQ → Schedule live exam
- **AI Chat** — Limited to their own section data

### 3. Student Dashboard
- **Profile** — View personal info
- **Attendance** — View attendance percentage
- **Performance** — View marks, download PDF report card
- **Pending Dues** — Pay fees via Razorpay
- **Exams** — Take live MCQ exams with timer
- **AI Chat** — Limited to their own data

### 4. AI Chatbot Demo Script

Login as **Admin** and go to **🤖 AI Chat**. Try these in order:

```
1. "Hi"                                        → General chat (no tools)
2. "How many students are in 10th A?"           → Function calling
3. "What is the attendance policy?"             → RAG
4. "Give me analysis of at-risk students"       → Predictive insights
5. "List all teachers and their subjects"       → Data query
```

Then login as **Student** (rahul@school.com) and try:

```
6. "Show me all teachers"                      → Should REFUSE (role boundary)
7. "What's my attendance?"                      → Shows only their data
8. "What is the exam grading system?"           → RAG works for students too
```

Point out the **badges** at the bottom of each response (🧠 intent, 🔧 tools, 📊 insights, 📚 RAG) to show the AI pipeline.

---

## Troubleshooting

| Problem | Solution |
|:---|:---|
| `npm install` fails | Delete `node_modules` folder and `package-lock.json`, try again |
| "Cannot connect to MongoDB" | Check internet connection. The MongoDB Atlas cluster requires internet access. |
| Chatbot returns "Sorry, I ran into an issue" | Groq API rate limit. Wait 10 seconds and try again. Free tier allows ~15 messages/minute. |
| Port 4000 already in use | Kill the existing process: `npx kill-port 4000` or change the port in Server/.env |
| Port 5173 already in use | Vite will auto-pick the next available port (5174, etc.) |
| "GROQ_API_KEY" error | Make sure the Server/.env file exists with the correct API key |

---

## Project Structure (Quick Reference)

```
SchoolAutomation/
├── Client/                    ← React/Vite frontend
│   ├── src/
│   │   ├── pages/             ← 3 dashboards (Admin, Teacher, Student) + Login
│   │   ├── components/        ← UI components (admin/, teacher/, student/, shared/)
│   │   └── api/axious.js      ← Axios instance with JWT auto-attach
│   ├── .env                   ← VITE_API_BASE_URL
│   └── package.json
│
├── Server/                    ← Express.js backend
│   ├── Controllers/           ← Business logic (10 controllers + chatbot + knowledge)
│   ├── models/                ← MongoDB schemas (10 models + KnowledgeBase + ChatbotLog)
│   ├── routes/                ← API routes (12 route files)
│   ├── middleware/            ← JWT auth + chatbot guard
│   ├── server.js              ← Entry point
│   ├── seed.js                ← Database seeder
│   └── .env                   ← All secrets and config
│
└── Documentation files (.md)
```
