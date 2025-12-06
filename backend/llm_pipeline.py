"""
LLM grading pipeline for analyzing OCR'd student essays and producing feedback.

Prompts are sourced from cfg.py (ANALYSIS_PROMPT_TEMPLATE, SUMMARY_PROMPT_TEMPLATE)
so they can be adjusted without touching this file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import logging
from typing import Dict, List, Tuple

from google import genai
from google.genai import types
from pydantic import BaseModel

from . import cfg

DEBUG = False  # set True to print raw LLM output
logger = logging.getLogger(__name__)


# Pydantic models for structured JSON responses
class Issue(BaseModel):
    type: str
    quote: str
    comment: str
    correction: str


class AnalysisResponse(BaseModel):
    issues: List[Issue]


class SummaryResponse(BaseModel):
    grade: str
    summary_feedback: str

# Path configuration aligned to the Hackathon root:
# Hackathon/
#   teachflow/
#     backend/  <-- this file lives here
#   Input/
#   Output/
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
INPUT_DIR = PROJECT_ROOT / "Input"
OUTPUT_DIR = PROJECT_ROOT / "Output"
DB_MOCKUP_DIR = PROJECT_ROOT / "db_mockup"


def _render_template(template: str, context: Dict[str, str]) -> str:
    """Simple {{placeholder}} replacement using provided context."""
    rendered = template
    for key, value in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    # Escape double braces inside OCR text or content that might break substitution
    rendered = rendered.replace("{{{{", "{").replace("}}}}", "}")
    # Guarantee no accidental placeholder leftovers
    for key in ["ocr_text", "full_name", "issues_json", "surname", "lastname"]:
        rendered = rendered.replace(f"{{{{{key}}}}}", "")
    return rendered


def save_json(path: Path, data: dict) -> None:
    """Save a dict as JSON, creating parent directories if needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_json(path: Path) -> dict:
    """Load JSON data from a file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


class LLMGrader:
    """Handles the two-step LLM grading process."""

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or cfg.LLM_MODEL_NAME
        api_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GOOGLE_GENAI_API_KEY")
        )
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable is not set.")
        self.client = genai.Client(api_key=api_key)
        # Keep temperature deterministic for repeatable JSON output
        self.base_generation_config = {"temperature": 0}

    def _call_llm(self, system_prompt: str, user_prompt: str, response_schema: type[BaseModel], max_completion_tokens: int = 8000):
        """
        Stable call to the Google Gemini API using the latest SDK patterns with structured output.
        Returns the parsed response object matching the response_schema.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=self.base_generation_config.get("temperature", 0),
                    max_output_tokens=max_completion_tokens,
                    response_mime_type='application/json',
                    response_schema=response_schema,
                    # Disable thinking to save tokens for actual JSON output
                    # Note: thinking_config only works with Gemini 2.5 series models
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            
            # Check for errors
            if getattr(response, "error", None):
                logger.error("Gemini API returned error: %s", response.error)
                raise RuntimeError(f"Gemini API error: {response.error}")
            
            # Use the parsed response (automatically validated against schema)
            if hasattr(response, "parsed") and response.parsed:
                return response.parsed
            
            # Fallback to manual parsing if parsed not available
            if hasattr(response, "text") and response.text:
                return response_schema.model_validate_json(response.text)
            
            raise RuntimeError("No valid response from Gemini API")
            
        except Exception as exc:
            logger.exception("Error calling Gemini API: %s", exc)
            raise RuntimeError(f"Failed to call Gemini API: {exc}") from exc

    def analyze_text(self, ocr_text: str, student: dict) -> dict:
        """
        Run the analysis chain to detect issues.
        Returns a dict with key 'issues' (list of issue dicts).
        """
        surname = str(student.get("surname", "")).strip()
        lastname = str(student.get("lastname", "")).strip()
        full_name = f"{surname} {lastname}".strip()
        context = {
            "ocr_text": ocr_text,
            "full_name": full_name,
        }
        user_prompt = _render_template(cfg.ANALYSIS_PROMPT_TEMPLATE, context)
        system_prompt = cfg.LLM_SYSTEM_PROMPT
        
        # Call LLM with structured output schema
        parsed_response = self._call_llm(system_prompt, user_prompt, response_schema=AnalysisResponse)
        
        if DEBUG:
            print("----- PARSED MODEL OUTPUT -----")
            print(parsed_response)
            print("----- END OUTPUT -------")
        
        # Convert Pydantic model to dict
        return parsed_response.model_dump()

    def summarize_feedback(self, ocr_text: str, issues: List[dict], student: dict) -> dict:
        """
        Run the summary chain to produce grade and summary feedback.
        Returns a dict with keys 'grade' and 'summary_feedback'.
        """
        issues_json = json.dumps({"issues": issues}, ensure_ascii=False)
        surname = str(student.get("surname", "")).strip()
        lastname = str(student.get("lastname", "")).strip()
        full_name = f"{surname} {lastname}".strip()
        context = {
            "ocr_text": ocr_text,
            "issues_json": issues_json,
            "surname": surname,
            "lastname": lastname,
            "full_name": full_name,
        }
        user_prompt = _render_template(cfg.SUMMARY_PROMPT_TEMPLATE, context)
        system_prompt = cfg.LLM_SYSTEM_PROMPT
        
        # Call LLM with structured output schema
        parsed_response = self._call_llm(system_prompt, user_prompt, response_schema=SummaryResponse)
        
        if DEBUG:
            print("----- PARSED MODEL OUTPUT -----")
            print(parsed_response)
            print("----- END OUTPUT -------")
        
        # Convert Pydantic model to dict
        return parsed_response.model_dump()

    @staticmethod
    def build_final_json(student_id: str, student: dict, issues: List[dict], summary: dict) -> dict:
        """Combine issues and summary into the final schema."""
        return {
            "student_id": student_id,
            "name": f"{student.get('surname', '').strip()} {student.get('lastname', '').strip()}".strip(),
            "grade": summary.get("grade"),
            "summary_feedback": summary.get("summary_feedback"),
            "issues": issues,
        }


def grade_single_student_essay(student_id: str, essay_text: str) -> dict:
    """
    Convenience function for FastAPI:
    - Looks up student info from cfg.STUDENTS
    - Runs analysis + summary via LLMGrader
    - Returns the final JSON result as a dict.

    This does NOT write any files. It is pure logic.
    """
    students = build_students_map_from_cfg()
    student = students.get(str(student_id))
    if not student:
        raise ValueError(f"No student found for ID {student_id}")

    grader = LLMGrader()

    # Step 1: analysis (issues)
    analysis = grader.analyze_text(essay_text, student)
    issues = analysis.get("issues", [])
    if not isinstance(issues, list):
        issues = []

    # Step 2: summary (grade + summary_feedback)
    summary = grader.summarize_feedback(essay_text, issues, student)

    # Build final JSON
    final_json = grader.build_final_json(str(student_id), student, issues, summary)
    return final_json


def build_students_map_from_cfg() -> Dict[str, dict]:
    """
    Helper to build a {student_id: student_dict} map from cfg.STUDENTS.

    Each value in cfg.STUDENTS is a full name string "Surname Lastname".
    We split it into surname / lastname for compatibility with the prompts.
    """
    students: Dict[str, dict] = {}

    for sid, full_name in cfg.STUDENTS.items():
        full_name = str(full_name).strip()
        parts = full_name.split(maxsplit=1)
        if len(parts) == 2:
            surname, lastname = parts
        elif len(parts) == 1:
            surname, lastname = parts[0], ""
        else:
            surname, lastname = "", ""

        students[str(sid)] = {
            "id": str(sid),
            "surname": surname,
            "lastname": lastname,
            "full_name": full_name,
        }

    return students


def run_llm_pipeline(raw_ocr_list: List[Tuple[str, str]], students_map: Dict[str, dict]) -> None:
    """
    Execute the LLM grading pipeline over a list of (student_id, ocr_text).
    Saves raw outputs to Output/, waits for manual edits in Input/, then saves final JSONs to db_mockup/.
    """
    DB_MOCKUP_DIR.mkdir(parents=True, exist_ok=True)
    # Ensure all student IDs in students_map are strings
    students_map = {str(k): v for k, v in students_map.items()}
    grader = LLMGrader()

    for student_id, ocr_text in raw_ocr_list:
        student = students_map.get(student_id)
        if not student:
            print(f"[WARN] No student info found for ID {student_id}, skipping.")
            continue

        print(f"Running analysis for ID {student_id}...")
        try:
            analysis = grader.analyze_text(ocr_text, student)
        except Exception as exc:
            print(f"[ERROR] Analysis failed for ID {student_id}: {exc}")
            continue

        issues = analysis.get("issues", [])

        print(f"Running summary for ID {student_id}...")
        try:
            summary = grader.summarize_feedback(ocr_text, issues, student)
        except Exception as exc:
            print(f"[ERROR] Summary failed for ID {student_id}: {exc}")
            continue

        final_json = grader.build_final_json(student_id, student, issues, summary)

        # Save raw LLM outputs
        raw_output_path = OUTPUT_DIR / f"{student_id}.json"
        save_json(raw_output_path, final_json)

        # Provide an editable copy for the simulated frontend
        editable_input_path = INPUT_DIR / f"{student_id}.json"
        save_json(editable_input_path, final_json)

        print(f"Raw LLM JSON saved to {raw_output_path}")
        print(f"Editable JSON prepared at {editable_input_path}")

        # Wait for manual editing
        input("Please edit the file now, then press ENTER to continue...")

        # Load edited JSON
        try:
            edited = load_json(editable_input_path)
        except Exception as exc:
            print(f"[ERROR] Failed to load edited JSON for ID {student_id}: {exc}")
            continue

        required_keys = {"grade", "summary_feedback", "issues"}
        missing = required_keys - set(edited.keys())
        if missing:
            print(f"[WARN] Edited JSON missing keys {missing} for ID {student_id}")
            print("Edited JSON was:", edited)
            continue

        if not isinstance(edited["issues"], list):
            print(f"[WARN] 'issues' must be a list for ID {student_id}")
            continue

        # Check issues structure
        for issue in edited["issues"]:
            if not isinstance(issue, dict):
                print(f"[WARN] Issue is not a dict in ID {student_id}")
                break

        edited["grade"] = str(edited.get("grade", "")).strip()
        edited["summary_feedback"] = str(edited.get("summary_feedback", "")).strip()

        results_path = DB_MOCKUP_DIR / f"{student_id}.final.json"
        save_json(results_path, edited)
        print(f"Final JSON saved to {results_path}")


if __name__ == "__main__":
    """
    CLI test entrypoint:

    - Uses cfg.DEMO_ESSAY_PAIRS as the essay input.
    - Uses cfg.STUDENTS to resolve student metadata.
    - Runs the full LLM pipeline and writes:
        - Output/{id}.json
        - db_mockup/{id}.final.json (after manual edit step).
    """
    raw_ocr_list = [(str(sid), str(text)) for sid, text in cfg.DEMO_ESSAY_PAIRS]
    students_map = build_students_map_from_cfg()

    print("Running LLM pipeline with demo essay pairs from cfg.DEMO_ESSAY_PAIRS...")
    print("Pairs:", raw_ocr_list)
    run_llm_pipeline(raw_ocr_list, students_map)
