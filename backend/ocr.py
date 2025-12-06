from __future__ import annotations

import base64
from collections import defaultdict
from pathlib import Path
from typing import List, Tuple

import fitz  # PyMuPDF
from openai import OpenAI

from .cfg import OCR_MODEL_NAME, OCR_VERBATIM_PROMPT

# OpenAI client initialized once per module load
client = OpenAI()

# Type aliases
Job = Tuple[int, str]  # (id, pdf_path)
PageImage = Tuple[int, int, bytes]  # (id, page_index, image_bytes)
PageText = Tuple[int, int, str]  # (id, page_index, text)
Result = Tuple[int, str]  # (id, full_text)


def pdf_to_page_images(jobs: List[Job]) -> List[PageImage]:
    """Render each PDF page to PNG bytes and return list of (id, page_index, bytes)."""
    images: List[PageImage] = []

    for doc_id, pdf_path_str in jobs:
        pdf_path = Path(pdf_path_str)
        try:
            with fitz.open(pdf_path) as doc:
                for page_index in range(doc.page_count):
                    page = doc.load_page(page_index)
                    pix = page.get_pixmap()
                    images.append((doc_id, page_index, pix.tobytes("png")))
        except Exception as exc:
            print(f"[WARN] Failed to process PDF {pdf_path}: {exc}")
            continue

    return images


def ocr_page_with_openai(image_bytes: bytes) -> str:
    """Run OCR on a single page image using OpenAI vision model."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/png;base64,{b64}"

    response = client.chat.completions.create(
        model=OCR_MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": OCR_VERBATIM_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_url,
                        },
                    },
                ],
            }
        ],
    )

    message_content = response.choices[0].message.content

    if isinstance(message_content, str):
        return message_content.strip()

    parts: List[str] = []
    for part in message_content:
        if hasattr(part, "text"):
            parts.append(part.text)
        elif isinstance(part, dict) and "text" in part:
            parts.append(part["text"])
    return "\n".join(parts).strip()


def ocr_pages(page_images: List[PageImage]) -> List[PageText]:
    """Perform OCR on each page image sequentially."""
    results: List[PageText] = []
    for doc_id, page_index, img_bytes in page_images:
        text = ocr_page_with_openai(img_bytes)
        results.append((doc_id, page_index, text))
    return results


def assemble_documents(page_texts: List[PageText]) -> List[Result]:
    """Combine per-page OCR text into full document strings."""
    pages_by_doc: defaultdict[int, dict[int, str]] = defaultdict(dict)
    doc_order: List[int] = []

    for doc_id, page_index, text in page_texts:
        if doc_id not in pages_by_doc:
            doc_order.append(doc_id)
        pages_by_doc[doc_id][page_index] = text

    results: List[Result] = []
    for doc_id in doc_order:
        pages = pages_by_doc[doc_id]
        full_text_parts: List[str] = []
        for page_index in sorted(pages.keys()):
            page_text = pages[page_index]
            full_text_parts.append(f"===== PAGE {page_index + 1} =====")
            full_text_parts.append(page_text)
        joined = "\n\n".join(full_text_parts)
        results.append((doc_id, joined))

    return results


def run_pdf_ocr(jobs: List[Job]) -> List[Result]:
    """High-level orchestrator to run OCR on provided PDF jobs."""
    page_images = pdf_to_page_images(jobs)
    page_texts = ocr_pages(page_images)
    return assemble_documents(page_texts)


if __name__ == "__main__":
    example_jobs: list[Job] = [
        (1, "backend/data/pdfs/John Doe.pdf"),
    ]

    results = run_pdf_ocr(example_jobs)
    for doc_id, text in results:
        print(f"===== RESULT FOR DOCUMENT {doc_id} =====")
        print(text)
        print("\n" + "=" * 80 + "\n")

