# TeachFlow – AI-Powered Essay Grading Assistant

TeachFlow is an AI-powered grading assistant that helps educators provide structured, consistent feedback on student exams. The application analyzes student submissions with LLM support, generates feedback, and highlights suspected incorrect answers for the teacher to review.

This helps teachers save time and focus on teaching!

This repo ships a FastAPI backend plus a Streamlit UI.

## Features

- 📝 **AI-Powered Grading**: Automatic essay analysis using advanced language models
- 🎯 **Structured Feedback**: Organized feedback by issue type (e.g. Grammar, Vocabulary, Content, Structure)
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
│       ├── students.json # Optional roster for the rawdata helper
│       └── pdfs/         # Uploaded student submissions (for OCR experiments)
├── db_mockup/            # JSON "database" for saved results (auto-created)
├── pyproject.toml        # Python dependencies
└── README.md             # This file
```

## Prerequisites

- **Python 3.13+**
  - Developed with the [uv](https://github.com/astral-sh/uv) package manager. Install uv with `curl -LsSf https://astral.sh/uv/install.sh | sh` to run the commands with `uv run`
  - Alternatively, build your .venv with `python -m venv .venv`, activate with `source .venv/bin/activate` (UNIX) or `.venv\Scripts\activate` (Windows), install dependencies from `requirements.txt` with `python -m pip install -r requirements.txt`, and then run the commands skipping `uv run`
- **OpenAI API key** available as `OPENAI_API_KEY` (the backend uses the OpenAI Responses API).

## Quickstart (local)

Run these steps from the repo root (`teachflow/`):

```bash
uv sync  # if using uv
echo 'OPENAI_API_KEY=your-api-key-here' > .env   # or export in your shell
uv run python -m uvicorn backend.api:app --reload
```

The API will be available at `http://localhost:8000` (interactive docs at `/docs`).

In a second terminal:

```bash
uv run streamlit run streamlit_app.py
```

The UI opens at `http://localhost:8501` and will talk to the backend at `http://127.0.0.1:8000`. If you run the backend elsewhere, update `API_BASE` near the top of `streamlit_app.py`.

## Using the Streamlit app

1. Select a student from the sidebar dropdown.
2. (Optional, but necessary for relevant grading) Paste the assignment task and any context to ground grading.
3. Paste the student's essay and click **Grade essay**.
4. Review/edit the grade, summary, and issues.
5. Click **Save edited feedback** to persist.
6. Use **Refresh saved marks** in the sidebar to reload stored grades.

You can use the rubrics and example exam submissions in `examples/` for testing the app, or write your own.

## API Endpoints

### Student Management
- `GET /students` - List all students from the roster, should eventually come from a student management system that teachers actually use

### Submissions
- `POST /submissions/{student_id}` - Submit essay for grading
  - Accepts JSON with `essay_text` and optional `assignment_task`
  - Returns grading results with feedback and issues

### Feedback Management
- `PATCH /feedback/{student_id}` - Update/edit feedback for a student
  - Requires `grade`, `summary_feedback`, and `issues` fields
  - Saves updated feedback to storage (should eventually be a proper database)

### Results
- `GET /results/{student_id}` - Retrieve saved feedback for a student
  - Returns the graded JSON with grade, summary, and issues

## Configuration

### Student Roster

The backend (and Streamlit UI) currently reads students from `backend/cfg.py::STUDENTS`:

- Update that dict to change displayed students.
- If you want to experiment with PDF/OCR matching, checkout the `ocr-llm` branch first. The helper in `backend/rawdata.py` uses `backend/data/students.json` and `backend/data/pdfs/` to map PDFs to student IDs.

### AI Grading Configuration

Customize grading behavior in `backend/cfg.py`:
- Adjust the grading prompt
- Modify issue categories
- Configure feedback structure
- Set rubric criteria

A lot of this input should eventually come via RAG from the actual teaching context of a teacher's class and curriculum.

## How It Works

1. **Essay Submission**: Student essays are submitted via the UI (currently text input, but should eventually be a PDF/image upload of a handwritten student exam)
2. **AI Analysis**: The backend sends the essay to a language model with a structured prompt and context
3. **Feedback Generation**: The AI analyzes the essay and generates:
   - An overall grade
   - Summary feedback
   - Specific issues categorized by type (e.g. Grammar, Vocabulary, Content, Structure for writing)
- Quoted text from the essay
- Comments explaining each issue
- Suggested corrections
4. **Review & Edit**: Teachers can review and modify the AI-generated feedback
5. **Storage**: Final feedback is saved in `db_mockup/` as `{student_id}.json` and can be retrieved later, meant to write to printable PDF to hand it back to students

## Storage layout

The backend writes JSON into `db_mockup/` at project root:
- `db_mockup/{student_id}.json` (current saved feedback used by the API/UI)
- `db_mockup/{student_id}.final.json` (pipeline output when running `backend/llm_pipeline.py`)
The folder is created automatically when the backend or pipeline runs.

## Troubleshooting

### Backend won't start
- Ensure Python 3.13+ is installed: `python --version`
- Check that all dependencies are installed: `uv sync` or `python -m pip install -r requirements.txt`
- Verify your OpenAI API key environment variable is set correctly

### Streamlit shows "Failed to fetch students"
- Make sure the backend is running on `http://localhost:8000`
- Check the backend terminal for error messages
- Verify the student roster in `backend/cfg.py::STUDENTS` is non-empty

## Future Enhancements

- [ ] Input from photos with handwriting OCR to actually hook into current teaching reality
- [ ] RAG workflow to allow uploading context to ground the LLM answers
- [ ] Export feedback to PDF
- [ ] Integration with Learning Management Systems (LMS) currently in use in a school's teaching context

## License

This project was built during the GDG Hackathon in Linz for educational purposes.

## Contact

For issues or questions, please create an issue in the repository.
