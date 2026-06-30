# AI-Powered Resume Builder

An intelligent, web-based resume builder that uses the **Claude AI API** (`claude-sonnet-4-6`) to generate professionally worded, ATS-optimised resumes tailored to specific job descriptions.

Built as a Final Year Project implementing the architecture specified in Chapters 1–3: a decoupled **React.js** frontend, **Node.js/Express** backend, **PostgreSQL** database, and the official `@anthropic-ai/sdk`.


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

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
2. [Tool Stack & Justification](#tool-stack--justification)
3. [System Requirements](#system-requirements)
4. [Quick Setup (Step-by-Step)](#quick-setup-step-by-step)
5. [Environment Variables](#environment-variables)
6. [Running the App](#running-the-app)
7. [How to Use](#how-to-use)
8. [Project Structure](#project-structure)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Features

| Feature | Description |
|---|---|
| **JWT Authentication** | Register / login with bcrypt-hashed passwords. Tokens expire after 24 hours. |
| **6-Step Resume Builder** | Guided form: Personal Info → Experience → Education → Skills → Certifications → Template |
| **AI Content Generation** | Claude API writes a professional summary, enhanced bullet points, and skills narrative from raw user input |
| **ATS Compatibility Score** | Weighted algorithm: keyword coverage (60%) + section completeness (30%) + format (10%) |
| **Job Description Matching** | Set-intersection keyword analysis — shows matched and missing keywords with a % score |
| **Improvement Suggestions** | Actionable flags returned with each ATS scan |
| **3 Resume Templates** | Modern (two-column blue), Classic (serif single-column), Minimal (clean whitespace) |
| **PDF & DOCX Export** | Server-side Puppeteer-based PDF and programmatic DOCX generation |
| **Resume Dashboard** | Lists all created resumes with ATS scores and edit/delete actions |
| **Redis Caching** | Template and session caching; **automatically falls back to in-memory cache** if Redis is not running |

---

## Tool Stack & Justification

### Backend

| Tool | Justification |
|---|---|
| **Node.js 18+** | Asynchronous, non-blocking I/O — ideal for a system that makes frequent external API calls (Claude, database). Specified in Chapter 3 of the project design. |
| **Express.js** | Minimal web framework. Clean routing and middleware support for RESTful APIs. |
| **PostgreSQL** | Relational DB chosen for JSONB support (flexible resume section content), referential integrity, and complex query support. Specified in Sections 3.4 and 3.7. |
| **`pg` (node-postgres)** | Direct PostgreSQL client without ORM abstraction — matches the Data Access Layer pattern in Section 3.4.4. |
| **`@anthropic-ai/sdk`** | Official Anthropic SDK for calling Claude (`claude-sonnet-4-6`). Implements the AI Content Generation Algorithm from Section 3.8.1. |
| **`jsonwebtoken`** | JWT-based stateless auth as specified in Section 3.3.1. 24-hour expiry per Section 3.3.2. |
| **`bcrypt`** | Industry-standard password hashing (10 rounds). Required by Section 3.3.2 security NFRs. |
| **`html-pdf-node`** | Puppeteer-based HTML-to-PDF renderer for the Export Service (Section 3.4.3). |
| **`docx`** | Programmatically generates `.docx` files from resume sections. Required by Output Design Section 3.6.2. |
| **`redis`** | In-memory caching for templates and session data. Gracefully falls back to a `Map`-based memory cache if Redis is unavailable. |

### Frontend

| Tool | Justification |
|---|---|
| **React.js 18** | Component-based library specified in Section 3.4.1. Declarative rendering suits the multi-step form and live preview interactions. |
| **Vite** | Fast HMR and optimised production builds. |
| **React Router v6** | Client-side routing between Dashboard, Builder, and Detail pages. |
| **Axios** | HTTP client with interceptors that attach the JWT Bearer token to every request. |
| **Tailwind CSS** | Utility-first CSS for rapid, consistent, responsive UI — satisfying the Portability NFR (Section 3.3.2). |
| **React Context API** | Lightweight global auth state (user object + token). No Redux overhead needed for this scope. |


### DevOps / Infrastructure (Production Targets)

| Tool | Justification |
|---|---|
| **Amazon S3** | Cloud object storage for exported PDF/DOCX files, made accessible via pre-signed URLs. Local filesystem used in development. |
| **HTTPS / TLS** | All production traffic must be served over HTTPS per the Security non-functional requirement. |

---

## System Requirements

### Hardware Minimums
- CPU: 2 cores
- RAM: 4 GB
- Disk: 3 GB free (includes Puppeteer's Chromium download ~300 MB)

### Required Software

| Dependency | Version | Installation |
|---|---|---|
| **Node.js** | 18 or higher | https://nodejs.org (download LTS) |
| **npm** | 9 or higher | Included with Node.js |
| **PostgreSQL** | 14 or higher | https://www.postgresql.org/download/ |
| **Git** | Any | https://git-scm.com |

### Optional
- **Redis** — If not installed, the app automatically falls back to in-memory caching (no impact on functionality for single-user development).

---

## Quick Setup (Step-by-Step)

### Step 1 — Clone the repository

```bash
git clone https://github.com/hybridthegamer/ai-resume-builder.git
cd ai-resume-builder
```

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

> **Note:** This will download Puppeteer's Chromium (~300 MB). This is required for PDF export. It may take a few minutes on first install.

### Step 3 — Install frontend dependencies

Open a new terminal (keep the backend terminal open):

```bash
cd frontend
npm install
```

### Step 4 — Create the PostgreSQL database

Open your PostgreSQL prompt (or pgAdmin) and run:

```sql
CREATE DATABASE resume_builder;
```

If you are using the default `postgres` superuser:

```bash
# On macOS/Linux
psql -U postgres -c "CREATE DATABASE resume_builder;"

# On Windows (run as Administrator)
psql -U postgres -c "CREATE DATABASE resume_builder;"
```

### Step 5 — Configure environment variables

In the `backend` directory, copy the example file and fill in your values:

```bash
# From inside the backend directory
cp .env.example .env
```

Then open `backend/.env` in any text editor and update:

```env
PORT=5000
NODE_ENV=development

# Your PostgreSQL connection string
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/resume_builder

# Generate a strong random secret (or use any long random string)
JWT_SECRET=change_this_to_a_long_random_string_at_least_32_chars

# Your Anthropic API key (get it from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Redis is OPTIONAL — delete this line or leave empty to use memory cache
REDIS_URL=redis://localhost:6379

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5173
```

**Getting your Anthropic API key:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key starting with `sk-ant-` and paste it into `.env`

### Step 6 — Run the database migration

From the `backend` directory:

```bash
npm run db:migrate
```

This creates all tables (users, resumes, sections, templates, job_matches, exports) and inserts the 3 default resume templates.

Expected output:
```
Connected to database.
Schema applied.
Seed data inserted (templates).

Migration complete. Database is ready.
```

### Step 7 — Start the backend server

From the `backend` directory:

```bash
npm run dev
```

Expected output:
```
Database connection established
REDIS_URL not set, using in-memory cache fallback   ← OK if you skipped Redis
Server running on port 5000 in development mode
Health check: http://localhost:5000/health
```

Verify it works: open http://localhost:5000/health in your browser. You should see `{"status":"ok", ...}`.

### Step 8 — Start the frontend

From the `frontend` directory (in a separate terminal):

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Step 9 — Open the app

Go to **http://localhost:5173** in your browser.

1. Click **Register** and create an account
2. Click **New Resume** on the dashboard
3. Fill in the 6-step form
4. On the resume detail page, click **Generate AI Content**
5. Use **ATS Score** and **Job Match** tabs to analyse
6. Click **Export PDF** or **Export DOCX** to download

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Secret key for signing JWTs (min 32 chars) |
| `ANTHROPIC_API_KEY` | **Yes** | API key from console.anthropic.com |
| `REDIS_URL` | No | Redis URL — omit for in-memory cache fallback |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: http://localhost:5173) |

---

## Running the App

### Development (hot-reload)

Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

### Production build

```bash
# Build frontend
cd frontend
npm run build
# Serves from frontend/dist — deploy to any static host or serve via Express

# Start backend in production mode
cd backend
NODE_ENV=production npm start
```

---

## How to Use

### Creating a Resume

1. **Register / Login** at http://localhost:5173
2. Click **New Resume** on the dashboard
3. Complete the **6-step form**:
   - Step 1: Personal info (name, email, phone, location, LinkedIn)
   - Step 2: Work experience (one or more jobs with responsibilities)
   - Step 3: Education (degrees, institutions, graduation years)
   - Step 4: Skills (technical and soft skills)
   - Step 5: Certifications and career objectives
   - Step 6: Choose a visual template (Modern / Classic / Minimal)
4. Click **Create Resume** on the final step

### Generating AI Content

On the resume detail page:
- Click **Generate AI Content** — the Claude API will write a professional summary and enhance your experience bullet points
- This takes 5–15 seconds depending on your internet connection

### Analysing ATS Score

- Click the **ATS Score** tab
- Click **Run ATS Analysis**
- View your score (0–100%), keyword coverage, and improvement suggestions

### Job Description Matching

- Click the **Job Match** tab
- Paste a full job posting into the text area
- Click **Analyse Match**
- View matched keywords (green) and missing keywords (red) with a match percentage

### Exporting

- Click **Export PDF** or **Export DOCX** in the top-right of the resume detail page
- The file will download automatically
- Previous exports are listed in the **History** tab

---

## Project Structure

```
ai-resume-builder/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Table definitions (PostgreSQL)
│   │   ├── seed.sql            # Default templates
│   │   └── migrate.js          # Migration runner (npm run db:migrate)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # pg Pool connection
│   │   │   └── cache.js        # Redis + memory cache
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── resumeController.js
│   │   │   ├── templateController.js
│   │   │   └── exportController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verify middleware
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── resumes.js
│   │   │   ├── templates.js
│   │   │   └── exports.js
│   │   ├── services/
│   │   │   ├── aiService.js        # Claude API (Section 3.8.1)
│   │   │   ├── atsService.js       # ATS scoring algorithm (Section 3.8.2)
│   │   │   ├── jobMatchService.js  # Job match algorithm (Section 3.8.3)
│   │   │   └── exportService.js    # PDF + DOCX generation
│   │   └── app.js              # Express app setup
│   ├── uploads/                # Generated PDF/DOCX files (auto-created)
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env.example            # Copy to .env and fill in
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Axios client + API functions
│   │   ├── components/
│   │   │   ├── ATSScoreGauge.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ResumeCard.jsx
│   │   │   ├── ResumePreview.jsx   # Live HTML template rendering
│   │   │   └── TemplateSelector.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ResumeBuilderPage.jsx   # 6-step form wizard
│   │   │   └── ResumeDetailPage.jsx    # Preview + ATS + export
│   │   ├── App.jsx             # Routes
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind + custom utilities
│   ├── tailwind.config.js
│   ├── vite.config.js          # Dev server proxy to backend :5000
│   └── package.json
│
└── README.md
```

---

## API Reference

All endpoints except `/health` are prefixed with `/api`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account `{full_name, email, password}` |
| POST | `/api/auth/login` | Login `{email, password}` → returns JWT |
| GET | `/api/auth/profile` | Get current user (requires Bearer token) |
| PUT | `/api/auth/profile` | Update name / password |

### Resumes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resumes` | Create resume with sections |
| GET | `/api/resumes` | List all resumes for current user |
| GET | `/api/resumes/:id` | Get resume with all sections |
| PUT | `/api/resumes/:id` | Update resume |
| DELETE | `/api/resumes/:id` | Delete resume |
| POST | `/api/resumes/:id/generate` | Generate AI content via Claude |
| POST | `/api/resumes/:id/ats-score` | Compute ATS compatibility score |
| POST | `/api/resumes/:id/job-match` | Match resume vs job description |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Get a single template |

### Exports

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/exports/:resumeId/pdf` | Generate PDF export |
| POST | `/api/exports/:resumeId/docx` | Generate DOCX export |
| GET | `/api/exports/:resumeId` | List exports for a resume |
| GET | `/api/exports/download-file/:filename` | Download a file (public) |

---

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
Make sure `backend/.env` exists and contains your API key starting with `sk-ant-`. The `.env` file must be in the `backend/` directory, not the project root.

### "Cannot connect to database" / migration fails
- Make sure PostgreSQL is running: `pg_ctl status` (macOS/Linux) or check Services (Windows)
- Check that the database exists: `psql -U postgres -l`
- Verify the `DATABASE_URL` format: `postgresql://username:password@localhost:5432/resume_builder`
- Make sure the password doesn't contain special characters that need URL encoding

### PDF export fails
The PDF exporter uses Puppeteer (headless Chromium). If it fails:
- Make sure `npm install` completed successfully in the `backend` directory (Puppeteer downloads Chromium automatically)
- On Linux servers: the `--no-sandbox` flag is already configured in the code
- On macOS with Apple Silicon: Puppeteer should work out of the box with the downloaded Chromium

### "Port 5000 already in use"
Change the port in `backend/.env`: `PORT=5001`, then restart the backend.

### Frontend shows "Network Error" for API calls
- Ensure the backend is running on port 5000
- The Vite dev server (port 5173) proxies `/api` requests to `http://localhost:5000` automatically
- Check the backend terminal for error messages

### CORS errors in browser console
Make sure `FRONTEND_URL=http://localhost:5173` is set in `backend/.env` and the backend has been restarted after changing it.

### AI generation returns an error
- Verify your `ANTHROPIC_API_KEY` is valid and has credit remaining
- Check https://console.anthropic.com for usage and billing
- The AI generation requires a resume to have at least a name, one work experience, and one skill
