import { Check, Circle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const QuestionNavigation = () => {
  const {
    currentQuestionId,
    currentStudentId,
    setCurrentQuestion,
    getAssignmentQuestions,
    getQuestionFeedback,
  } = useAppStore();

  const questions = getAssignmentQuestions();
  const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentQuestion(questions[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentIndex + 1].id);
    }
  };

  const getQuestionStatus = (questionId: string) => {
    if (!currentStudentId) return 'default';
    const feedback = getQuestionFeedback(questionId, currentStudentId);
    if (!feedback) return 'default';
    if (feedback.status === 'graded') return 'graded';
    if (feedback.status === 'needs-review') return 'flagged';
    return 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <Check className="w-3.5 h-3.5" />;
      case 'flagged':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <Circle className="w-3.5 h-3.5" />;
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-card border-b">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentIndex <= 0}
        className="gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto py-1">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question.id);
          const isCurrent = question.id === currentQuestionId;

          return (
            <button
              key={question.id}
              onClick={() => setCurrentQuestion(question.id)}
              className={cn(
                'question-button',
                isCurrent && 'current',
                !isCurrent && status === 'graded' && 'graded',
                !isCurrent && status === 'flagged' && 'flagged',
                !isCurrent && status === 'default' && 'default'
              )}
              title={`Question ${index + 1}: ${question.prompt.slice(0, 50)}...`}
            >
              {isCurrent ? (
                `Q${index + 1}`
              ) : (
                <>
                  {getStatusIcon(status)}
                </>
              )}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentIndex >= questions.length - 1}
        className="gap-1.5"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default QuestionNavigation;
