
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
├── backend/           # FastAPI backend
│   ├── api.py         # Main FastAPI application
│   ├── llm_pipeline.py# LLM grading logic
│   ├── cfg.py         # Configuration
│   ├── ocr_mock.py    # OCR mock for testing
│   └── rawdata.py     # Data utilities
├── pyproject.toml     # Python dependencies
└── README.md          # This file
```

## Getting Started

### Prerequisites

- **Python 3.13+** (using uv for package management)
- **Node.js 18+** (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm

### Running the Backend (FastAPI)

```bash
# Install Python dependencies (using uv)
uv sync

# Start the FastAPI server
cd backend
python -m uvicorn api:app --reload
```

The backend API will be available at `http://localhost:8000`

**API Documentation:** Visit `http://localhost:8000/docs` for interactive API documentation

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Running Both (Development)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn api:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## API Endpoints

### Submissions
- `POST /submissions/{student_id}` - Upload PDF and generate AI feedback
  - Accepts PDF file upload
  - Runs OCR extraction
  - Generates LLM-based grading
  - Returns feedback JSON

### Feedback
- `PATCH /feedback/{student_id}` - Update/edit feedback for a student
  - Requires `grade` and `summary_feedback` fields
  - Updates saved feedback JSON

### Results
- `GET /results/{student_id}` - Retrieve saved feedback for a student
  - Returns the final graded JSON

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
- Python 3.13
- FastAPI
- OpenAI API (for LLM grading)
- python-multipart (file uploads)

## Features

- PDF upload and OCR text extraction
- Automatic student grading using LLM
- AI-powered feedback generation
- Structured rubric-based grading
- Editable feedback correction
- Student progress tracking

## Development Notes

- The frontend proxies API requests to the backend via Vite's proxy configuration
- Frontend runs on port 8080, backend on port 8000
- OCR is currently mocked (see `ocr_mock.py`) for development
- Graded submissions are saved in the `Final/` directory
