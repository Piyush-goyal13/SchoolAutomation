<p align="center">

# TechVeda — School Automation System
### Complete Project Documentation

</p>

---

## Table of Contents

| # | Section |
|:-:|---------|
| 1 | Project Overview |
| 2 | System Architecture |
| 3 | Technology Stack — What We Used and Why |
| 4 | Authentication and Security |
| 5 | AI & GenAI Concepts Used |
| 6 | RAG — How It Works in This Project |
| 7 | The AI Agent Pipeline — Complete Breakdown |
| 8 | Observability — Monitoring the AI System |
| 9 | Trade-offs and Design Decisions |
| 10 | API Reference |
| 11 | Database Schema |
| 12 | Frontend Architecture |

---

## 1. Project Overview

TechVeda is a full-stack school automation system with three role-based portals (Admin, Teacher, Student) and an AI-powered chatbot that serves as a natural language interface to the entire school database.

### What the System Does

| Module | Description |
|:---|:---|
| Student & Teacher Management | CRUD operations for student and teacher records |
| AI Timetable Generation | Algorithmic conflict-free scheduling across classes |
| AI Exam Generation | Upload PDF → LLM generates MCQ questions → Live exams with auto-grading |
| Attendance Tracking | Daily attendance marking by teachers, viewing by students |
| Marks Management | Enter marks by subject/exam type, view performance |
| Fee Management & Payments | Generate fee records, pay online via Razorpay |
| Notice Board | Audience-targeted notices with email notifications |
| AI Chatbot | Natural language interface with RAG, function calling, predictive analytics |

---

## 2. System Architecture

### 2.1 Layered Architecture

```
┌──────────────────────────────────────────────────────────┐
│               FRONTEND — React/Vite SPA                   │
│   Login | Admin Dashboard | Teacher Dashboard | Student   │
│                   Dashboard                               │
└────────────────────────┬─────────────────────────────────┘
                         │  REST API (Axios + JWT)
                         ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND — Express.js REST API                 │
│                                                           │
│  Auth │ Teachers │ Students │ Timetable │ Attendance      │
│  Marks │ Exams │ Fees │ Payment │ Notices │ Chatbot       │
│  Knowledge Base │ Chatbot Analytics                       │
│                                                           │
│  Middleware: JWT Auth → Role Authorization → Chatbot Guard│
└──────┬──────────┬───────────┬──────────┬─────────────────┘
       │          │           │          │
       ▼          ▼           ▼          ▼
   MongoDB    Groq AI     Razorpay   Gmail SMTP
    Atlas    (LLM API)   (Payments)  (Emails)
```

### 2.2 How Components Communicate

The frontend is a **Single Page Application (SPA)** — it loads once and communicates with the backend entirely through REST API calls. The backend is **stateless** — every request must include a JWT token for authentication. The backend communicates with 4 external services: MongoDB Atlas (database), Groq AI (LLM), Razorpay (payments), and Gmail SMTP (emails).

---

## 3. Technology Stack — What We Used and Why

### 3.1 Frontend

| Technology | What It Does | Why This Instead of Alternatives |
|:---|:---|:---|
| **React 19** | UI library for building interactive interfaces | Most popular frontend library with the largest ecosystem. Alternatives (Vue, Angular) would work but React has more community resources and hiring demand. |
| **Vite 8** | Build tool and dev server | 10-50x faster than Create React App (CRA) or Webpack. CRA is deprecated. Vite uses native ES modules for instant hot reload. |
| **React Router DOM 7** | Client-side routing | The standard routing library for React. Alternatives like TanStack Router exist but React Router has universal adoption. |
| **Axios** | HTTP client for API calls | Cleaner API than native `fetch()`. Automatic JSON parsing, interceptors for attaching JWT tokens, better error handling. We could use `fetch()` but Axios interceptors make token management simpler. |
| **jsPDF + AutoTable** | Client-side PDF generation | Generates report cards, fee receipts, and attendance reports in the browser without a server roundtrip. Alternative: server-side PDF with Puppeteer — heavier, slower, requires headless browser. |
| **Lucide React** | Icon library | Lightweight tree-shakeable icons. Alternative: FontAwesome — larger bundle size. |

### 3.2 Backend

| Technology | What It Does | Why This Instead of Alternatives |
|:---|:---|:---|
| **Express.js 5** | Web framework for REST APIs | Minimal, unopinionated, fastest to build with. Alternatives: Fastify (faster but smaller ecosystem), NestJS (more structured but heavier learning curve), Hapi (less popular). |
| **Mongoose 9** | ODM (Object Data Modeling) for MongoDB | Schema validation, population (joins), middleware hooks, type casting. Alternative: raw MongoDB driver — more verbose, no schema enforcement. |
| **jsonwebtoken** | JWT token creation and verification | Industry standard for stateless API authentication. Alternative: session-based auth (requires server memory, doesn't scale as well for SPAs). |
| **bcryptjs** | Password hashing | Secure one-way hashing with salt. Alternative: argon2 (slightly more secure but requires native compilation). bcryptjs is pure JavaScript — works everywhere. |
| **multer** | File upload handling | Handles multipart form data for PDF uploads in exam generation. Standard Express file upload middleware. |
| **pdf2json** | PDF text extraction | Extracts text from uploaded PDFs for AI exam generation. Alternative: pdf-parse — similar but pdf2json handles more PDF formats. |
| **Nodemailer** | Email sending | Sends automated notifications for notices and marks. Uses Gmail SMTP. Alternative: SendGrid, Mailgun — require paid accounts for production volume. |
| **Razorpay SDK** | Payment processing | Indian payment gateway supporting UPI, cards, netbanking. Alternative: Stripe — more global but less popular for Indian school payments. Razorpay has better UPI support. |

### 3.3 AI and GenAI

| Technology | What It Does | Why This Instead of Alternatives |
|:---|:---|:---|
| **Groq API** | Hosts and runs the LLM | Fastest LLM inference available (up to 10x faster than OpenAI). Free tier available. Alternative: OpenAI API — slower, more expensive, but GPT-4 is more capable. We prioritized speed and cost for a school project. |
| **Qwen 3.8 27B** | The Large Language Model | Strong reasoning model available on Groq's free tier. Alternative: LLaMA 3.3 70B (was our first choice but got deprecated on Groq), GPT-4 (expensive), Claude (expensive). Qwen 27B balances quality and free-tier availability. |
| **MongoDB Text Search** | RAG retrieval mechanism | Uses MongoDB's built-in `$text` operator with text indexes. Alternative: Pinecone/Weaviate with vector embeddings — better semantic search but requires separate infrastructure, embedding model, and costs money. MongoDB text search is free and already integrated. |

### 3.4 Database

| Technology | What It Does | Why This Instead of Alternatives |
|:---|:---|:---|
| **MongoDB Atlas** | Cloud-hosted NoSQL database | Flexible schema (great for school data with varying structures), free tier with 512MB, managed backups, global access. Alternative: PostgreSQL — better for strict relational data but requires more schema migration work. MongoDB's document model maps naturally to JavaScript objects. |

---

## 4. Authentication and Security

### 4.1 Authentication Flow

```
User enters email + password
        │
        ▼
POST /api/auth/login
        │
        ▼
Backend: Find user by email → Compare password hash (bcrypt)
        │
        ▼ On success
Generate JWT token (contains userId + role, expires in 1 hour)
        │
        ▼
Token returned to frontend → Stored in localStorage
        │
        ▼
Every subsequent API call: Axios interceptor attaches
  "Authorization: Bearer <token>" header automatically
```

### 4.2 Why JWT Instead of NextAuth or Session-Based Auth?

| Approach | How It Works | Fits Our Project? |
|:---|:---|:---|
| **NextAuth** | Authentication library for Next.js | ❌ We use React + Express, not Next.js. NextAuth requires Next.js framework. |
| **Session-based** | Server stores session in memory/DB, client gets a cookie | ❌ Requires server state. Doesn't scale well for SPAs. CORS complications with cookies. |
| **JWT (our choice)** | Stateless token with user info, verified on each request | ✅ Works perfectly with React SPA + Express API. Stateless = no server memory needed. Token carries role info for instant authorization. |

### 4.3 Security Layers (Defense-in-Depth)

The chatbot has **4 layers** of security, each independently preventing unauthorized access:

```
Layer 1: JWT Authentication (authMiddleware.js → protect)
   ↓ Verifies the token is valid and not expired
Layer 2: Role Authorization (authMiddleware.js → authorize)
   ↓ Checks user's role matches the route's allowed roles
Layer 3: Chatbot Guard (chatbotGuard.js)
   ↓ Re-validates role, rate limits (15/min), input sanitization (2000 char max)
Layer 4: Tool-Level Access Control (chatbotController.js → executeTools)
   ↓ Each tool re-checks allowedRoles before executing DB query
Layer 5: Prompt-Level Instructions (system prompt)
   ↓ AI is told to refuse requests outside the user's role scope
```

If any single layer fails, the others still prevent unauthorized access. This is called **defense-in-depth**.

### 4.4 Rate Limiting

The chatbot guard implements per-user rate limiting:
- **15 messages per minute** per user
- Uses an in-memory Map with automatic cleanup
- Returns HTTP 429 with retry-after seconds when exceeded
- Prevents abuse and Groq API token exhaustion

---

## 5. AI & GenAI Concepts Used

### 5.1 Large Language Model (LLM)

**What it is:** A neural network trained on billions of words of text that can understand and generate human language. Think of it as an extremely advanced autocomplete — given some text, it predicts what should come next, but so well that it can answer questions, write essays, analyze data, and reason about problems.

**How we use it:** We send the user's question along with school data to the Groq API, which runs the Qwen 27B model and returns a human-readable response.

**Where in our code:** `Server/Controllers/chatbotController.js` → `callGroq()` function makes the API call.

### 5.2 Prompt Engineering

**What it is:** Crafting the instructions (system prompt) given to the LLM to control its behavior, tone, and output format.

**How we use it:** We build a detailed system prompt that:
- Defines the AI's role ("You are TechVeda AI Assistant")
- Sets the user's role and permissions ("You have FULL access" vs "You can ONLY see your own data")
- Injects real data from database tools
- Injects predictive insights
- Injects RAG-retrieved documents
- Sets formatting rules ("use tables, bullet points, bold")

**Where in our code:** `buildSystemPrompt()` function assembles the prompt dynamically for each request.

### 5.3 RAG (Retrieval-Augmented Generation)

**What it is:** A technique where you retrieve relevant documents from a knowledge base and inject them into the LLM's prompt, so the LLM can answer questions about information it was never trained on.

*See Section 6 for the complete RAG breakdown.*

### 5.4 Function Calling / Tool Use

**What it is:** The AI agent pattern where the system decides which functions (tools) to execute based on the user's question, rather than fetching all data for every query.

**How we use it:** 8 defined tools (getStudentData, getFeesData, etc.) are selected based on intent classification and keyword matching. Only the relevant tools execute, fetching only needed data.

**Where in our code:** `TOOLS` object defines all tools → `selectTools()` picks which ones → `executeTools()` runs them in parallel.

### 5.5 Intent Classification

**What it is:** Categorizing a user's message into predefined intent categories to route it to the appropriate handler.

**How we use it:** Keyword-based classifier routes messages to 5 intents: `data_query`, `knowledge`, `insights`, `academic`, `general`.

**Where in our code:** `classifyIntent()` function with `INTENT_PATTERNS` keyword lists.

### 5.6 Agentic Architecture

**What it is:** Instead of the LLM doing everything, you build an orchestration pipeline where the LLM is just one step among many specialized components (classifier, tools, analytics, retriever, summarizer).

**How we use it:** Our 7-step pipeline where Steps 1-6 are deterministic (no AI) and only Step 7 uses the LLM. This makes the system faster, cheaper, and more controllable.

---

## 6. RAG — How It Works in This Project

### 6.1 The Problem RAG Solves

The LLM (Qwen 27B) was trained on general internet data. It knows about photosynthesis, Newton's laws, and JavaScript. But it does NOT know:
- Our school's attendance policy (75% minimum)
- Our fee structure (₹5000/month)
- Our exam grading system (A+ to F scale)
- Our leave application procedure

Without RAG, if a student asks "What is the attendance policy?", the LLM would give a generic answer. With RAG, it gives **our school's specific policy**.

### 6.2 How RAG Works — Step by Step

```
Step 1: STORE (one-time setup)
   School documents (policies, rules, guidelines) are stored
   in the KnowledgeBase MongoDB collection with a TEXT INDEX
   on title + content + tags fields.

Step 2: RETRIEVE (every knowledge query)
   When intent = "knowledge", the searchKnowledge tool runs
   a MongoDB $text search to find the top 3 most relevant
   documents matching the user's query.

Step 3: AUGMENT (before LLM call)
   The retrieved documents are injected into the system prompt:
   "━━━ KNOWLEDGE BASE (RAG retrieval) ━━━
    📄 Attendance Policy [policy]:
    Students must maintain 75% attendance..."

Step 4: GENERATE (LLM call)
   The LLM reads the injected documents and generates a
   response that accurately reflects OUR school's policies.
```

### 6.3 Where RAG Is Used in the Code

| File | Function | What It Does |
|:---|:---|:---|
| `Server/models/KnowledgeBase.js` | Schema definition | Defines the document structure with text index |
| `Server/Controllers/knowledgeController.js` | `seedKnowledgeBase()` | Populates 10 default school documents |
| `Server/Controllers/chatbotController.js` | `TOOLS.searchKnowledge.execute()` | Runs MongoDB `$text` search |
| `Server/Controllers/chatbotController.js` | `buildSystemPrompt()` | Injects retrieved docs into the prompt |
| `Server/routes/knowledgeRoutes.js` | CRUD routes | Add, list, delete knowledge base documents |

### 6.4 What Documents Are in the Knowledge Base

| # | Document | Category | Key Information |
|:-:|:---|:---|:---|
| 1 | School Admission Policy | policy | Requirements, deadlines, fees |
| 2 | Fee Structure and Payment Policy | policy | ₹5000/month, penalties, Razorpay payments |
| 3 | Attendance Policy | policy | 75% minimum, late marking, medical leave |
| 4 | Examination Rules and Grading System | guideline | A+ to F scale, online exams, unfair means |
| 5 | Code of Conduct | policy | Uniform, mobile phones, bullying |
| 6 | Academic Calendar | general | Term dates, holidays, PTM schedule |
| 7 | Timetable Policy | guideline | School hours, 6 periods, AI generation |
| 8 | Leave Application Procedure | procedure | Planned leave, medical leave, approval |
| 9 | Notice Board Policy | procedure | Digital notices, audience targeting, emails |
| 10 | Online Exam Portal Guide | guideline | AI exam generation, live exams, auto-grading |

### 6.5 MongoDB Text Search vs. Vector Search (Trade-off)

| Feature | MongoDB Text Search (ours) | Vector Search (Pinecone, etc.) |
|:---|:---|:---|
| **How it matches** | Keyword matching with stemming | Semantic similarity via embeddings |
| **Setup complexity** | Zero — built into MongoDB | Needs embedding model + vector DB |
| **Cost** | Free | Embedding API costs + vector DB hosting |
| **Quality for exact terms** | Excellent | Excellent |
| **Quality for paraphrased queries** | Moderate | Excellent |
| **Infrastructure** | None additional | Pinecone/Weaviate + embedding service |
| **Our document count** | ~10-50 documents | Overkill for this scale |

**Our decision:** MongoDB text search is sufficient for ~10-50 school documents where users ask fairly direct questions ("What is the fee policy?"). For 1000+ documents or highly varied queries, vector search would be worth the added complexity.

---

## 7. The AI Agent Pipeline — Complete Breakdown

### 7.1 Pipeline Overview

```
User Message → Intent Classification → Tool Selection → Tool Execution
→ Insights Engine → RAG Retrieval → Conversation Summarization
→ Context Assembly → LLM Call → Response + Metadata
```

### 7.2 Each Step Explained

| Step | Component | AI? | Latency | Purpose |
|:---:|:---|:---:|:---:|:---|
| 1 | Intent Classifier | No | 0ms | Categorize the question (data/knowledge/academic/etc.) |
| 2 | Tool Selector | No | 0ms | Pick which DB queries to run |
| 3 | Tool Executor | No | 50-200ms | Run selected MongoDB queries in parallel |
| 4 | Insights Engine | No | 1-5ms | Compute at-risk students, weak subjects, fee rates |
| 5 | RAG Retriever | No | 20-50ms | Search knowledge base for relevant documents |
| 6 | Conversation Summarizer | No | 0ms | Compress old messages to save tokens |
| 7 | Context Assembler | No | 0ms | Build the system prompt with all results |
| 8 | LLM Call (Groq) | **Yes** | 500-2000ms | Generate human-readable response |

**Total typical response time: 600-2500ms** (the LLM call dominates)

### 7.3 Why Only 1 AI Call?

We could use the LLM for intent classification (better accuracy) or for conversation summarization (better summaries). But each additional LLM call:
- Adds 500-2000ms latency
- Costs API tokens
- Risk hitting rate limits (Groq free tier: ~1000 output tokens/minute)

By making Steps 1-7 deterministic, we get a fast, cheap, predictable pipeline with only 1 external API call.

---

## 8. Observability — Monitoring the AI System

### 8.1 What is Observability?

Observability means being able to understand what's happening inside your system by examining its outputs — logs, metrics, and traces. For an AI chatbot, this means knowing: who asked what, which intent was classified, which tools ran, how long it took, and what errors occurred.

### 8.2 What We Track

Every chatbot message is logged to the `ChatbotLog` MongoDB collection:

| Field | What It Records |
|:---|:---|
| `userId` / `userName` / `role` | Who sent the message |
| `message` | What they asked |
| `intent` | How it was classified (data_query, knowledge, etc.) |
| `toolsUsed` | Which database tools were executed |
| `insightsGenerated` | How many predictive insights were computed |
| `ragUsed` | Whether knowledge base was searched |
| `responseTimeMs` | End-to-end response time in milliseconds |
| `tokensUsed` | How many LLM tokens were consumed |
| `success` / `error` | Whether the request succeeded or failed |
| `createdAt` | Timestamp |

### 8.3 Console Logging

Every request also prints a structured log line to the server console:

```
[CHATBOT] admin:Super Admin | intent=data_query | tools=[getStudentData] | insights=0 | rag=false | 908ms | 1198 tokens
```

### 8.4 Analytics Endpoint

`GET /api/chatbot/analytics` (admin only) returns aggregated metrics:

```json
{
    "overview": {
        "totalMessages": 150,
        "messagesLast24h": 23,
        "ragQueries": 18,
        "avgResponseTimeMs": 1200,
        "maxResponseTimeMs": 4500
    },
    "intentDistribution": [
        { "_id": "data_query", "count": 65 },
        { "_id": "knowledge", "count": 42 },
        { "_id": "insights", "count": 28 }
    ],
    "roleDistribution": [
        { "_id": "admin", "count": 80 },
        { "_id": "student", "count": 50 }
    ],
    "toolUsage": [
        { "_id": "getStudentData", "count": 55 },
        { "_id": "searchKnowledge", "count": 42 }
    ],
    "recentErrors": [...]
}
```

### 8.5 Security Logging

The chatbot guard middleware logs security events:

```
[CHATBOT GUARD] Rate limited user 6a7b8c... (16 requests in window)
[CHATBOT GUARD] Blocked request — invalid role: hacker
```

---

## 9. Trade-offs and Design Decisions

### 9.1 Architecture Trade-offs

| Decision | What We Chose | Alternative | Why We Chose This |
|:---|:---|:---|:---|
| Frontend framework | React SPA + Vite | Next.js (SSR) | Don't need SSR for a dashboard app. SPA is simpler, Vite is faster. |
| API architecture | REST | GraphQL | REST is simpler for CRUD-heavy operations. GraphQL adds complexity without clear benefit for our use case. |
| Database | MongoDB (NoSQL) | PostgreSQL (SQL) | Flexible schema fits varying school data. Document model maps naturally to JSON/JavaScript. |
| Auth mechanism | JWT tokens | Session cookies | Stateless, works across origins, carries role info. Better for SPA architecture. |
| File storage | In-memory (multer buffer) | S3/Cloudinary | PDFs are only needed temporarily for text extraction. No need for persistent file storage. |

### 9.2 AI Trade-offs

| Decision | What We Chose | Alternative | Trade-off |
|:---|:---|:---|:---|
| LLM provider | Groq (free tier) | OpenAI GPT-4 | Groq is faster and free but model quality is lower than GPT-4. Acceptable for our use case. |
| RAG retrieval | MongoDB text search | Pinecone + embeddings | Less semantic understanding but zero additional infrastructure. Good enough for <50 structured documents. |
| Intent classification | Keyword-based | LLM-based | Instant and free but misses nuanced queries. Structured for easy swap to LLM-based. |
| Conversation memory | Extractive summarization | LLM abstractive summarization | Lower quality summaries but saves an API call per message. |
| Data injection | Selective (tool-based) | Full dump | More complex code but uses fewer tokens, faster, and more secure. |
| Insights engine | Rule-based thresholds | ML prediction models | Simpler to implement and explain. Real ML would need training data we don't have. |

### 9.3 Security Trade-offs

| Decision | What We Chose | Trade-off |
|:---|:---|:---|
| Token storage | localStorage | Vulnerable to XSS but simpler than httpOnly cookies with CORS. Acceptable for a school management tool, not for banking. |
| Rate limiting | In-memory Map | Resets on server restart. For production, use Redis. Sufficient for demo/presentation. |
| Password hashing | bcryptjs (10 rounds) | 10 rounds is a balance between security and login speed. 12+ rounds for high-security systems. |

---

## 10. API Reference

### 10.1 Authentication
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | /api/auth/login | Public | Login with email + password |
| PUT | /api/auth/change-password | All roles | Change password |

### 10.2 Teachers
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | /api/auth/teachers | Admin | Create teacher |
| GET | /api/auth/teachers | Admin | List all teachers |
| PUT | /api/auth/teachers/:id | Admin | Update teacher |
| DELETE | /api/auth/teachers/:id | Admin | Delete teacher |

### 10.3 Students
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | /api/students | Admin | Create student |
| GET | /api/students | Admin, Teacher | List students |
| PUT | /api/students/:id | Admin | Update student |
| DELETE | /api/students/:id | Admin | Delete student |

### 10.4 Chatbot
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | /api/chatbot/message | All roles | Send a message to the AI chatbot |
| GET | /api/chatbot/analytics | Admin | View chatbot usage analytics |

### 10.5 Knowledge Base
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | /api/knowledge | Admin | Add a document |
| GET | /api/knowledge | All roles | List documents |
| DELETE | /api/knowledge/:id | Admin | Delete a document |
| POST | /api/knowledge/seed | Admin | Seed default documents |

### 10.6 Other Endpoints
| Module | Base Path | Key Operations |
|:---|:---|:---|
| Timetable | /api/timetable | CRUD + AI generation + teacher view |
| Attendance | /api/attendance | Mark + retrieve by student/class/date |
| Marks | /api/marks | Enter + retrieve by student/class/exam |
| Exams | /api/exams | AI generate + save + live + submit + results |
| Fees | /api/fees | Generate records + retrieve + update status |
| Payments | /api/payment | Razorpay order creation + verification |
| Notices | /api/notices | Create + retrieve (audience-filtered) + delete |

---

## 11. Database Schema

### 11.1 Collections

| Collection | Documents | Purpose |
|:---|:---|:---|
| users | Admin, Teacher, Student accounts | Authentication + identity |
| teachers | Teacher profiles linked to users | Subject, assigned class/section |
| students | Student profiles linked to users | Class, section, parent info |
| timetables | Class timetable schedules | 6 days × 6 periods per class/section |
| attendances | Daily attendance records | Per-student, per-day status |
| marks | Subject marks per exam type | Marks obtained vs total |
| exams | AI-generated MCQ exams | Questions, submissions, scores |
| fees | Monthly fee records | Amount, status (paid/unpaid/partial) |
| notices | Announcements | Audience-targeted with priority |
| knowledgebases | School policy documents (RAG) | Title, content, category, tags |
| chatbotlogs | Chatbot observability data | Intent, tools, timing, errors |

### 11.2 Key Relationships

All models reference `User._id` as the primary identity. `Student.userId` and `Teacher.userId` extend the User with role-specific data. Attendance, Marks, Fees, and Exam submissions all reference `studentId → User._id`.

---

## 12. Frontend Architecture

### 12.1 Routing

```
/ ..................... Login page
/admin-dashboard ...... Admin portal (protected: admin role only)
/teacher-dashboard .... Teacher portal (protected: teacher role only)
/student-dashboard .... Student portal (protected: student role only)
```

### 12.2 Dashboard Structure

Each dashboard uses the same pattern:
- **State:** `useState('activeTab')` controls which component renders
- **Sidebar:** Navigation buttons with emoji icons, active state highlighting
- **Main area:** `renderContent()` switch statement returns the active component
- **Shared:** `ProtectedRoute` HOC checks JWT + role before rendering

### 12.3 AI Chat Component

The `Chatbot.jsx` shared component:
- Role-aware greeting messages (different welcome for admin/teacher/student)
- Message bubbles with markdown rendering (bold, italic, code, horizontal rules)
- Typing indicator animation while waiting for AI response
- Pipeline metadata badges showing intent, tools used, insights count, RAG flag
- Clear chat button to reset conversation
- Auto-scroll to latest message

---

<p align="center">

**TechVeda School Automation System**

Built with React, Express.js, MongoDB, Groq AI, Razorpay, Nodemailer

</p>
