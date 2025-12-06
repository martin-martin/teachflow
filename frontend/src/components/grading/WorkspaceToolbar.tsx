import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  FileDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WorkspaceToolbar = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { toast } = useToast();

  const {
    currentStudentId,
    currentQuestionId,
    setCurrentStudent,
    setCurrentQuestion,
    getCurrentFeedback,
    saveFeedback,
    markAsGraded,
    getAssignmentStudents,
    getAssignmentQuestions,
  } = useAppStore();

  const students = getAssignmentStudents();
  const questions = getAssignmentQuestions();
  const feedback = getCurrentFeedback();

  const currentStudentIndex = students.findIndex((s) => s.id === currentStudentId);
  const currentQuestionIndex = questions.findIndex((q) => q.id === currentQuestionId);

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudent(students[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudent(students[currentStudentIndex + 1].id);
    }
  };

  // Move to next question, or next student if at last question
  const handleAdvance = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentQuestionIndex + 1].id);
    } else if (currentStudentIndex < students.length - 1) {
      setCurrentStudent(students[currentStudentIndex + 1].id);
    }
  };

  const handleSave = async () => {
    if (!feedback) return;
    
    setIsSaving(true);
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    saveFeedback(feedback.id);
    setIsSaving(false);
    setJustSaved(true);
    
    toast({
      title: 'Feedback saved',
      description: `Saved at ${new Date().toLocaleTimeString()}`,
    });

    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleMarkGraded = () => {
    if (!feedback) return;
    markAsGraded(feedback.id);
    
    toast({
      title: 'Marked as graded',
      description: 'This question is now marked as complete.',
    });

    // Auto-advance to next
    handleAdvance();
  };

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'PDF export will be ready shortly.',
    });
  };

  const isGraded = feedback?.status === 'graded';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-t">
      {/* Student Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousStudent}
          disabled={currentStudentIndex <= 0}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Student
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextStudent}
          disabled={currentStudentIndex >= students.length - 1}
          className="gap-1.5"
        >
          Next Student
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Save Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !feedback}
          className={cn('gap-1.5', justSaved && 'text-success border-success')}
        >
          {justSaved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Feedback
            </>
          )}
        </Button>

        <Button
          size="sm"
          onClick={handleMarkGraded}
          disabled={!feedback}
          className={cn('gap-1.5', isGraded && 'bg-success hover:bg-success/90')}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isGraded ? 'Graded' : 'Mark as Graded'}
        </Button>
      </div>
    </div>
  );
};

export default WorkspaceToolbar;
