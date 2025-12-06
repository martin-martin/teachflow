import requests
import streamlit as st

API_BASE = "http://127.0.0.1:8000"


# ---------- Helpers ----------

@st.cache_data
def fetch_students():
    """Load list of students from FastAPI /students."""
    try:
        resp = requests.get(f"{API_BASE}/students", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # Expecting: [{"id": "1", "name": "Surname Lastname"}, ...]
        return data
    except Exception as e:
        st.error(f"Failed to fetch students: {e}")
        return []


def submit_essay(student_id: str, essay_text: str):
    """Send essay text to backend and return the grading JSON."""
    payload = {"essay_text": essay_text}
    resp = requests.post(
        f"{API_BASE}/submissions/{student_id}",
        json=payload,
        timeout=30,
    )
    if resp.status_code != 200:
        # FastAPI uses {"detail": "..."} for errors
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


# ---------- UI ----------

st.set_page_config(page_title="TeachFlow – Essay Grader", layout="wide")

st.title("TeachFlow – AI-Assisted Essay Grading")

# Sidebar: student selection
st.sidebar.header("Student selection")

students = fetch_students()
if not students:
    st.sidebar.warning("No students loaded. Check backend /students.")
    st.stop()

# Map display string to ID
student_options = {
    f"{s['id']} – {s['name']}": s["id"] for s in students
}
selected_label = st.sidebar.selectbox(
    "Choose a student", list(student_options.keys())
)
selected_id = student_options[selected_label]

st.sidebar.markdown(f"**Selected ID:** `{selected_id}`")

st.sidebar.markdown("---")
load_existing = st.sidebar.button("Load last saved result")

# Main area: essay input + actions
st.subheader("1. Paste the student's essay")

default_placeholder = (
    "Paste the student's essay here.\n"
    "This can be any English text – the backend will call the LLM "
    "with the configured prompts in cfg.py."
)

essay_text = st.text_area(
    "Essay text",
    value=default_placeholder,
    height=300,
)

st.subheader("2. Run AI grading")

col1, col2 = st.columns(2)
with col1:
    grade_btn = st.button("Generate feedback")

with col2:
    st.caption("The result JSON is stored on the backend (Final/{id}.json).")

result_container = st.container()

# ---------- Actions ----------

if load_existing:
    with st.spinner("Loading last result from backend..."):
        try:
            result = fetch_result(selected_id)
        except Exception as e:
            st.error(e)
        else:
            with result_container:
                st.success("Loaded existing result.")
                st.json(result)

elif grade_btn:
    cleaned = essay_text.strip()
    if not cleaned or cleaned == default_placeholder:
        st.error("Please paste a real essay before grading.")
    else:
        with st.spinner("Calling backend /submissions and grading essay..."):
            try:
                result = submit_essay(selected_id, cleaned)
            except Exception as e:
                st.error(e)
            else:
                with result_container:
                    st.success("Grading completed.")
                    # Display key parts nicely
                    grade = result.get("grade")
                    summary = result.get("summary_feedback")
                    issues = result.get("issues", [])

                    if grade is not None:
                        st.markdown(f"### Grade: **{grade}**")
                    if summary:
                        st.markdown("#### Summary feedback")
                        st.write(summary)

                    st.markdown("#### Detailed issues")
                    if not issues:
                        st.info("No issues returned by the model.")
                    else:
                        for idx, issue in enumerate(issues, start=1):
                            with st.expander(f"Issue {idx}: {issue.get('type', 'unknown')}"):
                                st.write("**Quote:**", issue.get("quote"))
                                st.write("**Comment:**", issue.get("comment"))
                                st.write("**Correction:**", issue.get("correction"))

                    st.markdown("#### Raw JSON")
                    st.json(result)
