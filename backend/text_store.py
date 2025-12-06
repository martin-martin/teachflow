from __future__ import annotations
from typing import List, Tuple

# Internal in-memory storage of (student_id, essay_text) tuples.
# This is reset when the process restarts (good enough for hackathon).
_SUBMISSIONS: List[Tuple[str, str]] = []


def add_submission(student_id: str, essay_text: str) -> None:
    """
    Append a new (id, text) tuple to the global submissions list.
    """
    _SUBMISSIONS.append((str(student_id), str(essay_text)))


def get_submissions() -> List[Tuple[str, str]]:
    """
    Return a shallow copy of all stored (id, text) tuples.
    """
    return list(_SUBMISSIONS)

