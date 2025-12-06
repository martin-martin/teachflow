import { create } from 'zustand';
import { Teacher, Assignment, Student, Question, Answer, Feedback, GradingStatus, PdfSubmission } from '@/types';
import { 
  mockStudents, 
  mockAssignments, 
  mockQuestions, 
  mockAnswers, 
  mockFeedback,
  mockSubmissions 
} from '@/data/mockData';
import {
  extractTextFromPdf,
  extractNameFromTopLeft,
  matchStudentByName,
  getPdfPageCount,
  createPdfUrl,
} from '@/lib/ocr';

interface AppState {
  // Auth
  teacher: Teacher | null;
  setTeacher: (teacher: Teacher | null) => void;

  // Data
  assignments: Assignment[];
  students: Student[];
  questions: Question[];
  answers: Answer[];
  submissions: typeof mockSubmissions;
  feedback: Feedback[];
  pdfSubmissions: PdfSubmission[];

  // Current selections
  currentAssignmentId: string | null;
  currentStudentId: string | null;
  currentQuestionId: string | null;

  // Actions
  setCurrentAssignment: (id: string | null) => void;
  setCurrentStudent: (id: string | null) => void;
  setCurrentQuestion: (id: string | null) => void;
  
  // CRUD
  addAssignment: (assignment: Omit<Assignment, 'id' | 'teacherId' | 'studentCount' | 'gradedCount' | 'lastUpdated'>) => void;
  updateFeedback: (feedbackId: string, updates: Partial<Feedback>) => void;
  saveFeedback: (feedbackId: string) => void;
  markAsGraded: (feedbackId: string) => void;

  // PDF Submission actions
  uploadPdfSubmissions: (files: File[], assignmentId: string) => Promise<void>;
  updatePdfSubmissionStudent: (pdfId: string, studentId: string | null) => void;
  updatePdfOcrText: (pdfId: string, ocrText: string) => void;
  retryOcr: (pdfId: string) => Promise<void>;

  // Helpers
  getCurrentAssignment: () => Assignment | undefined;
  getCurrentStudent: () => Student | undefined;
  getCurrentQuestion: () => Question | undefined;
  getCurrentAnswer: () => Answer | undefined;
  getCurrentFeedback: () => Feedback | undefined;
  getCurrentPdfSubmission: () => PdfSubmission | undefined;
  getStudentPdfSubmission: (studentId: string) => PdfSubmission | undefined;
  getStudentStatus: (studentId: string) => GradingStatus;
  getQuestionFeedback: (questionId: string, studentId: string) => Feedback | undefined;
  getAssignmentQuestions: () => Question[];
  getAssignmentStudents: () => Student[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  teacher: null,
  assignments: mockAssignments,
  students: mockStudents,
  questions: mockQuestions,
  answers: mockAnswers,
  submissions: mockSubmissions,
  feedback: mockFeedback,
  pdfSubmissions: [],
  
  currentAssignmentId: null,
  currentStudentId: null,
  currentQuestionId: null,

  // Setters
  setTeacher: (teacher) => set({ teacher }),
  setCurrentAssignment: (id) => set({ currentAssignmentId: id, currentStudentId: null, currentQuestionId: null }),
  setCurrentStudent: (id) => {
    const state = get();
    const questions = state.questions.filter((q) => q.assignmentId === state.currentAssignmentId);
    set({ 
      currentStudentId: id, 
      currentQuestionId: questions.length > 0 ? questions[0].id : null 
    });
  },
  setCurrentQuestion: (id) => set({ currentQuestionId: id }),

  // CRUD
  addAssignment: (assignmentData) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `a${Date.now()}`,
      teacherId: get().teacher?.id || 't1',
      studentCount: get().students.length,
      gradedCount: 0,
      lastUpdated: new Date().toISOString(),
    };
    set((state) => ({ assignments: [...state.assignments, newAssignment] }));
  },

  updateFeedback: (feedbackId, updates) => {
    set((state) => ({
      feedback: state.feedback.map((fb) =>
        fb.id === feedbackId ? { ...fb, ...updates } : fb
      ),
    }));
  },

  saveFeedback: (feedbackId) => {
    set((state) => ({
      feedback: state.feedback.map((fb) =>
        fb.id === feedbackId ? { ...fb, savedAt: new Date().toISOString() } : fb
      ),
    }));
  },

  markAsGraded: (feedbackId) => {
    set((state) => ({
      feedback: state.feedback.map((fb) =>
        fb.id === feedbackId ? { ...fb, status: 'graded' as const, savedAt: new Date().toISOString() } : fb
      ),
    }));
  },

  // PDF Submission actions
  uploadPdfSubmissions: async (files, assignmentId) => {
    const state = get();
    const students = state.students.filter(
      (s) => s.className === state.assignments.find((a) => a.id === assignmentId)?.className
    );

    // Create initial PDF submission entries
    const newPdfs: PdfSubmission[] = files.map((file) => ({
      id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      assignmentId,
      studentId: null,
      fileName: file.name,
      fileUrl: createPdfUrl(file),
      ocrText: '',
      detectedStudentName: '',
      matchStatus: 'unmatched' as const,
      ocrStatus: 'processing' as const,
      createdAt: new Date().toISOString(),
      totalPages: 1,
    }));

    // Add to state immediately
    set((state) => ({
      pdfSubmissions: [...state.pdfSubmissions, ...newPdfs],
    }));

    // Process each PDF asynchronously
    for (const pdf of newPdfs) {
      const file = files.find((f) => f.name === pdf.fileName);
      if (!file) continue;

      try {
        // Step 1: Extract name from top-left corner
        const detectedName = await extractNameFromTopLeft(file);
        
        // Step 2: Match to student
        const matchResult = matchStudentByName({ detectedName, students });
        
        // Update with name detection results
        set((state) => ({
          pdfSubmissions: state.pdfSubmissions.map((p) =>
            p.id === pdf.id
              ? {
                  ...p,
                  detectedStudentName: detectedName,
                  studentId: matchResult.matchedStudentId,
                  matchStatus: matchResult.status,
                }
              : p
          ),
        }));

        // Step 3: Extract full text (runs in parallel but updates after)
        const [ocrText, pageCount] = await Promise.all([
          extractTextFromPdf(file),
          getPdfPageCount(file),
        ]);

        // Update with OCR results
        set((state) => ({
          pdfSubmissions: state.pdfSubmissions.map((p) =>
            p.id === pdf.id
              ? {
                  ...p,
                  ocrText,
                  totalPages: pageCount,
                  ocrStatus: 'done' as const,
                }
              : p
          ),
        }));
      } catch (error) {
        console.error('OCR processing error:', error);
        set((state) => ({
          pdfSubmissions: state.pdfSubmissions.map((p) =>
            p.id === pdf.id ? { ...p, ocrStatus: 'error' as const } : p
          ),
        }));
      }
    }
  },

  updatePdfSubmissionStudent: (pdfId, studentId) => {
    set((state) => ({
      pdfSubmissions: state.pdfSubmissions.map((pdf) =>
        pdf.id === pdfId
          ? {
              ...pdf,
              studentId,
              matchStatus: studentId ? 'matched' : 'unmatched',
            }
          : pdf
      ),
    }));
  },

  updatePdfOcrText: (pdfId, ocrText) => {
    set((state) => ({
      pdfSubmissions: state.pdfSubmissions.map((pdf) =>
        pdf.id === pdfId ? { ...pdf, ocrText } : pdf
      ),
    }));
  },

  retryOcr: async (pdfId) => {
    const state = get();
    const pdf = state.pdfSubmissions.find((p) => p.id === pdfId);
    if (!pdf) return;

    set((state) => ({
      pdfSubmissions: state.pdfSubmissions.map((p) =>
        p.id === pdfId ? { ...p, ocrStatus: 'processing' as const } : p
      ),
    }));

    try {
      const ocrText = await extractTextFromPdf(pdf.fileUrl);
      set((state) => ({
        pdfSubmissions: state.pdfSubmissions.map((p) =>
          p.id === pdfId ? { ...p, ocrText, ocrStatus: 'done' as const } : p
        ),
      }));
    } catch (error) {
      console.error('OCR retry error:', error);
      set((state) => ({
        pdfSubmissions: state.pdfSubmissions.map((p) =>
          p.id === pdfId ? { ...p, ocrStatus: 'error' as const } : p
        ),
      }));
    }
  },

  // Helpers
  getCurrentAssignment: () => {
    const state = get();
    return state.assignments.find((a) => a.id === state.currentAssignmentId);
  },

  getCurrentStudent: () => {
    const state = get();
    return state.students.find((s) => s.id === state.currentStudentId);
  },

  getCurrentQuestion: () => {
    const state = get();
    return state.questions.find((q) => q.id === state.currentQuestionId);
  },

  getCurrentAnswer: () => {
    const state = get();
    if (!state.currentStudentId || !state.currentQuestionId) return undefined;
    
    const submission = state.submissions.find(
      (s) => s.studentId === state.currentStudentId && s.assignmentId === state.currentAssignmentId
    );
    if (!submission) return undefined;

    return state.answers.find(
      (a) => a.submissionId === submission.id && a.questionId === state.currentQuestionId
    );
  },

  getCurrentFeedback: () => {
    const state = get();
    if (!state.currentStudentId || !state.currentQuestionId) return undefined;
    
    const submission = state.submissions.find(
      (s) => s.studentId === state.currentStudentId && s.assignmentId === state.currentAssignmentId
    );
    if (!submission) return undefined;

    return state.feedback.find(
      (fb) => fb.submissionId === submission.id && fb.questionId === state.currentQuestionId
    );
  },

  getCurrentPdfSubmission: () => {
    const state = get();
    if (!state.currentStudentId || !state.currentAssignmentId) return undefined;
    
    return state.pdfSubmissions.find(
      (pdf) => pdf.studentId === state.currentStudentId && pdf.assignmentId === state.currentAssignmentId
    );
  },

  getStudentPdfSubmission: (studentId) => {
    const state = get();
    if (!state.currentAssignmentId) return undefined;
    
    return state.pdfSubmissions.find(
      (pdf) => pdf.studentId === studentId && pdf.assignmentId === state.currentAssignmentId
    );
  },

  getStudentStatus: (studentId) => {
    const state = get();
    const submission = state.submissions.find(
      (s) => s.studentId === studentId && s.assignmentId === state.currentAssignmentId
    );
    if (!submission) return 'not-graded';

    const studentFeedback = state.feedback.filter((fb) => fb.submissionId === submission.id);
    const allGraded = studentFeedback.every((fb) => fb.status === 'graded');
    const hasNeedsReview = studentFeedback.some((fb) => fb.status === 'needs-review');
    const hasAnyGraded = studentFeedback.some((fb) => fb.status === 'graded');

    if (hasNeedsReview) return 'needs-review';
    if (allGraded && studentFeedback.length > 0) return 'graded';
    if (hasAnyGraded) return 'needs-review';
    return 'not-graded';
  },

  getQuestionFeedback: (questionId, studentId) => {
    const state = get();
    const submission = state.submissions.find(
      (s) => s.studentId === studentId && s.assignmentId === state.currentAssignmentId
    );
    if (!submission) return undefined;

    return state.feedback.find(
      (fb) => fb.submissionId === submission.id && fb.questionId === questionId
    );
  },

  getAssignmentQuestions: () => {
    const state = get();
    return state.questions
      .filter((q) => q.assignmentId === state.currentAssignmentId)
      .sort((a, b) => a.index - b.index);
  },

  getAssignmentStudents: () => {
    const state = get();
    const assignment = state.getCurrentAssignment();
    if (!assignment) return [];
    return state.students.filter((s) => s.className === assignment.className);
  },
}));
