import { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Minimize2, 
  Smile, 
  AlignLeft,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/appStore';
import { RUBRIC_TEMPLATES } from '@/types';
import { generateFeedbackForAnswer, generateFeedbackForSubmission, regenerateFeedback } from '@/lib/ai';
import { cn } from '@/lib/utils';

const FeedbackPanel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    getCurrentAssignment,
    getCurrentQuestion,
    getCurrentAnswer,
    getCurrentFeedback,
    getCurrentStudent,
    getCurrentPdfSubmission,
    updateFeedback,
  } = useAppStore();

  const assignment = getCurrentAssignment();
  const question = getCurrentQuestion();
  const answer = getCurrentAnswer();
  const feedback = getCurrentFeedback();
  const student = getCurrentStudent();
  const pdfSubmission = getCurrentPdfSubmission();

  const rubricTemplate = assignment ? RUBRIC_TEMPLATES[assignment.rubricType] : null;

  const handleGenerate = async () => {
    if (!assignment || !feedback) return;
    
    setIsGenerating(true);
    try {
      let generated;
      
      // Use OCR text if available, otherwise fall back to question/answer
      if (pdfSubmission && pdfSubmission.ocrText && student) {
        generated = await generateFeedbackForSubmission({
          assignmentName: assignment.name,
          rubricType: assignment.rubricType,
          studentName: student.name,
          ocrText: pdfSubmission.ocrText,
        });
      } else if (question && answer) {
        generated = await generateFeedbackForAnswer({
          assignmentName: assignment.name,
          rubricType: assignment.rubricType,
          questionPrompt: question.prompt,
          studentAnswer: answer.content,
        });
      } else {
        return;
      }

      updateFeedback(feedback.id, {
        ...generated,
        lastGenerated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (modifier: 'shorten' | 'more-positive' | 'more-concise') => {
    if (!assignment || !question || !answer || !feedback) return;
    
    setIsGenerating(true);
    try {
      const generated = await regenerateFeedback(
        {
          assignmentName: assignment.name,
          rubricType: assignment.rubricType,
          questionPrompt: question.prompt,
          studentAnswer: answer.content,
        },
        modifier
      );

      updateFeedback(feedback.id, {
        ...generated,
        lastGenerated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to regenerate feedback:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!feedback) return;
    updateFeedback(feedback.id, { [field]: value });
  };

  const handleScoreChange = (criterionIndex: number, field: 'score' | 'comment', value: string | number) => {
    if (!feedback) return;
    const updatedScores = [...feedback.rubricScores];
    updatedScores[criterionIndex] = {
      ...updatedScores[criterionIndex],
      [field]: value,
    };
    updateFeedback(feedback.id, { rubricScores: updatedScores });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!student) {
    return (
      <div className="h-full flex items-center justify-center bg-card border-t p-8">
        <p className="text-muted-foreground text-center">
          Select a student to view and generate feedback
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-t">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">AI Feedback (editable)</h3>
            {rubricTemplate && (
              <Badge variant="secondary" className="text-xs">
                {rubricTemplate.name.split(' ')[0]} rubric
              </Badge>
            )}
          </div>
          {student && (
            <p className="text-xs text-muted-foreground">
              Student: {student.name} {pdfSubmission ? '• Source: OCR from uploaded PDF' : ''}
            </p>
          )}
        </div>
        {feedback?.lastGenerated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Last generated: {formatTime(feedback.lastGenerated)}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Overall Comment */}
          <div className="feedback-section space-y-2">
            <label className="text-sm font-medium">Overall Comment</label>
            <Textarea
              value={feedback?.overall || ''}
              onChange={(e) => handleFieldChange('overall', e.target.value)}
              placeholder="AI will generate an overall assessment..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Strengths */}
          <div className="feedback-section space-y-2">
            <label className="text-sm font-medium text-success">Strengths</label>
            <Textarea
              value={feedback?.strengths || ''}
              onChange={(e) => handleFieldChange('strengths', e.target.value)}
              placeholder="• Highlight positive aspects..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Areas for Improvement */}
          <div className="feedback-section space-y-2">
            <label className="text-sm font-medium text-warning">Areas for Improvement</label>
            <Textarea
              value={feedback?.weaknesses || ''}
              onChange={(e) => handleFieldChange('weaknesses', e.target.value)}
              placeholder="• Constructive suggestions..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Next Steps */}
          <div className="feedback-section space-y-2">
            <label className="text-sm font-medium text-primary">Actionable Next Steps</label>
            <Textarea
              value={feedback?.nextSteps || ''}
              onChange={(e) => handleFieldChange('nextSteps', e.target.value)}
              placeholder="1. Specific recommendations..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Rubric Scores */}
          <div className="feedback-section space-y-3">
            <label className="text-sm font-medium">Score per Criterion</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Criterion</th>
                    <th className="text-center px-3 py-2 font-medium w-24">Score (0–5)</th>
                    <th className="text-left px-3 py-2 font-medium">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback?.rubricScores.map((score, index) => (
                    <tr key={score.criterion} className="border-t">
                      <td className="px-3 py-2 font-medium">{score.criterion}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          value={score.score}
                          onChange={(e) => handleScoreChange(index, 'score', parseInt(e.target.value) || 0)}
                          className="h-8 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={score.comment}
                          onChange={(e) => handleScoreChange(index, 'comment', e.target.value)}
                          placeholder="Add comment..."
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Controls */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Feedback
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate('shorten')}
                disabled={isGenerating || !feedback?.lastGenerated}
                className="gap-1.5"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                Shorten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate('more-positive')}
                disabled={isGenerating || !feedback?.lastGenerated}
                className="gap-1.5"
              >
                <Smile className="w-3.5 h-3.5" />
                More Positive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate('more-concise')}
                disabled={isGenerating || !feedback?.lastGenerated}
                className="gap-1.5"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                More Concise
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Teacher can edit anything before saving.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FeedbackPanel;
