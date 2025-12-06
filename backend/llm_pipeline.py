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

import cfg

# Path configuration
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
INPUT_DIR = PROJECT_ROOT / "Input"
OUTPUT_DIR = PROJECT_ROOT / "Output"
RESULTS_DIR = BASE_DIR / "results"


def _render_template(template: str, context: Dict[str, str]) -> str:
    """Simple {{placeholder}} replacement using provided context."""
    rendered = template
    for key, value in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
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
        Call the OpenAI model with a system and user prompt.

        Only max_completion_tokens is used for output control.
        """
        response = self.client.responses.create(
            model=self.model_name,
            max_completion_tokens=max_completion_tokens,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        # Extract text content from the first response item
        if hasattr(response, "output_text"):
            return response.output_text
        try:
            return "".join(block.text for block in response.output[0].content if hasattr(block, "text"))
        except Exception:
            raise RuntimeError("Unexpected response format from OpenAI.")

    def analyze_text(self, ocr_text: str, student: dict) -> dict:
        """
        Run the analysis chain to detect issues.
        Returns a dict with key 'issues' (list of issue dicts).
        """
        context = {
            "ocr_text": ocr_text,
            "full_name": f"{student.get('surname', '').strip()} {student.get('lastname', '').strip()}".strip(),
        }
        user_prompt = _render_template(cfg.ANALYSIS_PROMPT_TEMPLATE, context)
        system_prompt = (
            "You are a strict English teacher. You must be consistent, precise, and deterministic. "
            "Produce strict JSON with clear issues."
        )
        raw = self._call_llm(system_prompt, user_prompt)
        return json.loads(raw)

    def summarize_feedback(self, ocr_text: str, issues: List[dict], student: dict) -> dict:
        """
        Run the summary chain to produce grade and summary feedback.
        Returns a dict with keys 'grade' and 'summary_feedback'.
        """
        issues_json = json.dumps({"issues": issues}, ensure_ascii=False)
        context = {
            "ocr_text": ocr_text,
            "issues_json": issues_json,
            "surname": student.get("surname", "").strip(),
            "lastname": student.get("lastname", "").strip(),
            "full_name": f"{student.get('surname', '').strip()} {student.get('lastname', '').strip()}".strip(),
        }
        user_prompt = _render_template(cfg.SUMMARY_PROMPT_TEMPLATE, context)
        system_prompt = (
            "You are a strict English teacher. You must be consistent, precise, and deterministic. "
            "Produce strict JSON with grade and summary_feedback."
        )
        raw = self._call_llm(system_prompt, user_prompt)
        return json.loads(raw)

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


def run_llm_pipeline(raw_ocr_list: List[Tuple[str, str]], students_map: Dict[str, dict]) -> None:
    """
    Execute the LLM grading pipeline over a list of (student_id, ocr_text).
    Saves raw outputs to Output/, waits for manual edits in Input/, then saves final JSONs to backend/results/.
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
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

        # Minimal validation
        required_keys = {"grade", "summary_feedback", "issues"}
        if not required_keys.issubset(edited.keys()):
            print(f"[WARN] Edited JSON missing keys for ID {student_id}; expected {required_keys}")
            continue

        results_path = RESULTS_DIR / f"{student_id}.final.json"
        save_json(results_path, edited)
        print(f"Final JSON saved to {results_path}")


if __name__ == "__main__":
    # Simple self-test data
    sample_ocr = [("1", "hello world, is have today beautiful?")]
    sample_students = {"1": {"surname": "Doe", "lastname": "John"}}
    run_llm_pipeline(sample_ocr, sample_students)
