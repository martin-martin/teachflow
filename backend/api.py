from pathlib import Path
from typing import Dict

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from llm_pipeline import grade_single_student_essay
from ocr_mock import run_ocr_mock_for_id

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
async def create_submission(student_id: str, file: UploadFile = File(...)):
    """
    CREATE:
    - Teacher uploads a PDF for a given student_id.
    - PDF is saved into teachflow/Input/.
    - Mock OCR is run (using cfg.DEMO_OCR_TEXT).
    - LLM grading is performed.
    - Final JSON is saved into teachflow/Final/{student_id}.json.
    - Final JSON is returned in the response.
    """
    # Basic file check
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save uploaded file into Input/
    pdf_path = INPUT_DIR / f"{student_id}.pdf"
    with pdf_path.open("wb") as f:
        content = await file.read()
        f.write(content)

    # Run MOCK OCR (real OCR will replace this later)
    ocr_text = run_ocr_mock_for_id(student_id, pdf_path)

    try:
        result_json = grade_single_student_essay(student_id, ocr_text)
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
