from pathlib import Path
from typing import List, Tuple
import cfg



def run_ocr_mock_for_id(student_id: str, pdf_path: Path | None = None) -> str:
    """
    Mock OCR function for development.

    - Uses cfg.DEMO_ESSAY_PAIRS to return a specific OCR text for a given student_id.
    - Falls back to cfg.DEMO_OCR_TEXT if no matching entry is found.

    pdf_path is accepted so the signature remains compatible with a future real OCR.
    """
    sid = str(student_id)
    for pair_id, text in cfg.DEMO_ESSAY_PAIRS:
        if str(pair_id) == sid:
            return str(text).strip()

    # Fallback: single shared demo text
    return cfg.DEMO_OCR_TEXT.strip()


def get_demo_ocr_pairs() -> List[Tuple[str, str]]:
    """
    Return the list of (student_id, ocr_text) pairs defined in cfg.DEMO_ESSAY_PAIRS.

    This is used for CLI / pipeline testing: run_llm_pipeline(get_demo_ocr_pairs(), students_map)
    """
    return [(str(sid), str(text)) for sid, text in cfg.DEMO_ESSAY_PAIRS]

