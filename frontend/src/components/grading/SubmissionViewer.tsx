import { ExternalLink, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/appStore';

const SubmissionViewer = () => {
  const { getCurrentQuestion, getCurrentAnswer, getCurrentStudent } = useAppStore();
  
  const question = getCurrentQuestion();
  const answer = getCurrentAnswer();
  const student = getCurrentStudent();

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center bg-panel/50">
        <div className="text-center">
          <p className="text-muted-foreground">
            Select a student from the sidebar to view their submission
          </p>
        </div>
      </div>
    );
  }

  if (!question || !answer) {
    return (
      <div className="flex-1 flex items-center justify-center bg-panel/50">
        <div className="text-center">
          <p className="text-muted-foreground">
            No submission available for this question
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-panel/30 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Highlighter className="w-4 h-4" />
            Highlight
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <Card className="max-w-3xl mx-auto shadow-card animate-fade-in">
          <CardHeader className="pb-4">
            <div className="text-sm font-medium text-primary mb-2">
              Question {question.index}
            </div>
            <p className="text-foreground font-medium leading-relaxed">
              {question.prompt}
            </p>
          </CardHeader>
          <CardContent className="border-t pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              {student.name}'s Answer
            </div>
            <div className="prose prose-sm max-w-none">
              {answer.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
};

export default SubmissionViewer;
