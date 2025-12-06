"""
rawdata.py

Goal:
- Load students.json
- Scan all PDF files in a folder called "pdfs" (under data/)
- Each PDF is named "Surname Lastname.pdf"
- Normalize the name from both the JSON and the filename using .lower().strip()
- Match each student to their corresponding PDF
- Produce:
    1) A dict: { student_id: pdf_path_string }
    2) Optionally a list of dicts: [{ "id": ..., "pdf_path": ... }, ...]

Detailed instructions for Codex:
- Keep functions small and focused.
- Use pathlib for filesystem paths.
- Add basic warnings for missing matches.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List


# 1. Define constants for file locations
#    - STUDENTS_JSON: path to students.json
#    - PDF_DIR: folder containing the PDF files
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STUDENTS_JSON = DATA_DIR / "students.json"
PDF_DIR = DATA_DIR / "pdfs"


def _normalize_name(surname: str, lastname: str) -> str:
    """
    Internal helper:
    - Combine surname + lastname with a space: "Surname Lastname"
    - Convert to lowercase
    - Strip leading/trailing whitespace

    This must match the naming convention of the PDF files (without the .pdf).
    """
    full_name = f"{surname} {lastname}"
    return full_name.lower().strip()


def _normalize_filename_stem(stem: str) -> str:
    """
    Internal helper:
    - Take the filename stem (e.g. 'Doe John' from 'Doe John.pdf')
    - Convert to lowercase
    - Strip leading/trailing whitespace
    """
    return stem.lower().strip()


def load_students(path: Path = STUDENTS_JSON) -> List[dict]:
    """
    Step 1: Load students.json

    Expected JSON format:
    [
      { "id": "1", "surname": "Doe", "lastname": "John" },
      { "id": "2", "surname": "Smith", "lastname": "Jane" }
    ]

    Instructions:
    - Open the JSON file at `path`.
    - Parse it into a Python list of dicts.
    - Return that list.
    """
    with path.open("r", encoding="utf-8") as f:
        students = json.load(f)
    return students


def build_name_to_id_map(students: List[dict]) -> Dict[str, str]:
    """
    Step 2: Build a mapping from normalized 'surname lastname' -> student_id.

    Instructions:
    - Create an empty dict: name_map = {}
    - Loop over each student dict in `students`:
        - Read student["id"], student["surname"], student["lastname"]
        - Normalize the name using _normalize_name()
        - Store in the dict: name_map[normalized_name] = student_id
    - Return name_map

    Example result:
    {
      "doe john": "1",
      "smith jane": "2"
    }
    """
    name_map: Dict[str, str] = {}

    for s in students:
        student_id = str(s["id"])
        surname = s["surname"]
        lastname = s["lastname"]
        key = _normalize_name(surname, lastname)

        # If there are duplicates, last one wins. You can add checks if needed.
        name_map[key] = student_id

    return name_map


def scan_pdfs(pdf_dir: Path = PDF_DIR) -> List[Path]:
    """
    Step 3: Scan the PDF directory for all .pdf files.

    Instructions:
    - Ensure the folder exists (if not, raise an error or return empty list).
    - Use pdf_dir.glob("*.pdf") to list all PDF files.
    - Convert the result to a list and return.

    Example:
    [PosixPath('pdf/Doe John.pdf'), PosixPath('pdf/Smith Jane.pdf')]
    """
    if not pdf_dir.exists():
        raise FileNotFoundError(f"PDF directory not found: {pdf_dir}")

    pdf_files = list(pdf_dir.glob("*.pdf"))
    return pdf_files


def match_pdfs_to_ids(
    name_to_id: Dict[str, str],
    pdf_files: List[Path]
) -> Dict[str, str]:
    """
    Step 4: Match PDF files to student IDs using normalized names.

    Instructions:
    - Create an empty dict: id_to_pdf = {}
    - Loop over each pdf Path in pdf_files:
        - Take the stem (filename without extension): pdf.stem
          e.g. Path("pdf/Doe John.pdf").stem -> "Doe John"
        - Normalize with _normalize_filename_stem()
        - Look up that normalized name in `name_to_id`:
            - If found:
                - Get student_id = name_to_id[normalized_name]
                - Store id_to_pdf[student_id] = str(pdf.resolve()) or str(pdf)
            - If not found:
                - Optionally print a warning that no matching student was found.
    - Return id_to_pdf

    Example result:
    {
      "1": "pdf/Doe John.pdf",
      "2": "pdf/Smith Jane.pdf"
    }
    """
    id_to_pdf: Dict[str, str] = {}

    for pdf in pdf_files:
        stem = pdf.stem  # "Doe John"
        normalized = _normalize_filename_stem(stem)

        if normalized in name_to_id:
            student_id = name_to_id[normalized]
            id_to_pdf[student_id] = str(pdf)
            continue

        # Attempt a reversed name match (helps if files are "John Doe.pdf" instead of "Doe John.pdf")
        parts = normalized.split()
        if len(parts) == 2:
            reversed_name = " ".join(reversed(parts))
            if reversed_name in name_to_id:
                student_id = name_to_id[reversed_name]
                id_to_pdf[student_id] = str(pdf)
                continue

        # No matching student found for this PDF
        print(f"[WARN] No student match for PDF filename: {pdf.name}")

    return id_to_pdf


def id_pdf_pairs_as_list(id_to_pdf: Dict[str, str]) -> List[dict]:
    """
    Step 5 (optional): Convert the {id: pdf_path} dict into a list of dicts.

    Instructions:
    - Create a list of dicts, each with keys 'id' and 'pdf_path'.
    - Sort by id if you want stable ordering.

    Example output:
    [
      { "id": "1", "pdf_path": "pdf/Doe John.pdf" },
      { "id": "2", "pdf_path": "pdf/Smith Jane.pdf" }
    ]
    """
    pairs = [
        {"id": student_id, "pdf_path": pdf_path}
        for student_id, pdf_path in id_to_pdf.items()
    ]

    # Optional: sort by numeric id
    pairs.sort(key=lambda x: int(x["id"]))
    return pairs


def build_raw_data_mapping() -> Dict[str, str]:
    """
    High-level convenience function that runs the whole process:

    1. Load students.json
    2. Build name -> id map
    3. Scan PDF directory
    4. Match PDF files to student IDs
    5. Return {id: pdf_path} dict

    This is the function your later pipeline (OCR, LLM, etc.) will call.
    """
    students = load_students()
    name_to_id = build_name_to_id_map(students)
    pdf_files = scan_pdfs()
    id_to_pdf = match_pdfs_to_ids(name_to_id, pdf_files)
    return id_to_pdf


if __name__ == "__main__":
    """
    Manual test entrypoint:
    - Run this file directly to see the mapping printed.
    """
    mapping = build_raw_data_mapping()
    print("ID -> PDF mapping:")
    for sid, path in mapping.items():
        print(f"{sid}: {path}")

