# AI-Powered Resume Builder

An intelligent, web-based resume builder that leverages the Claude AI API to generate professionally worded, ATS-optimised resumes tailored to specific job descriptions. Built as a Final Year Project at the intersection of Natural Language Processing and career technology.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tool Stack & Justification](#tool-stack--justification)
4. [System Requirements](#system-requirements)
5. [Setup Instructions](#setup-instructions)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)

---

## Project Overview

Job seekers lose opportunities not because they lack qualifications, but because their resumes fail to pass Applicant Tracking Systems (ATS) or fail to communicate value clearly. Over 98% of Fortune 500 companies use ATS software to filter resumes before a human ever reads them.

This system addresses that gap by:

- Guiding users through a structured data-collection form
- Using the Claude AI API (claude-sonnet-4-6) to rewrite experience bullet points and generate a professional summary using prompt engineering techniques
- Computing an ATS compatibility score using a weighted keyword-density algorithm
- Matching resume content against a provided job description and surfacing missing keywords
- Rendering the finalised resume into one of three professionally designed templates
- Exporting the completed resume as a PDF or DOCX file

---

## Features

| Feature | Description |
|---|---|
| **User Authentication** | JWT-based register/login with bcrypt password hashing (24-hour token expiry) |
| **Multi-step Resume Builder** | 6-step guided form: Personal Info → Experience → Education → Skills → Certifications → Template |
| **AI Content Generation** | Claude API generates a professional summary, enhanced bullet points, and skills narrative |
| **ATS Compatibility Scoring** | Weighted algorithm: keyword coverage (60%) + section completeness (30%) + format compliance (10%) |
| **Job Description Matching** | Keyword intersection algorithm — shows matched and missing keywords with a match % score |
| **Improvement Suggestions** | Actionable flags returned with each ATS analysis |
| **Resume Templates** | 3 professionally designed templates: Modern (two-column blue), Classic (serif single-column), Minimal (clean whitespace) |
| **PDF & DOCX Export** | Server-side export generation with download history |
| **Resume History** | Dashboard listing all created resumes with ATS scores and quick actions |
| **Redis Caching** | Template caching and session support; falls back to in-memory cache if Redis is unavailable |

---

## Tool Stack & Justification

### Backend

| Tool | Version | Justification |
|---|---|---|
| **Node.js** | 18+ | Asynchronous, non-blocking I/O makes it ideal for a system that makes frequent external API calls (Claude, database). Its npm ecosystem provides all required libraries. Specified in Chapter 3 of the project design. |
| **Express.js** | 4.x | Minimal and unopinionated web framework for Node.js. Provides clean routing, middleware support, and is the industry standard for building RESTful APIs in Node.js. |
| **PostgreSQL** | 14+ | Relational database chosen for its strong support for JSONB (used to store flexible resume section content), referential integrity enforcement, and complex query support for resume history retrieval. Specified in Section 3.4 and 3.7 of the design document. |
| **`pg` (node-postgres)** | 8.x | Direct PostgreSQL client used instead of a full ORM to maintain control over queries and avoid abstraction overhead. Matches the "Query Builder" pattern described in Section 3.4.4. |
| **`@anthropic-ai/sdk`** | Latest | Official Anthropic SDK for calling the Claude API. Used to implement the AI Resume Content Generation Algorithm described in Section 3.8.1 of the project. Model used: `claude-sonnet-4-6`. |
| **`jsonwebtoken`** | 9.x | Implements JWT-based stateless authentication as specified in Section 3.3.1 (FR-01). Tokens expire after 24 hours per Section 3.3.2. |
| **`bcrypt`** | 5.x | Industry-standard password hashing with a work factor of 10 rounds. Chosen for resistance to brute-force and rainbow table attacks. Required by Section 3.3.2 security non-functional requirements. |
| **`redis`** | 4.x | In-memory caching for session tokens and frequently accessed templates, reducing database round-trips. Acts as the Cache Manager described in Section 3.4.4. Gracefully falls back to an in-memory Map if Redis is not running. |
| **`html-pdf-node`** | 1.x | Converts HTML template renders to PDF files for the Export Service described in Section 3.4.3. Chosen for its straightforward API and Puppeteer-based rendering. |
| **`docx`** | 8.x | Programmatically builds `.docx` files from resume sections. Enables DOCX export as required by the output design in Section 3.6.2. |
| **`cors`** | 2.x | Enables cross-origin requests between the React frontend (port 5173) and Express backend (port 5000) during development. |
| **`multer`** | 1.x | Handles multipart form data for file uploads where needed. |

### Frontend

| Tool | Version | Justification |
|---|---|---|
| **React.js** | 18.x | Component-based JavaScript library specified in Section 3.4.1 of the system design. Its declarative rendering model is well-suited to the dynamic resume preview and multi-step form interactions. |
| **Vite** | 5.x | Next-generation frontend build tool. Chosen over Create React App for its significantly faster hot-module replacement (HMR) and optimised production builds. |
| **React Router v6** | 6.x | Declarative client-side routing for navigating between Dashboard, Builder, and Detail pages without full page reloads. |
| **Axios** | 1.x | HTTP client used for all API calls. Interceptors automatically attach the JWT Bearer token to every request and redirect to `/login` on 401 responses. |
| **Tailwind CSS** | 3.x | Utility-first CSS framework enabling rapid, consistent UI development without writing custom CSS. Produces a responsive, mobile-compatible interface satisfying the Portability non-functional requirement (Section 3.3.2). |
| **React Context API** | (built-in) | Lightweight global state management for authentication state (user object, token). Chosen over Redux as the state needs are limited to auth — no over-engineering. |

### DevOps / Infrastructure (Production Targets)

| Tool | Justification |
|---|---|
| **Amazon S3** | Cloud object storage for exported PDF/DOCX files, made accessible via pre-signed URLs. Described in Section 3.4.5 of the architecture. Local filesystem used in development. |
| **HTTPS / TLS** | All production traffic must be served over HTTPS per the Security non-functional requirement (Section 3.3.2). |

---

## System Requirements

### Minimum Hardware
- CPU: 2 cores
- RAM: 4 GB
- Disk: 2 GB free space

### Software Prerequisites

| Software | Version | Notes |
|---|---|---|
| Node.js | 18.0+ | LTS version recommended |
| npm | 9.0+ | Bundled with Node.js |
| PostgreSQL | 14.0+ | Must be running locally or accessible via connection string |
| Redis | 6.0+ | Optional — system falls back to in-memory cache if Redis is not running |
| Git | 2.x+ | For cloning the repository |

### Network Requirements
- Active internet connection required to call the Anthropic Claude API
- Outbound HTTPS access to `api.anthropic.com`

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Hybridthegamer/AI-Resume-Builder.git
cd AI-Resume-Builder
git checkout claude/fyp-system-implementation-1rg4h4
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

### 4. Set Up the Database

Ensure PostgreSQL is running, then create a database and run the schema and seed files:

```bash
# Create the database
createdb ai_resume_builder

# Run schema (creates all tables)
psql -d ai_resume_builder -f database/schema.sql

# Seed default templates
psql -d ai_resume_builder -f database/seed.sql
```

If using a custom user/host:

```bash
psql -h localhost -U your_user -d ai_resume_builder -f database/schema.sql
psql -h localhost -U your_user -d ai_resume_builder -f database/seed.sql
```

### 5. Start the Backend Server

```bash
# From the backend/ directory
npm run dev       # development (with nodemon auto-restart)
# or
npm start         # production
```

The backend will start on **http://localhost:5000**

### 6. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 7. Start the Frontend Dev Server

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

Vite is configured to proxy all `/api` requests to `http://localhost:5000`, so no additional CORS configuration is needed during development.

### 8. Open the Application

Navigate to **http://localhost:5173** in your browser.

1. Click **Register** to create an account
2. Click **New Resume** on the dashboard
3. Complete all 6 steps of the resume builder form
4. On the final step, click **Generate & Preview** — the system will call the Claude API and compute the initial ATS score
5. Use the **ATS Score** tab to run a full analysis
6. Use the **Job Match** tab to compare against a job posting
7. Export as **PDF** or **DOCX** using the buttons in the header

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set the following:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_resume_builder

# JWT secret — use a long, random string (minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Anthropic Claude API key — obtain from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Redis (optional) — leave blank or remove to use in-memory fallback
REDIS_URL=redis://localhost:6379

# File storage (development uses local filesystem; set to 's3' for production)
STORAGE_TYPE=local
UPLOAD_DIR=uploads

# AWS S3 (only required if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=
```

---

## Database Setup

The schema creates six tables as defined in Section 3.7 of the system design:

| Table | Description |
|---|---|
| `users` | Registered job seekers (user_id, full_name, email, password_hash) |
| `resumes` | Resume metadata per user (title, template, ATS score) |
| `sections` | Resume content stored as JSONB (personal_info, experience, education, skills, certifications, summary) |
| `templates` | Available visual templates (name, layout_json, is_premium flag) |
| `job_matches` | Job description match results (match_score, matched/missing keywords as JSONB) |
| `exports` | Export log (format, file path, download URL, timestamp) |

The `database/seed.sql` file inserts the three default templates: **Modern**, **Classic**, and **Minimal**.

---

## API Reference

All endpoints except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive a JWT |
| GET | `/api/auth/profile` | Get the authenticated user's profile |
| PUT | `/api/auth/profile` | Update profile details |

### Resumes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resumes` | Create a new resume with sections |
| GET | `/api/resumes` | List all resumes for the current user |
| GET | `/api/resumes/:id` | Get a single resume with all sections |
| PUT | `/api/resumes/:id` | Update resume content and sections |
| DELETE | `/api/resumes/:id` | Delete a resume |
| POST | `/api/resumes/:id/generate` | Trigger AI content generation via Claude API |
| POST | `/api/resumes/:id/ats-score` | Compute and store the ATS compatibility score |
| POST | `/api/resumes/:id/job-match` | Match resume against a provided job description |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/templates` | List all available resume templates |
| GET | `/api/templates/:id` | Get a single template by ID |

### Exports

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/exports/:resumeId/pdf` | Generate and store a PDF export |
| POST | `/api/exports/:resumeId/docx` | Generate and store a DOCX export |
| GET | `/api/exports/:resumeId` | List export history for a resume |
| GET | `/api/exports/download/:exportId` | Download an exported file |

---

## Project Structure

```
AI-Resume-Builder/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # PostgreSQL table definitions
│   │   └── seed.sql            # Default resume templates
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # PostgreSQL connection pool
│   │   │   └── cache.js        # Redis client with in-memory fallback
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── resumeController.js
│   │   │   ├── templateController.js
│   │   │   └── exportController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   └── errorHandler.js # Centralised error handling
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── resumes.js
│   │   │   ├── templates.js
│   │   │   └── exports.js
│   │   ├── services/
│   │   │   ├── aiService.js    # Claude API integration
│   │   │   ├── atsService.js   # ATS scoring algorithm
│   │   │   ├── jobMatchService.js  # Job description matching
│   │   │   └── exportService.js    # PDF/DOCX generation
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js       # Axios instance with interceptors
    │   ├── components/
    │   │   ├── ATSScoreGauge.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── ResumeCard.jsx
    │   │   ├── ResumePreview.jsx
    │   │   └── TemplateSelector.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ResumeBuilderPage.jsx  # 6-step builder form
    │   │   └── ResumeDetailPage.jsx   # Preview, ATS, Job Match, Export
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```
