import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StudentList from '@/components/grading/StudentList';
import QuestionNavigation from '@/components/grading/QuestionNavigation';
import PdfViewer from '@/components/grading/PdfViewer';
import OcrTextEditor from '@/components/grading/OcrTextEditor';
import FeedbackPanel from '@/components/grading/FeedbackPanel';
import WorkspaceToolbar from '@/components/grading/WorkspaceToolbar';
import PdfUploadPanel from '@/components/grading/PdfUploadPanel';
import { useAppStore } from '@/store/appStore';

const GradingWorkspace = () => {
  const navigate = useNavigate();
  const {
    teacher,
    currentStudentId,
    getCurrentAssignment,
    getAssignmentStudents,
    getAssignmentQuestions,
    getCurrentStudent,
    getCurrentQuestion,
    getCurrentPdfSubmission,
    updatePdfOcrText,
  } = useAppStore();

  const assignment = getCurrentAssignment();
  const students = getAssignmentStudents();
  const questions = getAssignmentQuestions();
  const currentStudent = getCurrentStudent();
  const currentQuestion = getCurrentQuestion();
  const currentPdf = getCurrentPdfSubmission();

  const currentStudentIndex = students.findIndex((s) => s.id === currentStudentId);
  const currentQuestionIndex = questions.findIndex((q) => q.id === currentQuestion?.id);

  // Calculate grading progress
  const totalItems = students.length * questions.length;
  const gradedItems = assignment?.gradedCount || 0;
  const progressPercent = totalItems > 0 ? Math.round((gradedItems / totalItems) * 100) : 0;

  if (!assignment) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-card border-b shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">FeedbackAI</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-medium">{assignment.name}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Student {currentStudentIndex + 1} / {students.length}
            </span>
            <span>•</span>
            <span>
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Graded:</span>
            <Progress value={progressPercent} className="w-24 h-2" />
            <span className="font-medium">{progressPercent}%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{teacher?.name}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Student List */}
        <div className="w-64 shrink-0 flex flex-col border-r">
          <StudentList />
          <div className="p-3 border-t">
            <PdfUploadPanel />
          </div>
        </div>

        {/* Center + Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question Navigation */}
          <QuestionNavigation />

          {/* Split View: PDF + OCR Text + Feedback */}
          <div className="flex-1 flex overflow-hidden">
            {/* PDF Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <PdfViewer pdfSubmission={currentPdf || null} className="flex-1" />
            </div>

            {/* OCR Text Editor */}
            <div className="w-[320px] shrink-0 flex flex-col overflow-hidden">
              <OcrTextEditor
                pdfSubmission={currentPdf || null}
                onTextChange={(text) => currentPdf && updatePdfOcrText(currentPdf.id, text)}
                className="flex-1"
              />
            </div>

            {/* Feedback Panel */}
            <div className="w-[420px] shrink-0 flex flex-col overflow-hidden border-l">
              <FeedbackPanel />
            </div>
          </div>

          {/* Bottom Toolbar */}
          <WorkspaceToolbar />
        </div>
      </div>
    </div>
  );
};

export default GradingWorkspace;
