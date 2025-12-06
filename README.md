# TeachFlow – AI-Powered Essay Grading Assistant

TeachFlow is an AI-powered grading assistant that helps educators provide structured, consistent feedback on student exams. The application analyzes student submissions with LLM support, generates feedback, and highlights suspected incorrect answers for the teacher to review.

This helps teachers save time and focus on teaching!

This repo now ships a FastAPI backend plus a Streamlit UI. The earlier React/Vite frontend was removed to keep the project lightweight.

## Features

- 📝 **AI-Powered Grading**: Automatic essay analysis using advanced language models
- 🎯 **Structured Feedback**: Organized feedback by issue type (Grammar, Vocabulary, Content, Structure)
- ✏️ **Editable Results**: Review and modify AI-generated feedback before finalizing
- 👥 **Multi-Student Management**: Track and grade multiple students
- 📊 **Overview Dashboard**: Quick view of all saved grades and feedback
- 🎨 **Interface**: Streamlit app for a simple, ready-to-run workflow

## Project Structure

```
teachflow/
├── streamlit_app.py      # Streamlit UI application
├── backend/              # FastAPI backend
│   ├── api.py            # Main FastAPI application
│   ├── llm_pipeline.py   # LLM grading logic
│   ├── cfg.py            # Configuration
│   ├── rawdata.py        # Data utilities
│   ├── text_store.py     # Text storage utilities
│   └── data/             # Student data and PDFs
│       ├── students.json # Student roster
│       └── pdfs/         # Uploaded student submissions
├── pyproject.toml        # Python dependencies
└── README.md             # This file
```

## Prerequisites

- **Python 3.13+** with [uv](https://github.com/astral-sh/uv) package manager (only Python dependencies are needed)
- **OpenAI API Key** for AI-powered grading

## Getting Started

### 1. Install Python Dependencies

```bash
# Install dependencies using uv
uv sync
```

### 2. Configure Environment Variables

Create a `.env` file in the project root or export environment variables:

```bash
# OpenAI API configuration
export OPENAI_API_KEY="your-api-key-here"
```

### 3. Start the Backend Server

The backend must be running for the Streamlit app:

```bash
uv run python -m uvicorn backend.api:app --reload
```

The API will be available at `http://localhost:8000`

**API Documentation:** Visit `http://localhost:8000/docs` for interactive API documentation

## Running the Application

### Streamlit App

The Streamlit app provides a working interface for grading essays.

```bash
# From project root
uv run streamlit run streamlit_app.py
```

The Streamlit app will open in your browser at `http://localhost:8501`

**Using the Streamlit App:**

1. **Select a student** from the sidebar dropdown
2. **Paste the assignment task** Gives context to ground the AI
3. **Paste the student's essay** in the text area
4. **Click "Grade essay"** to get AI-generated feedback
5. **Review and edit** the feedback in the editor
6. **Save** the final feedback
7. **View all saved grades** in the sidebar "Saved marks overview"

## API Endpoints

### Student Management
- `GET /students` - List all students from the roster

### Submissions
- `POST /submissions/{student_id}` - Submit essay for grading
  - Accepts JSON with `essay_text` and optional `assignment_task`
  - Returns grading results with feedback and issues

### Feedback Management
- `PATCH /feedback/{student_id}` - Update/edit feedback for a student
  - Requires `grade`, `summary_feedback`, and `issues` fields
  - Saves updated feedback to storage

### Results
- `GET /results/{student_id}` - Retrieve saved feedback for a student
  - Returns the graded JSON with grade, summary, and issues

## Tech Stack

### Backend
- **Python 3.13**
- **FastAPI** - Modern, fast Python web framework
- **OpenAI API** - LLM-powered grading
- **python-multipart** - File upload handling (currently not finished implementation, meant for OCR handwriting recognition)

### Streamlit App
- **Streamlit 1.40+** - Interactive web interface
- **Requests** - API communication

## Development Workflow

### Running Backend and Streamlit

**Terminal 1 - Backend:**
```bash
uv run python -m uvicorn backend.api:app --reload
```

**Terminal 2 - Streamlit:**
```bash
uv run streamlit run streamlit_app.py
```

## Configuration

### Student Roster

Students are currently managed in `backend/data/students.json`, placeholder meant for
hooking into an existing teaching system, such as Moodel or WebUNTIS:

```json
[
  {
    "id": 1,
    "name": "John Doe"
  },
  {
    "id": 2,
    "name": "Jane Smith"
  }
]
```

### AI Grading Configuration

Customize grading behavior in `backend/cfg.py`:
- Adjust the grading prompt
- Modify issue categories
- Configure feedback structure
- Set rubric criteria

## How It Works

1. **Essay Submission**: Student essays are submitted via the UI (text input or PDF upload)
2. **AI Analysis**: The backend sends the essay to a language model with a structured prompt and context
3. **Feedback Generation**: The AI analyzes the essay and generates:
   - An overall grade
   - Summary feedback
   - Specific issues categorized by type (e.g. Grammar, Vocabulary, Content, Structure for writing)
   - Quoted text from the essay
   - Comments explaining each issue
   - Suggested corrections
4. **Review & Edit**: Teachers can review and modify the AI-generated feedback
5. **Storage**: Final feedback is saved and can be retrieved later, meant to write to printable PDF to hand it back to students

## Troubleshooting

### Backend won't start
- Ensure Python 3.13+ is installed: `python --version`
- Check that all dependencies are installed: `uv sync`
- Verify your OpenAI API key is set correctly

### Streamlit shows "Failed to fetch students"
- Make sure the backend is running on `http://localhost:8000`
- Check the backend terminal for error messages
- Verify `backend/data/students.json` exists and is valid JSON

## Future Enhancements

- [ ] Input from photos with handwriting OCR to actually hook into current teaching reality
- [ ] RAG workflow to allow uploading context to ground the LLM answers
- [ ] Export feedback to PDF
- [ ] Integration with Learning Management Systems (LMS)

## License

This project is for educational purposes.

## Support

For issues or questions, please create an issue in the repository.
