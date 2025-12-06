from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse

from . import cfg
from .llm_pipeline import grade_single_student_essay

# Path configuration aligned with existing code
BASE_DIR = Path(__file__).resolve().parent          # teachflow/backend
PROJECT_ROOT = BASE_DIR.parent                      # teachflow/
INPUT_DIR = PROJECT_ROOT / "Input"
FINAL_DIR = PROJECT_ROOT / "Final"

# Make sure folders exist
INPUT_DIR.mkdir(parents=True, exist_ok=True)
FINAL_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="TeachFlow MVP API", version="0.1.0")


def _final_json_path(student_id: str) -> Path:
    """Helper: path to the final JSON for a student."""
    return FINAL_DIR / f"{student_id}.json"


@app.post("/submissions/{student_id}")
async def create_submission(
    student_id: str,
    payload: Dict = Body(..., description="Payload must contain an 'essay_text' field; 'assignment_task' is optional."),
):
    """
    CREATE:
    - Frontend sends a JSON payload with the student's essay text and optional assignment task.
    - Payload shape:
        {
            "essay_text": "<full essay text>",
            "assignment_task": "<original homework prompt (optional)>"
        }
    - Text is stored (id, text) for this session if you use an in-memory store.
    - LLM grading is performed on a combined "task + answer" string.
    - Final JSON is saved into teachflow/Final/{student_id}.json.
    - Final JSON (including assignment_task) is returned in the response.
    """
    essay_text = payload.get("essay_text")
    assignment_task = payload.get("assignment_task") or ""

    if not isinstance(essay_text, str) or not essay_text.strip():
        raise HTTPException(status_code=400, detail="Missing or empty 'essay_text' field.")

    # If you have an in-memory store for submissions, keep this:
    try:
        from .text_store import add_submission  # use relative import if inside backend package
        add_submission(student_id, essay_text)
    except Exception:
        # If text_store is not present or not needed, you can ignore this block.
        pass

    # Combine assignment task + student answer into one string for the LLM
    if assignment_task.strip():
        combined_text = (
            "Assignment task:\n"
            f"{assignment_task.strip()}\n\n"
            "Student answer:\n"
            f"{essay_text.strip()}"
        )
    else:
        combined_text = essay_text.strip()

    try:
        result_json = grade_single_student_essay(student_id, combined_text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM grading failed: {e}")

    # Store the (raw) assignment task in the result JSON for traceability
    result_json["assignment_task"] = assignment_task.strip()

    # Save final JSON to Final/{student_id}.json
    final_path = _final_json_path(student_id)
    final_path.parent.mkdir(parents=True, exist_ok=True)

    import json
    final_path.write_text(
        json.dumps(result_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return JSONResponse(content=result_json)


@app.patch("/feedback/{student_id}")
async def update_feedback(
    student_id: str,
    payload: Dict = Body(..., description="Optional keys: grade, summary_feedback, issues"),
):
    """
    Update stored feedback for a student.
    Accepts optional keys:
      - grade (str)
      - summary_feedback (str)
      - issues (list[dict])  # full replacement
    """
    final_path = _final_json_path(student_id)
    if not final_path.exists():
        raise HTTPException(status_code=404, detail="No feedback stored for this student.")

    import json

    data = json.loads(final_path.read_text(encoding="utf-8"))

    grade = payload.get("grade")
    summary = payload.get("summary_feedback")
    issues = payload.get("issues")

    if grade is not None:
        data["grade"] = grade
    if summary is not None:
        data["summary_feedback"] = summary
    if issues is not None:
        data["issues"] = issues

    final_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return JSONResponse(content=data)


@app.get("/results/{student_id}")
async def get_result(student_id: str):
    """
    GET:
    - Returns the final saved JSON for a given student_id.
    - Reads from Final/{student_id}.json.
    """
    final_path = _final_json_path(student_id)
    if not final_path.exists():
        raise HTTPException(status_code=404, detail="Result not found for this student_id.")

    import json
    data = json.loads(final_path.read_text(encoding="utf-8"))
    return JSONResponse(content=data)


@app.get("/students")
async def list_students():
    """
    GET:
    - Returns all configured students from cfg.STUDENTS.
    - Response shape: [{ "id": "1", "name": "Surname Lastname" }, ...]
    """
    students = [
        {"id": str(sid), "name": str(name)}
        for sid, name in cfg.STUDENTS.items()
    ]
    students.sort(key=lambda s: int(s["id"]))
    return JSONResponse(content=students)


@app.get("/students/{student_id}")
async def get_student(student_id: str):
    name = cfg.STUDENTS.get(str(student_id))
    if not name:
        raise HTTPException(status_code=404, detail="Student not found.")
    return {"id": str(student_id), "name": str(name)}
