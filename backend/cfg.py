# cfg.py

"""
Developer-adjustable prompt templates for LLM analysis + summary.
These templates are used by llm_pipeline.py for deterministic,
strict JSON output from the model.
"""

# -------------------------------------------------------------
# ANALYSIS PROMPT
# -------------------------------------------------------------
# Input placeholders:
#   {{ocr_text}}
#   {{full_name}}
ANALYSIS_PROMPT_TEMPLATE = """
You must read the following student essay and identify all concrete issues.
Each issue must include:
  - type: grammar | vocabulary | structure | content | coherence
  - quote: an exact short excerpt from the essay showing the issue
  - comment: what is wrong
  - correction: the corrected version

Rules:
- Output STRICT JSON. Do not include explanations or comments outside JSON.
- Do not invent text. Only quote real text from the essay.
- Deterministic output. No creativity. No variations.
- JSON object must look like:
  {
    "issues": [
      {
        "type": "...",
        "quote": "...",
        "comment": "...",
        "correction": "..."
      }
    ]
  }

Student name: {{full_name}}

Essay:
{{ocr_text}}
"""

# -------------------------------------------------------------
# SUMMARY PROMPT
# -------------------------------------------------------------
# Input placeholders:
#   {{ocr_text}}
#   {{issues_json}}
#   {{surname}}
#   {{lastname}}
#   {{full_name}}
SUMMARY_PROMPT_TEMPLATE = """
You are given:
- The full essay text
- A list of issues found in the essay (JSON)

Your task:
- Produce a grade (string)
- Produce a short summary_feedback (max 3 sentences)
- Output STRICT JSON, no commentary, no prose outside JSON.

JSON format:
{
  "grade": "...",
  "summary_feedback": "..."
}

Student: {{full_name}}

Essay:
{{ocr_text}}

Issues detected:
{{issues_json}}
"""

# -------------------------------------------------------------
# MOCK OCR TEXT FOR DEV / TESTING
# -------------------------------------------------------------
DEMO_OCR_TEXT = """
This is a demo OCR output text. Replace this with any text you want
to simulate the result of OCR for testing the LLM pipeline.
"""

# -------------------------------------------------------------
# DEMO OCR PAIRS FOR PIPELINE TESTING
# -------------------------------------------------------------
# List of (student_id, ocr_text) tuples to drive the LLM pipeline
# during testing. Edit this in development to simulate different
# OCR outputs per student.
#
# Example:
# DEMO_OCR_PAIRS = [
#     ("1", "This is the essay text for student 1."),
#     ("2", "This is the essay text for student 2.")
# ]
DEMO_OCR_PAIRS = [
    ("1", "This is a demo essay for student 1. You can change this in cfg.py."),
]
