"""
LLM grading pipeline for analyzing OCR'd student essays and producing feedback.

Prompts are sourced from cfg.py (ANALYSIS_PROMPT_TEMPLATE, SUMMARY_PROMPT_TEMPLATE)
so they can be adjusted without touching this file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

from openai import OpenAI

from . import cfg

DEBUG = False  # set True to print raw LLM output

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
RESULTS_DIR = PROJECT_ROOT / "Final"


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

    def __init__(self, model_name: str = "gpt-5.1") -> None:
        self.model_name = model_name
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set.")
        self.client = OpenAI(api_key=api_key)

    def _call_llm(self, system_prompt: str, user_prompt: str, max_completion_tokens: int = 1500) -> str:
        """
        Stable call to the OpenAI Responses API.
        This SDK version requires max_output_tokens (NOT max_completion_tokens).
        """
        response = self.client.responses.create(
            model=self.model_name,
            max_output_tokens=max_completion_tokens,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        # Preferred (automatic) text extraction
        if hasattr(response, "output_text") and response.output_text:
            return response.output_text

        # Fallback: extract block text
        try:
            chunks = []
            for msg in response.output:
                if hasattr(msg, "content"):
                    for block in msg.content:
                        if hasattr(block, "text"):
                            chunks.append(block.text)
            if chunks:
                return "".join(chunks)
        except Exception:
            pass

        # Final fallback: debug string
        return str(response)

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
        system_prompt = (
            "You are a strict English teacher. "
            "Your output must be deterministic, consistent, and strictly JSON without commentary. "
            "Never include natural language outside JSON. "
            "Do not add explanations. "
            "Do not be creative. "
        )
        raw = self._call_llm(system_prompt, user_prompt)
        if DEBUG:
            print("----- RAW MODEL OUTPUT -----")
            print(raw)
            print("----- END RAW OUTPUT -------")
        raw = raw.strip()
        # Remove markdown fencing if the model wrapped JSON in ```json ... ```
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1].strip() if len(parts) > 1 else raw
        # Remove ```json or ``` lines anywhere, not only at start
        if "```" in raw:
            parts = raw.split("```")
            # choose the middle or largest block (heuristic)
            raw = max(parts, key=len).strip()

        # Remove potential trailing commas
        raw = raw.replace(",}", "}")
        raw = raw.replace(",]", "]")

        # Remove leading/trailing semicolons or stray characters
        raw = raw.lstrip(";").strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            print(f"[ERROR] Invalid JSON returned by model for student {student.get('surname', '')}: {exc}")
            print("----- RAW MODEL OUTPUT START -----")
            print(raw)
            print("----- RAW MODEL OUTPUT END -----")
            raise

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
        system_prompt = (
            "You are a strict English teacher. "
            "Your output must be deterministic, consistent, and strictly JSON without commentary. "
            "Never include natural language outside JSON. "
            "Do not add explanations. "
            "Do not be creative. "
        )
        raw = self._call_llm(system_prompt, user_prompt)
        if DEBUG:
            print("----- RAW MODEL OUTPUT -----")
            print(raw)
            print("----- END RAW OUTPUT -------")
        raw = raw.strip()
        # Remove markdown fencing if the model wrapped JSON in ```json ... ```
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1].strip() if len(parts) > 1 else raw
        # Remove ```json or ``` lines anywhere, not only at start
        if "```" in raw:
            parts = raw.split("```")
            # choose the middle or largest block (heuristic)
            raw = max(parts, key=len).strip()

        # Remove potential trailing commas
        raw = raw.replace(",}", "}")
        raw = raw.replace(",]", "]")

        # Remove leading/trailing semicolons or stray characters
        raw = raw.lstrip(";").strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            print(f"[ERROR] Invalid JSON returned by model for student {student.get('surname', '')}: {exc}")
            print("----- RAW MODEL OUTPUT START -----")
            print(raw)
            print("----- RAW MODEL OUTPUT END -----")
            raise

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


def grade_single_student_essay(student_id: str, ocr_text: str) -> dict:
    """
    Convenience function for FastAPI:
    - Looks up student info (surname, lastname) from rawdata/students.json
    - Runs analysis + summary via LLMGrader
    - Returns the final JSON result as a dict.

    This does NOT write any files. It is pure logic.
    """
    from . import rawdata  # local import to avoid circular imports at module load

    # Load students and build map {id: student_dict}
    students = rawdata.load_students()
    student_map = {str(s["id"]): s for s in students}

    student = student_map.get(str(student_id))
    if not student:
        raise ValueError(f"No student found for ID {student_id}")

    grader = LLMGrader()

    # Step 1: analysis (issues)
    analysis = grader.analyze_text(ocr_text, student)
    issues = analysis.get("issues", [])
    if not isinstance(issues, list):
        issues = []

    # Step 2: summary (grade + summary_feedback)
    summary = grader.summarize_feedback(ocr_text, issues, student)

    # Build final JSON
    final_json = grader.build_final_json(str(student_id), student, issues, summary)
    return final_json


def build_students_map_from_rawdata() -> Dict[str, dict]:
    """
    Helper to build a {student_id: student_dict} map from rawdata.load_students().
    Used for CLI / manual testing of the LLM pipeline.
    """
    try:
        from . import rawdata
    except ImportError:
        # Fallback if relative import fails (e.g. running as script)
        import rawdata  # type: ignore

    students = rawdata.load_students()
    return {str(s["id"]): s for s in students}


def run_llm_pipeline(raw_ocr_list: List[Tuple[str, str]], students_map: Dict[str, dict]) -> None:
    """
    Execute the LLM grading pipeline over a list of (student_id, ocr_text).
    Saves raw outputs to Output/, waits for manual edits in Input/, then saves final JSONs to backend/results/.
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
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

        results_path = RESULTS_DIR / f"{student_id}.final.json"
        save_json(results_path, edited)
        print(f"Final JSON saved to {results_path}")


if __name__ == "__main__":
    """
    CLI test entrypoint:

    - Uses cfg.DEMO_OCR_PAIRS (via ocr_mock.get_demo_ocr_pairs) as the OCR output.
    - Uses students.json (via rawdata.load_students) to resolve student metadata.
    - Runs the full LLM pipeline and writes:
        - Output/{id}.json
        - Final/{id}.final.json (after manual edit step).
    """
    try:
        from .ocr_mock import get_demo_ocr_pairs
    except ImportError:
        # Fallback if relative import fails (e.g. running as script)
        from ocr_mock import get_demo_ocr_pairs  # type: ignore

    raw_ocr_list = get_demo_ocr_pairs()
    students_map = build_students_map_from_rawdata()

    print("Running LLM pipeline with demo OCR pairs from cfg.DEMO_OCR_PAIRS...")
    print("Pairs:", raw_ocr_list)
    run_llm_pipeline(raw_ocr_list, students_map)
