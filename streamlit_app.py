from typing import Any, Dict, List

import requests
import streamlit as st


# Hide all Streamlit warnings (stAlert elements)
st.markdown("""
    <style>
        .stAlert {display: none !important;}
    </style>
""", unsafe_allow_html=True)


API_BASE = "http://127.0.0.1:8000"

# ---------- Session state ----------

if "results" not in st.session_state:
    st.session_state["results"] = {}  # per-student final JSON returned from backend

if "saved_overview" not in st.session_state:
    st.session_state["saved_overview"] = []  # list of {"student": {...}, "result": {...}}


# ---------- Helpers ----------

@st.cache_data
def fetch_students():
    """Load list of students from FastAPI /students."""
    try:
        resp = requests.get(f"{API_BASE}/students", timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        st.error(f"Failed to fetch students: {e}")
        return []


def submit_essay(student_id: str, essay_text: str, assignment_task: str | None = None):
    """Send essay text (and optional assignment task) to backend and return the grading JSON."""
    payload = {"essay_text": essay_text}
    if assignment_task:
        payload["assignment_task"] = assignment_task

    resp = requests.post(
        f"{API_BASE}/submissions/{student_id}",
        json=payload,
        timeout=30,
    )
    if resp.status_code != 200:
        try:
            detail = resp.json().get("detail")
        except Exception:
            detail = resp.text
        raise RuntimeError(f"Backend error ({resp.status_code}): {detail}")
    return resp.json()


def fetch_result(student_id: str):
    """Fetch last stored result for a student (if your backend exposes /results/{id})."""
    resp = requests.get(f"{API_BASE}/results/{student_id}", timeout=10)
    if resp.status_code != 200:
        try:
            detail = resp.json().get("detail")
        except Exception:
            detail = resp.text
        raise RuntimeError(f"Could not load result: {detail}")
    return resp.json()


def save_feedback(
    student_id: str,
    grade: str,
    summary_feedback: str,
    issues: List[Dict[str, Any]],
) -> dict:
    payload = {
        "grade": grade,
        "summary_feedback": summary_feedback,
        "issues": issues,
    }
    resp = requests.patch(f"{API_BASE}/feedback/{student_id}", json=payload, timeout=10)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to save feedback: {resp.status_code} {resp.text}")
    return resp.json()


def fetch_all_results(students: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Load /results/{id} for each student; skip missing ones.
    Returns a list of {"student": {...}, "result": {...}}.
    """
    items: List[Dict[str, Any]] = []
    for s in students:
        sid = str(s["id"])
        try:
            resp = requests.get(f"{API_BASE}/results/{sid}", timeout=10)
        except Exception:
            continue
        if resp.status_code == 200:
            try:
                data = resp.json()
            except Exception:
                continue
            items.append({"student": s, "result": data})
    return items


def load_result_into_editor(student_id: str, result: dict) -> None:
    """
    Put the current result into both session_state['results'] and the
    per-student Streamlit widget state for grade + summary.
    """
    sid = str(student_id)
    st.session_state["results"][sid] = result or {}
    st.session_state[f"grade_{sid}"] = str(result.get("grade", "") or "")
    st.session_state[f"summary_{sid}"] = str(result.get("summary_feedback", "") or "")


# ---------- UI ----------

st.set_page_config(page_title="TeachFlow - Essay Grader", layout="wide")

st.title("TeachFlow - AI-Assisted Essay Feedback")

# Sidebar: student selection and saved marks overview
with st.sidebar:
    st.header("Student selection")

    students = fetch_students()
    if not students:
        st.warning("No students loaded. Check backend /students.")
        st.stop()

    student_options = {f"{s['id']} - {s['name']}": s["id"] for s in students}
    selected_label = st.selectbox("Student", list(student_options.keys()))
    selected_id = str(student_options[selected_label])

    st.markdown("---")
    refresh_overview = st.button("Refresh saved marks")

    if refresh_overview:
        st.session_state["saved_overview"] = fetch_all_results(students)

    st.markdown("### Saved marks overview")

    for item in st.session_state.get("saved_overview", []):
        s = item["student"]
        r = item["result"]

        grade = r.get("grade") or "N/A"
        header = f"{s['name']} - {grade}"

        with st.expander(header):
            summary = r.get("summary_feedback", "")
            if summary:
                st.write(f"**Summary:** {summary}")

            issues = r.get("issues", []) or []
            if issues:
                st.write("**Issues:**")
                for idx, issue in enumerate(issues, start=1):
                    issue_type = issue.get("type", "issue")
                    quote = issue.get("quote", "")
                    comment = issue.get("comment", "")
                    correction = issue.get("correction", "")

                    st.markdown(
                        f"- **{idx}. {issue_type.capitalize()}**  \n"
                        f'  - *Quote:* "{quote}"  \n'
                        f"  - *Comment:* {comment}  \n"
                        f"  - *Correction:* {correction}"
                    )

# Main area: essay input, grading, loading, and editing
st.subheader(f"Essay for student {selected_id}")

st.subheader("0. Assignment task (what was the homework?)")
assignment_task = st.text_area(
    "Assignment task / question (optional)",
    value="Paste the original homework prompt here so the AI can grade relative to it.",
    height=120,
)

st.subheader("1. Paste the student's essay")
essay_text = st.text_area("Essay text", height=300)

col1, col2 = st.columns(2)
with col1:
    if st.button("Grade essay"):
        if not essay_text.strip():
            st.warning("Please paste an essay first.")
        else:
            with st.spinner("Grading essay..."):
                try:
                    result = submit_essay(
                        selected_id,
                        essay_text.strip(),
                        assignment_task.strip() or None,
                    )
                except Exception as exc:
                    st.error(exc)
                else:
                    load_result_into_editor(selected_id, result)
                    st.success("Grading completed and feedback loaded.")

with col2:
    if st.button("Load last saved result for this student"):
        with st.spinner("Loading saved result..."):
            try:
                existing = fetch_result(selected_id)
            except Exception as exc:
                st.error(exc)
                existing = None
        if existing:
            load_result_into_editor(selected_id, existing)
            st.success("Loaded last saved result.")
        else:
            st.info("No saved result for this student yet.")

current_result = st.session_state["results"].get(selected_id)

if current_result:
    st.markdown("## Feedback editor")

    grade_key = f"grade_{selected_id}"
    summary_key = f"summary_{selected_id}"

    grade_value = st.text_input(
        "Grade",
        key=grade_key,
        value=st.session_state.get(grade_key, current_result.get("grade", "")),
    )

    summary_value = st.text_area(
        "Summary feedback",
        key=summary_key,
        height=150,
        value=st.session_state.get(summary_key, current_result.get("summary_feedback", "")),
    )

    st.markdown("### Detected issues (editable)")
    issues = current_result.get("issues", []) or []
    editable_issues_keys: List[str] = []

    if not issues:
        st.info("No issues detected yet. You can still adjust grade and summary.")
    else:
        for idx, issue in enumerate(issues, start=1):
            issue_type = issue.get("type", "issue")
            quote = issue.get("quote", "")
            comment = issue.get("comment", "")
            correction = issue.get("correction", "")
            base_key = f"issue_{selected_id}_{idx}"

            st.session_state.setdefault(f"{base_key}_type", str(issue_type))
            st.session_state.setdefault(f"{base_key}_quote", str(quote))
            st.session_state.setdefault(f"{base_key}_comment", str(comment))
            st.session_state.setdefault(f"{base_key}_correction", str(correction))
            st.session_state.setdefault(f"{base_key}_delete", False)

            editable_issues_keys.append(base_key)

            header = f"Issue {idx}: {st.session_state.get(f'{base_key}_type', '') or 'Unspecified'}"

            with st.expander(header, expanded=False):
                st.text_input(
                    "Type (e.g. Grammar, Vocabulary, Content, Structure)",
                    key=f"{base_key}_type",
                )
                st.text_area(
                    "Quote",
                    key=f"{base_key}_quote",
                    height=80,
                )
                st.text_area(
                    "Comment",
                    key=f"{base_key}_comment",
                    height=80,
                )
                st.text_area(
                    "Suggested correction",
                    key=f"{base_key}_correction",
                    height=80,
                )
                st.checkbox(
                    "Delete this issue",
                    key=f"{base_key}_delete",
                )

    if st.button("Save edited feedback"):
        cleaned_grade = (grade_value or "").strip()
        cleaned_summary = (summary_value or "").strip()

        if not cleaned_grade or not cleaned_summary:
            st.warning("Grade and summary feedback must not be empty.")
        else:
            updated_issues: List[Dict[str, Any]] = []
            for base_key in editable_issues_keys:
                if st.session_state.get(f"{base_key}_delete", False):
                    continue
                updated_issues.append(
                    {
                        "type": st.session_state.get(f"{base_key}_type", "").strip(),
                        "quote": st.session_state.get(f"{base_key}_quote", "").strip(),
                        "comment": st.session_state.get(f"{base_key}_comment", "").strip(),
                        "correction": st.session_state.get(f"{base_key}_correction", "").strip(),
                    }
                )

            try:
                with st.spinner("Saving edited feedback..."):
                    resp = save_feedback(selected_id, cleaned_grade, cleaned_summary, updated_issues)
                current_result["grade"] = cleaned_grade
                current_result["summary_feedback"] = cleaned_summary
                current_result["issues"] = updated_issues
                st.session_state["results"][selected_id] = current_result
                st.success("Feedback and issues saved successfully.")
            except Exception as exc:
                st.error(f"Failed to save feedback: {exc}")
