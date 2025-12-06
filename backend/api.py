from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse

from . import cfg
from .llm_pipeline import grade_single_student_essay
from .text_store import add_submission

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
    payload: Dict = Body(..., description="Payload must contain an 'essay_text' field."),
):
    """
    CREATE:
    - Frontend sends a JSON payload with the student's essay text.
    - Payload shape: { "essay_text": "<full essay text>" }
    - Text is stored in an in-memory list of (id, text) tuples.
    - LLM grading is performed.
    - Final JSON is saved into teachflow/Final/{student_id}.json.
    - Final JSON is returned in the response.
    """
    essay_text = payload.get("essay_text")
    if not isinstance(essay_text, str) or not essay_text.strip():
        raise HTTPException(status_code=400, detail="Missing or empty 'essay_text' field.")

    # Store the submission for later inspection (in-memory).
    add_submission(student_id, essay_text)

    try:
        result_json = grade_single_student_essay(student_id, essay_text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM grading failed: {e}")

    # Save final JSON to Final/{student_id}.json
    final_path = _final_json_path(student_id)
    final_path.parent.mkdir(parents=True, exist_ok=True)
    final_path.write_text(
        __import__("json").dumps(result_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return JSONResponse(content=result_json)


@app.patch("/feedback/{student_id}")
async def update_feedback(student_id: str, edited: Dict):
    """
    UPDATE:
    - Teacher sends edited feedback JSON for a given student_id.
    - JSON must at least contain 'grade' and 'summary_feedback'.
    - We overwrite Final/{student_id}.json with this edited JSON.
    """
    required_keys = {"grade", "summary_feedback"}
    missing = required_keys - set(edited.keys())
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required keys in edited feedback: {missing}",
        )

    final_path = _final_json_path(student_id)
    if not final_path.exists():
        raise HTTPException(status_code=404, detail="No existing result for this student_id.")

    # Load old JSON (so we can keep any extra fields if desired)
    import json
    try:
        existing = json.loads(final_path.read_text(encoding="utf-8"))
    except Exception:
        existing = {}

    # Merge existing with edited; edited values win
    merged = dict(existing)
    merged.update(edited)

    final_path.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {"status": "updated", "student_id": student_id}


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
