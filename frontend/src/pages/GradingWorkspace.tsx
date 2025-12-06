import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentList from '@/components/grading/StudentList';
import EssaySubmissionForm from '@/components/grading/EssaySubmissionForm';
import BackendFeedbackPanel from '@/components/grading/BackendFeedbackPanel';
import { useAppStore } from '@/store/appStore';

const GradingWorkspace = () => {
  const navigate = useNavigate();
  const {
    teacher,
    currentStudentId,
    backendStudents,
  } = useAppStore();

  const currentStudentIndex = backendStudents.findIndex((s) => s.id === currentStudentId);

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
            <span className="font-semibold text-sm">TeachFlow Grading</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Student {currentStudentIndex >= 0 ? currentStudentIndex + 1 : '-'} / {backendStudents.length}
            </span>
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
        </div>

        {/* Center - Essay Submission Form */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <EssaySubmissionForm className="flex-1 overflow-auto" />
        </div>

        {/* Right - Feedback Panel */}
        <div className="w-[450px] shrink-0 flex flex-col overflow-hidden">
          <BackendFeedbackPanel className="flex-1 overflow-hidden" />
        </div>
      </div>
    </div>
  );
};

export default GradingWorkspace;

