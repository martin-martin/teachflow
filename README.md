
# FeedbackAI – AI-Powered Grading Assistant

A monorepo containing both frontend and backend for the FeedbackAI grading assistant application.

## Project Structure

```
root/
├── frontend/          # React + Vite frontend application
│   ├── src/           # Source code (components, pages, hooks, etc.)
│   ├── public/        # Static assets
│   ├── index.html     # Entry HTML
│   └── package.json   # Frontend dependencies
├── backend/           # Express.js backend API
│   ├── src/           # Server source code
│   │   ├── routes/    # API route handlers
│   │   └── index.ts   # Server entry point
│   └── package.json   # Backend dependencies
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Running the Backend

```bash
cd backend
npm install
npm run dev
```

The backend API will be available at `http://localhost:3000`

### Running Both (Development)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

## API Endpoints

### OCR Endpoints
- `POST /api/ocr/extract-text` - Extract text from uploaded PDF
- `POST /api/ocr/extract-name` - Extract student name from PDF header

### Feedback Endpoints
- `POST /api/feedback/generate` - Generate AI feedback for submission

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Zustand (state management)
- React Router

### Backend
- Node.js
- Express.js
- TypeScript
- Zod (validation)

## Features

- PDF upload and OCR text extraction
- Automatic student name detection and matching
- AI-powered feedback generation
- Structured rubric-based grading
- Editable OCR text correction
- Student progress tracking

## Note

⚠️ **This monorepo structure is designed for external deployment.** The Lovable preview will not work with this structure. For local development, run both frontend and backend separately as described above.
