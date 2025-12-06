export interface Teacher {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  rubricType: 'essay' | 'short-answer' | 'code';
  dueDate: string;
  className: string;
  studentCount: number;
  gradedCount: number;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  className: string;
}

export interface Question {
  id: string;
  assignmentId: string;
  index: number;
  prompt: string;
}

export interface Answer {
  id: string;
  submissionId: string;
  questionId: string;
  content: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  createdAt: string;
}

// PDF Submission types for OCR workflow
export type OcrStatus = 'pending' | 'processing' | 'done' | 'error';
export type MatchStatus = 'matched' | 'unmatched' | 'ambiguous';

export interface PdfSubmission {
  id: string;
  assignmentId: string;
  studentId: string | null;
  fileName: string;
  fileUrl: string;
  ocrText: string;
  detectedStudentName: string;
  matchStatus: MatchStatus;
  ocrStatus: OcrStatus;
  createdAt: string;
  totalPages: number;
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface Feedback {
  id: string;
  submissionId: string;
  questionId: string;
  pdfSubmissionId?: string;
  overall: string;
  strengths: string;
  weaknesses: string;
  nextSteps: string;
  rubricScores: RubricScore[];
  status: 'not-graded' | 'graded' | 'needs-review';
  lastGenerated?: string;
  savedAt?: string;
}

export type GradingStatus = 'not-graded' | 'graded' | 'needs-review';

export type RubricType = 'essay' | 'short-answer' | 'code';

export const RUBRIC_TEMPLATES: Record<RubricType, { name: string; criteria: string[] }> = {
  essay: {
    name: 'Essay (content/structure/language)',
    criteria: ['Content', 'Structure', 'Language'],
  },
  'short-answer': {
    name: 'Short answer (correctness/clarity)',
    criteria: ['Correctness', 'Clarity'],
  },
  code: {
    name: 'Code task (correctness/style/efficiency)',
    criteria: ['Correctness', 'Style', 'Efficiency'],
  },
};
