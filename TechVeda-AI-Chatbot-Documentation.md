<p align="center">

# AI-Powered Chatbot System — TechVeda

### Complete Technical Documentation

</p>

<br>

---

## Table of Contents

| Sr. No. | Topic |
|:-------:|-------|
| 1 | What is an AI Chatbot and Why Do We Need One? |
| 2 | High-Level Architecture — How the Whole Thing Works |
| 3 | The AI Agent Pipeline — Step by Step |
| 4 | Intent Classification — Understanding What the User Wants |
| 5 | Function Calling / Tool Use — The Agent Decides What Data to Fetch |
| 6 | RAG (Retrieval-Augmented Generation) — Teaching the AI About Our School |
| 7 | Predictive Analytics / Insights Engine — Smart Analysis |
| 8 | Conversation Summarization — Memory Management |
| 9 | Role-Based Access Control — Who Can See What |
| 10 | Technology Stack and APIs Used |
| 11 | File Structure and Code Map |
| 12 | How to Test Each Feature |
| 13 | Interview-Ready Explanation (Plain English) |

<br>

---

<p align="center">

## 1. What is an AI Chatbot and Why Do We Need One?

</p>

### 1.1 What is a Chatbot?

A chatbot is a software program that can have a text-based conversation with a human. You type a question, and it types back an answer — just like chatting with a person, except the "person" is a computer program.

There are two types of chatbots:

| Type | How It Works | Example |
|:---|:---|:---|
| **Rule-Based** | Follows fixed if/else rules. Can only answer pre-programmed questions. | "Type 1 for fees, Type 2 for attendance" |
| **AI-Powered** | Uses a Large Language Model (LLM) to understand natural language and generate human-like responses. Can answer questions it was never explicitly programmed for. | "How many students have unpaid fees this month?" → AI reads the database and answers |

Our chatbot is **AI-powered**. It uses a Large Language Model called **LLaMA** (made by Meta) through a service called **Groq** to understand questions and generate responses.

### 1.2 Why Does a School System Need a Chatbot?

Without a chatbot, the admin has to manually navigate through multiple screens to find answers:
- Go to Student Management → filter by class → count students
- Go to Fees → filter unpaid → scroll through the list
- Go to Attendance → filter by date → check each student

With the chatbot, the admin simply types: **"Which students in 10th A have unpaid fees?"** and gets an instant answer. The chatbot acts as a natural language interface to the entire school database.

### 1.3 What Makes Our Chatbot Different from a Basic API Wrapper?

A basic chatbot just sends the user's question to an AI API and returns the response. Our chatbot is an **AI Agent** — it has a multi-step pipeline that:

1. **Understands** what you're asking (Intent Classification)
2. **Decides** which data to fetch (Tool Selection)
3. **Fetches** only the relevant data from the database (Function Calling)
4. **Analyzes** the data for patterns and risks (Predictive Analytics)
5. **Searches** school documents if needed (RAG)
6. **Remembers** your previous messages efficiently (Conversation Summarization)
7. **Generates** a response using all of the above context (LLM Call)

This is a **7-step AI pipeline**, not a simple API call.

<br>

---

<p align="center">

## 2. High-Level Architecture — How the Whole Thing Works

</p>

### 2.1 The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (Browser)                            │
│         Types: "Which students have low attendance?"         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP POST /api/chatbot/message
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 EXPRESS.JS BACKEND                            │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   STEP 1     │    │   STEP 2     │    │   STEP 3     │  │
│  │   Intent     │───▶│    Tool      │───▶│    Tool      │  │
│  │ Classifier   │    │  Selector    │    │  Executor    │  │
│  │              │    │              │    │  (MongoDB)   │  │
│  │ "data_query" │    │ [attendance] │    │ {results...} │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│                                                  │          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────▼───────┐  │
│  │   STEP 6     │    │   STEP 5     │    │   STEP 4     │  │
│  │  Context     │◀───│ Conversation │◀───│  Insights    │  │
│  │  Assembly    │    │ Summarizer   │    │   Engine     │  │
│  │              │    │              │    │ "2 at risk"  │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
│         │                                                   │
│  ┌──────▼───────┐                                          │
│  │   STEP 7     │    ┌──────────────┐                      │
│  │   Groq AI    │───▶│  Response    │──── HTTP 200 ──────▶ │
│  │  (LLM Call)  │    │  + Metadata  │                      │
│  └──────────────┘    └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 What Happens at Each Step

| Step | Name | What It Does | Uses AI? |
|:---:|:---|:---|:---:|
| 1 | Intent Classifier | Reads the message and categorizes it (data query? policy question? academic?) | No (keywords) |
| 2 | Tool Selector | Based on the intent, picks which database queries to run | No (rules) |
| 3 | Tool Executor | Runs the selected queries against MongoDB in parallel | No (database) |
| 4 | Insights Engine | Analyzes the fetched data to find patterns and risks | No (statistics) |
| 5 | Conversation Summarizer | Compresses old chat history to save token space | No (extractive) |
| 6 | Context Assembly | Combines everything into a structured prompt for the AI | No (string building) |
| 7 | LLM Call | Sends the assembled prompt to Groq AI and gets the response | **Yes** |

**Key insight for interviews:** Only Step 7 uses the AI/LLM. Steps 1–6 are deterministic processing that makes the AI call more efficient and accurate. This is called an **Agentic Architecture** — the AI doesn't do everything; it's assisted by specialized non-AI components.

<br>

---

<p align="center">

## 3. The AI Agent Pipeline — Step by Step

</p>

Let's trace a real example through the entire pipeline.

**User asks:** *"Show me students who are at risk of failing"*

### Step 1 → Intent Classification

The system scans the message for keywords:
- "at risk" → matches the `insights` intent pattern
- Result: **intent = "insights"**

### Step 2 → Tool Selection

For the `insights` intent, the system selects tools that provide data needed for analysis:
- `getAttendanceData` — to check who has low attendance
- `getMarksData` — to check who has low scores
- `getFeesData` — to check fee collection (admin only)
- `getStudentData` — to get student names and details (admin only)

### Step 3 → Tool Execution

All 4 tools run **in parallel** (using `Promise.all`) against MongoDB:
- `getStudentData` → returns 30 students with names, classes, sections
- `getAttendanceData` → returns all attendance records with per-student breakdown
- `getMarksData` → returns all marks with per-exam averages
- `getFeesData` → returns all fee records with paid/unpaid counts

### Step 4 → Insights Engine

The engine analyzes the fetched data and produces:
```
⚠️ [HIGH] Students at Risk — Low Attendance
   2 students below 65%: Rahul Kumar (10th-A, 58%), Sneha Reddy (10th-A, 62%)

⚠️ [MEDIUM] Subjects Needing Attention
   Physics Mid Term: class average 45%

📊 [INFO] Fee Collection Rate
   72% collected (₹108000/₹150000), 8 defaulters
```

### Step 5 → Conversation Summarization

If this is message #12 in the chat, older messages are compressed:
```
Previous discussion: [student, attendance, fees — User asked about: class 10 performance; unpaid fee list; teacher assignments]
```
Only the last 4 messages are kept in full.

### Step 6 → Context Assembly

Everything is combined into a system prompt:
```
You are TechVeda AI Assistant.
Current user: ADMIN
Detected intent: insights

━━━ TOOL RESULTS ━━━
[getStudentData]: [{name: "Rahul Kumar", class: "10th", ...}, ...]
[getAttendanceData]: {stats: {total: 450, present: 380, ...}, perStudent: {...}}
...

━━━ AI INSIGHTS ━━━
⚠️ [HIGH] Students at Risk — Low Attendance: 2 students below 65%
⚠️ [MEDIUM] Subjects Needing Attention: Physics avg 45%
📊 [INFO] Fee Collection: 72%
```

### Step 7 → LLM Call

This assembled prompt (with real data + insights) is sent to Groq AI. The AI reads the data and generates a human-readable response with tables, bullet points, and recommendations.

**The AI doesn't have to figure out the data or do analysis — it just presents what the pipeline already computed.** This makes the response faster, more accurate, and cheaper (fewer tokens).

<br>

---

<p align="center">

## 4. Intent Classification — Understanding What the User Wants

</p>

### 4.1 What is Intent Classification?

When a user sends a message, the system needs to understand **what kind of question** it is before deciding how to answer. This is called Intent Classification — categorizing the user's message into one of several predefined intents.

### 4.2 Our Intent Categories

| Intent | Description | Example Messages | What Happens |
|:---|:---|:---|:---|
| `data_query` | User wants specific data from the database | "How many students?", "List all teachers", "Show fees" | Tools are selected and DB is queried |
| `insights` | User wants analysis, trends, or predictions | "At risk students", "Performance trends", "Comparison" | Tools + Insights Engine are activated |
| `knowledge` | User asks about school policies/rules/procedures | "What is the fee policy?", "Attendance rules" | RAG searches the Knowledge Base |
| `academic` | User asks a general academic/study question | "Explain photosynthesis", "Tips for exam prep" | Direct LLM response (no DB query) |
| `general` | Casual conversation or unmatched queries | "Hi", "Thank you", "Who are you?" | Direct LLM response (no DB query) |

### 4.3 How It Works (Keyword-Based)

The classifier checks the user's message against keyword lists:

```javascript
// Simplified logic:
if (message contains "predict", "risk", "trend", "analysis") → insights
if (message contains "policy", "rule", "guideline", "procedure") → knowledge
if (message contains "how many" + "student") → data_query
if (message contains "explain", "what is", "solve") → academic
else → general
```

### 4.4 Why Keyword-Based Instead of AI-Based?

| Approach | Speed | Cost | Accuracy |
|:---|:---|:---|:---|
| Keyword-based (our approach) | Instant (0ms) | Free | Good for structured queries |
| LLM-based classification | 500ms–2s | Uses API tokens | Better for ambiguous queries |

We chose keyword-based for **zero latency and zero cost**. The code is structured so it can be swapped to LLM-based classification in production with one function change.

<br>

---

<p align="center">

## 5. Function Calling / Tool Use — The Agent Decides What Data to Fetch

</p>

### 5.1 What is Function Calling?

In AI, "Function Calling" (or "Tool Use") means the AI agent can **decide which functions/tools to execute** based on the user's question, rather than the developer hardcoding which data to fetch.

Traditional approach:
```
Every message → Fetch ALL data from ALL tables → Send everything to AI
```

Our approach:
```
"Show me unpaid fees" → Agent selects: [getFeesData] → Fetches ONLY fee data → Sends to AI
"List teachers"       → Agent selects: [getTeacherData] → Fetches ONLY teacher data → Sends to AI
```

This is more efficient (less data transferred, fewer tokens used) and more secure (only relevant data is exposed).

### 5.2 Our Defined Tools

We have **8 tools** the agent can choose from:

| Tool Name | What It Fetches | Who Can Use It |
|:---|:---|:---|
| `getStudentData` | Student names, emails, classes, parent info | Admin only |
| `getTeacherData` | Teacher names, subjects, assignments | Admin only |
| `getAttendanceData` | Attendance records and per-student stats | Admin, Teacher (own section), Student (own) |
| `getFeesData` | Fee records, paid/unpaid summary | Admin, Student (own) |
| `getMarksData` | Marks, averages, toppers | Admin, Teacher (own entries), Student (own) |
| `getExamData` | Exam schedules and submission counts | Admin, Teacher (own), Student (own class) |
| `getNoticeData` | Notices filtered by audience | All roles |
| `searchKnowledge` | School policy documents (RAG) | All roles |

### 5.3 How Tool Selection Works

```
User: "Which students have unpaid fees?"
                    ↓
Intent: data_query
                    ↓
Keyword scan: "student" → getStudentData ✓
              "fee"     → getFeesData ✓
              No match  → getTeacherData ✗ (not selected)
              No match  → getAttendanceData ✗ (not selected)
                    ↓
Selected tools: [getStudentData, getFeesData]
                    ↓
Both execute in parallel against MongoDB
                    ↓
Results passed to LLM for response generation
```

### 5.4 Parallel Execution

Selected tools run **simultaneously** using JavaScript's `Promise.all`:

```javascript
// All selected tools run at the same time, not one after another
const results = await Promise.all(selectedTools.map(tool => tool.execute()));
```

This means fetching 4 tools takes the same time as fetching 1 tool (they all run at once).

<br>

---

<p align="center">

## 6. RAG (Retrieval-Augmented Generation) — Teaching the AI About Our School

</p>

### 6.1 What is RAG?

RAG stands for **Retrieval-Augmented Generation**. It is a technique where:

1. You store documents in a searchable database (the **Knowledge Base**)
2. When a user asks a question, you **retrieve** the most relevant documents
3. You inject those documents into the AI's prompt as context
4. The AI **generates** a response using that context

Without RAG, the AI only knows what it was trained on (general knowledge). With RAG, the AI can answer questions about **your specific school's policies and rules** — things it was never trained on.

### 6.2 How Our RAG System Works

```
User: "What is the attendance policy?"
          │
          ▼
┌──────────────────────┐
│  MongoDB Text Search │  ← Searches title, content, and tags
│  Query: "attendance  │     of all documents in KnowledgeBase
│          policy"     │     collection
└──────────┬───────────┘
           │
           ▼ Returns top 3 matching documents
┌──────────────────────────────────────────┐
│  📄 Attendance Policy                     │
│  "Students must maintain 75% attendance  │
│   to be eligible for final exams..."     │
│                                          │
│  📄 Leave Application Procedure          │
│  "Medical leave requires a doctor        │
│   certificate within 3 days..."          │
└──────────────────────────────────────────┘
           │
           ▼ Injected into the AI prompt
┌──────────────────────────────────────────┐
│  AI reads the school-specific documents  │
│  and generates an accurate answer about  │
│  YOUR school's attendance policy, not    │
│  generic attendance information.         │
└──────────────────────────────────────────┘
```

### 6.3 Our Knowledge Base

We store school documents in a MongoDB collection called `KnowledgeBase` with a **text index** for full-text search:

```javascript
// MongoDB Schema
{
    title: "Attendance Policy",
    content: "Students must maintain 75% attendance...",
    category: "policy",        // policy, syllabus, faq, guideline, procedure, general
    tags: ["attendance", "leave", "absence"],
    addedBy: ObjectId          // Admin who added it
}

// Text index enables searching across title + content + tags
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });
```

### 6.4 Currently Stored Documents

| Document | Category | What It Covers |
|:---|:---|:---|
| School Admission Policy | policy | Admission process, requirements, fees, deadlines |
| Fee Structure and Payment Policy | policy | Monthly fees, penalties, payment methods, concessions |
| Attendance Policy | policy | 75% minimum, late marking, medical leave, warnings |
| Examination Rules and Grading System | guideline | Exam types, grading scale (A+ to F), online exams, unfair means |
| Code of Conduct | policy | Uniform, mobile phones, bullying, ID cards |
| Academic Calendar Overview | general | Term dates, exam schedule, holidays, PTM dates |
| Timetable and Schedule Policy | guideline | School hours, periods, AI timetable generation |
| Leave Application Procedure | procedure | Planned leave, medical leave, approval process |
| Notice Board and Communication Policy | procedure | Digital notices, audience targeting, email notifications |
| Online Exam Portal Guide | guideline | AI exam generation, live exams, auto-grading |

### 6.5 RAG vs. Fine-Tuning — Why We Chose RAG

| Approach | What It Does | Pros | Cons |
|:---|:---|:---|:---|
| **Fine-Tuning** | Retrains the AI model on your data | Deeply learned | Expensive, slow, needs retraining for updates |
| **RAG** | Searches documents at runtime and adds to prompt | Cheap, instant updates, no retraining | Limited by search quality |

RAG is ideal for our use case because school policies change frequently (new fee structure, updated rules), and we need the AI to always use the **latest** version without retraining.

<br>

---

<p align="center">

## 7. Predictive Analytics / Insights Engine — Smart Analysis

</p>

### 7.1 What is Predictive Analytics?

Predictive analytics means using existing data to **identify patterns and predict future outcomes**. Instead of just showing raw numbers, the system tells you what those numbers **mean**.

Raw data: *"Rahul Kumar: 58% attendance, 35 marks in Physics"*
Insight: *"⚠️ Rahul Kumar is AT RISK — low attendance (58%) combined with below-passing marks in Physics. Intervention recommended."*

### 7.2 Our Insights Engine

The Insights Engine runs after the Tool Executor fetches data. It computes 4 types of insights:

### Insight 1: At-Risk Students (Attendance)

```
Logic: If a student's attendance < 65% (and has at least 5 days tracked)
       → Flag as AT RISK with HIGH severity

Example output:
⚠️ [HIGH] Students at Risk — Low Attendance
   - Rahul Kumar (10th-A) — 58%
   - Sneha Reddy (10th-A) — 62%
```

### Insight 2: Weak Subjects (Academic Performance)

```
Logic: If the class average for any subject-exam combination < 50%
       → Flag as NEEDS ATTENTION with MEDIUM severity

Example output:
⚠️ [MEDIUM] Subjects Needing Attention — Low Class Average
   - 12th-A Physics (Mid Term): Average 45%, Lowest 22%
```

### Insight 3: Top Performers

```
Logic: For each exam, identify the student with the highest score

Example output:
📊 [INFO] Top Performers
   - 10th-A Mathematics (Unit Test 1): Topper — Ishita Bansal (92)
   - 10th-B English (Mid Term): Topper — Ananya Patel (88)
```

### Insight 4: Fee Collection Rate

```
Logic: Calculate (paid fees / total fees) × 100
       If < 50% → HIGH severity
       If < 75% → MEDIUM severity

Example output:
📊 [INFO] Fee Collection Rate
   72% collected (₹108000 / ₹150000)
   8 students with pending dues
```

### 7.3 Why This Matters for an Interview

Predictive analytics demonstrates:
- **Data-driven decision making** — not just showing data, but interpreting it
- **Proactive alerts** — identifying problems before they become serious
- **Statistical computation** — averages, percentages, thresholds, rankings
- **Practical value** — an admin can take action based on these insights

<br>

---

<p align="center">

## 8. Conversation Summarization — Memory Management

</p>

### 8.1 The Problem

AI models have a **context window** — a maximum amount of text they can read at once. If a conversation goes on for 20+ messages, sending all of them would:
- Exceed the context window limit
- Waste tokens (= money)
- Slow down the response

### 8.2 Our Solution: Extractive Summarization

When the conversation exceeds 6 messages, we split it:

```
Messages 1-8:  [old messages]  → Compressed into a summary
Messages 9-12: [recent messages] → Kept in full

Summary format:
"Previous discussion covered: student, attendance, fees.
 User asked about: class 10 performance; unpaid fee list; teacher assignments"
```

### 8.3 How It Works

```javascript
// Messages: [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8, msg9, msg10]
//            ───────── older ──────────         ──── recent ────

// Step 1: Extract topics from older messages
topics = ["student", "attendance", "fees"]  // entities mentioned

// Step 2: Extract key questions from older user messages
keyPoints = ["class 10 performance", "unpaid fee list"]

// Step 3: Build summary
summary = "Previous discussion: student, attendance, fees. User asked about: class 10 performance; unpaid fee list"

// Step 4: Send to AI
messages = [
    { role: "system", content: "...system prompt..." },
    { role: "system", content: "Conversation summary: ..." },  // compressed old messages
    { role: "user", content: "msg9" },    // recent messages in full
    { role: "assistant", content: "msg10" },
    { role: "user", content: "new message" }
]
```

### 8.4 Extractive vs. Abstractive Summarization

| Type | How It Works | Our Implementation |
|:---|:---|:---|
| **Extractive** | Pulls out key words and phrases from the original text | ✅ Used (zero latency, free) |
| **Abstractive** | AI rewrites the text in its own words (needs an LLM call) | Mentioned as production upgrade |

We use extractive summarization to avoid an extra LLM API call. In a production system with higher API rate limits, abstractive summarization would produce better results.

<br>

---

<p align="center">

## 9. Role-Based Access Control — Who Can See What

</p>

### 9.1 Why Role-Based Access?

A student should **never** be able to ask the chatbot "Show me all teachers' emails" and get an answer. Access control is enforced at **two levels**:

1. **Tool Level** — Each tool has an `allowedRoles` list. If a student tries to trigger `getTeacherData`, the tool is simply not selected.
2. **Prompt Level** — The system prompt explicitly tells the AI what this role can and cannot see, as a safety net.

### 9.2 Access Matrix

| Data | Admin | Teacher | Student |
|:---|:---:|:---:|:---:|
| All student records (names, emails, parents, contacts) | ✅ | ❌ | ❌ |
| All teacher records (names, emails, subjects) | ✅ | ❌ | ❌ |
| Fee records & payment status | ✅ | ❌ | Own only |
| Attendance (school-wide) | ✅ | Own section | Own only |
| Marks (school-wide) | ✅ | Own entries | Own only |
| Exams | ✅ | Own exams | Own class |
| Notices | All | Teacher notices | Student notices |
| Knowledge Base (school policies) | ✅ | ✅ | ✅ |
| Predictive Insights | ✅ | Limited | ❌ |

### 9.3 How It's Enforced in Code

```javascript
// Tool definition — only admin can access student data
getStudentData: {
    allowedRoles: ['admin'],  // ← Teacher and Student CANNOT trigger this tool
    execute: async () => { ... }
}

// Tool selector — checks role before selecting
if (!tool.allowedRoles.includes(userRole)) {
    continue; // Skip this tool — user doesn't have permission
}

// System prompt — tells AI to refuse if user asks anyway
"You can see ONLY your own data. You CANNOT access other students' data.
 Decline such requests politely."
```

### 9.4 Real Test Results

| Question | As Admin | As Student |
|:---|:---|:---|
| "Show all teachers" | ✅ Lists 10 teachers with details | ❌ "I can only help with your own academic information" |
| "Student fee records" | ✅ Shows full fee breakdown | ✅ Shows only their own fees |
| "What is the attendance policy?" | ✅ RAG retrieves the policy | ✅ Same (knowledge base is shared) |

<br>

---

<p align="center">

## 10. Technology Stack and APIs Used

</p>

### 10.1 AI and NLP

| Technology | Purpose | Why We Chose It |
|:---|:---|:---|
| **Groq API** | Cloud service that hosts AI models | Fastest inference speed for LLMs, free tier available |
| **Qwen 3.8 27B** (by Alibaba) | The Large Language Model that generates responses | Strong multilingual model, good at structured data interpretation |
| **MongoDB Text Search** | Full-text search for RAG retrieval | Already using MongoDB; no extra infrastructure needed |

### 10.2 Backend

| Technology | Purpose |
|:---|:---|
| **Express.js** | REST API server handling chatbot routes |
| **Mongoose** | ODM for querying MongoDB collections (Students, Teachers, etc.) |
| **JWT Authentication** | Verifies user identity and role before chatbot access |

### 10.3 Frontend

| Technology | Purpose |
|:---|:---|
| **React** | Chat UI component with message bubbles, typing indicator |
| **Axios** | HTTP client that sends messages to the chatbot API |

### 10.4 API Flow

```
Frontend (React)
    │
    │  POST /api/chatbot/message
    │  Headers: { Authorization: "Bearer <JWT>" }
    │  Body: { message: "...", history: [...] }
    │
    ▼
Backend (Express.js)
    │
    │  1. JWT middleware verifies token → gets user role
    │  2. Chatbot controller runs the 7-step pipeline
    │  3. Groq API call (single external request)
    │
    ▼
Response
    {
        reply: "Here are the students with low attendance...",
        _meta: {
            intent: "insights",
            toolsUsed: ["getAttendanceData", "getMarksData"],
            insightsGenerated: 2,
            ragUsed: false
        }
    }
```

The `_meta` field is displayed as badges in the chat UI so users can see which AI features were activated for each response.

<br>

---

<p align="center">

## 11. File Structure and Code Map

</p>

### 11.1 Backend Files

```
Server/
├── Controllers/
│   ├── chatbotController.js     ← THE MAIN FILE (AI Agent Pipeline)
│   │   ├── TOOLS definition     (8 tools with execute functions)
│   │   ├── classifyIntent()     (keyword-based intent classifier)
│   │   ├── selectTools()        (picks tools based on intent + role)
│   │   ├── executeTools()       (runs tools in parallel)
│   │   ├── generateInsights()   (predictive analytics engine)
│   │   ├── summarizeHistory()   (conversation compression)
│   │   ├── buildSystemPrompt()  (context assembly)
│   │   ├── callGroq()           (LLM API call with retry)
│   │   └── sendMessage()        (main handler — orchestrates pipeline)
│   │
│   └── knowledgeController.js   ← Knowledge Base CRUD + Seed
│       ├── addDocument()
│       ├── getDocuments()
│       ├── deleteDocument()
│       └── seedKnowledgeBase()  (10 default school policy documents)
│
├── models/
│   └── KnowledgeBase.js         ← MongoDB schema with text index
│
├── routes/
│   ├── chatbotRoutes.js         ← POST /api/chatbot/message
│   └── knowledgeRoutes.js       ← CRUD /api/knowledge + /api/knowledge/seed
│
└── server.js                    ← Route registration
```

### 11.2 Frontend Files

```
Client/src/components/shared/
├── Chatbot.jsx                  ← Chat UI component
│   ├── Role-aware greetings     (different welcome message per role)
│   ├── Message rendering        (markdown formatting)
│   ├── Pipeline metadata badges (shows intent, tools, RAG in each response)
│   └── Typing indicator         (animated dots while AI is thinking)
│
└── Chatbot.css                  ← Chat styling (message bubbles, colors)
```

### 11.3 Integration Points

```
AdminDashboard.jsx    → imports Chatbot → "🤖 AI Chat" tab
TeacherDashboard.jsx  → imports Chatbot → "🤖 AI Chat" tab
StudentDashboard.jsx  → imports Chatbot → "🤖 AI Chat" tab
```

<br>

---

<p align="center">

## 12. How to Test Each Feature

</p>

### 12.1 Setup

1. Start the backend: `cd Server && node server.js`
2. Start the frontend: `cd Client && npx vite`
3. Open `http://localhost:5173`
4. Login as admin: `admin@school.com` / `adminpassword123`
5. Seed knowledge base (one-time): Go to AI Chat and the knowledge base should be seeded via API

### 12.2 Test Cases

| Feature | What to Type | Expected Result |
|:---|:---|:---|
| **Intent Classification** | "Hi" | General response (no tools used) |
| **Function Calling** | "How many students are in 10th A?" | Shows student count + names (uses `getStudentData` tool) |
| **RAG** | "What is the fee policy?" | Returns school-specific fee policy from knowledge base |
| **Predictive Insights** | "Give me an analysis of at-risk students" | Shows students with low attendance, weak subjects, fee rates |
| **Role Boundary** | Login as student → "Show all teachers" | Politely refuses (no access) |
| **Conversation Memory** | Ask 5+ questions, then ask "What did we discuss?" | References earlier topics |
| **Metadata Badges** | Any question | Bottom of response shows: `🧠 intent • 🔧 tools • 📊 insights • 📚 RAG` |

### 12.3 Verifying the Pipeline

Each response includes a `_meta` object displayed as badges. Check these to verify which pipeline steps were activated:

```
🧠 data_query  — Intent was correctly classified
🔧 2 tool(s)   — 2 database tools were called
📊 1 insight(s) — 1 predictive insight was generated
📚 RAG          — Knowledge base was searched
```

<br>

---

<p align="center">

## 13. Interview-Ready Explanation (Plain English)

</p>

### "Tell me about the AI chatbot in your project."

> "We built an AI-powered chatbot for our school management system that goes beyond a simple API wrapper. It's an **agentic architecture** with a 7-step pipeline.

> When a user sends a message, the system first **classifies the intent** — is this a data query, a policy question, or a general academic question? Based on that, it **selects which database tools to execute**. We have 8 defined tools — things like getStudentData, getFeesData, getAttendanceData — and the agent picks only the ones relevant to the question. This is the **function calling** pattern that modern AI agents use.

> The tools execute in parallel against MongoDB, and then our **insights engine** analyzes the results — it identifies at-risk students based on attendance thresholds, flags subjects with low class averages, and calculates fee collection rates. These are **predictive analytics** computed from real data.

> We also implemented **RAG — Retrieval-Augmented Generation**. School policies, exam rules, and procedures are stored in a MongoDB collection with a text index. When someone asks about a policy, we search the knowledge base, retrieve the relevant documents, and inject them into the AI's context. This way the AI answers about *our specific school's* rules, not generic information.

> Finally, we have **conversation summarization** that compresses older messages to stay within the LLM's context window, and **role-based access control** where the admin sees everything, teachers see only their section, and students see only their own data — enforced at both the tool level and the prompt level.

> The only external AI call is the final response generation using Groq's API with the Qwen model. Everything else — classification, tool selection, data fetching, insights, summarization — is deterministic processing that makes the AI call more efficient and accurate."

### "Why didn't you use vector embeddings for RAG?"

> "We used MongoDB's built-in text search instead of a vector database like Pinecone or Weaviate. For our document count (10-50 school policy documents), full-text search with MongoDB's text index gives us good retrieval quality without adding infrastructure complexity. In a production system with thousands of documents, we'd switch to vector embeddings with cosine similarity search. The architecture supports that swap — just replace the `searchKnowledge` tool's execute function."

### "Why keyword-based intent classification instead of an LLM?"

> "Two reasons: latency and cost. Keyword classification is instant (0ms) and free. Using the LLM for classification would add 500ms-2 seconds and consume tokens. Our keyword patterns cover the structured queries our users typically ask. The code is designed so it's a one-function swap to LLM-based classification when API rate limits aren't a constraint."

<br>

---

<p align="center">

**TechVeda School Automation System — AI Chatbot Documentation**

**Built with:** Groq AI, Qwen 3.8 27B, MongoDB, Express.js, React

</p>
