/**
 * API service layer for communicating with the FastAPI backend.
 * All paths use the /api prefix which Vite proxies to http://localhost:8000
 */

// Types for backend responses
export interface BackendStudent {
    id: string;
    name: string;
}

export interface GradingIssue {
    type: 'grammar' | 'vocabulary' | 'structure' | 'content' | 'coherence';
    quote: string;
    comment: string;
    correction: string;
}

export interface GradingResult {
    student_id: string;
    student_name: string;
    essay_text: string;
    issues: GradingIssue[];
    grade: string;
    summary_feedback: string;
}

export interface FeedbackUpdate {
    grade: string;
    summary_feedback: string;
    issues?: GradingIssue[];
}

// API error class
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public detail?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Helper to handle response errors
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let detail: string | undefined;
        try {
            const errorData = await response.json();
            detail = errorData.detail;
        } catch {
            // Response body not JSON
        }
        throw new ApiError(
            `API request failed: ${response.status} ${response.statusText}`,
            response.status,
            detail
        );
    }
    return response.json();
}

/**
 * Fetch all students from the backend.
 * GET /api/students
 */
export async function fetchStudents(): Promise<BackendStudent[]> {
    const response = await fetch('/api/students');
    return handleResponse<BackendStudent[]>(response);
}

/**
 * Fetch a single student by ID.
 * GET /api/students/{studentId}
 */
export async function fetchStudent(studentId: string): Promise<BackendStudent> {
    const response = await fetch(`/api/students/${studentId}`);
    return handleResponse<BackendStudent>(response);
}

/**
 * Submit essay text for grading by the LLM.
 * POST /api/submissions/{studentId}
 */
export async function submitEssay(
    studentId: string,
    essayText: string
): Promise<GradingResult> {
    const response = await fetch(`/api/submissions/${studentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essay_text: essayText }),
    });
    return handleResponse<GradingResult>(response);
}

/**
 * Update feedback for a student (teacher edits).
 * PATCH /api/feedback/{studentId}
 */
export async function updateFeedback(
    studentId: string,
    feedback: FeedbackUpdate
): Promise<{ status: string; student_id: string }> {
    const response = await fetch(`/api/feedback/${studentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
    });
    return handleResponse<{ status: string; student_id: string }>(response);
}

/**
 * Get the final saved result for a student.
 * GET /api/results/{studentId}
 */
export async function getResult(studentId: string): Promise<GradingResult> {
    const response = await fetch(`/api/results/${studentId}`);
    return handleResponse<GradingResult>(response);
}

/**
 * Check if a result exists for a student (without throwing on 404).
 */
export async function hasResult(studentId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/results/${studentId}`);
        return response.ok;
    } catch {
        return false;
    }
}
