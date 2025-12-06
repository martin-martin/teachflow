import { useState } from 'react';
import { Send, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface EssaySubmissionFormProps {
    className?: string;
}

const EssaySubmissionForm = ({ className }: EssaySubmissionFormProps) => {
    const [essayText, setEssayText] = useState('');
    const {
        currentStudentId,
        submissionLoading,
        submissionError,
        currentGradingResult,
        submitEssayToBackend,
        backendStudents,
    } = useAppStore();

    const currentStudent = backendStudents.find((s) => s.id === currentStudentId);

    const handleSubmit = async () => {
        if (!currentStudentId || !essayText.trim()) return;
        await submitEssayToBackend(currentStudentId, essayText.trim());
    };

    const canSubmit = currentStudentId && essayText.trim().length > 0 && !submissionLoading;

    if (!currentStudentId) {
        return (
            <div className={cn('flex items-center justify-center p-8', className)}>
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Select a student from the list to submit their essay for grading
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col p-4 space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Essay Submission</h3>
                    {currentStudent && (
                        <p className="text-sm text-muted-foreground">
                            Student: <span className="font-medium">{currentStudent.name}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Success feedback after grading */}
            {currentGradingResult && !submissionLoading && (
                <Alert className="border-success bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertTitle className="text-success">Grading Complete</AlertTitle>
                    <AlertDescription className="text-success/80">
                        Essay has been graded. View and edit the feedback in the panel on the right.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error feedback */}
            {submissionError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Submission Failed</AlertTitle>
                    <AlertDescription>{submissionError}</AlertDescription>
                </Alert>
            )}

            {/* Essay input */}
            <div className="flex-1 flex flex-col space-y-2">
                <label htmlFor="essay-text" className="text-sm font-medium">
                    Paste Student's Essay Text
                </label>
                <Textarea
                    id="essay-text"
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Paste the student's essay text here for grading..."
                    className="flex-1 min-h-[300px] resize-none font-mono text-sm"
                    disabled={submissionLoading}
                />
                <p className="text-xs text-muted-foreground">
                    {essayText.length} characters • {essayText.split(/\s+/).filter(Boolean).length} words
                </p>
            </div>

            {/* Submit button */}
            <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="lg"
                className="w-full gap-2"
            >
                {submissionLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Grading with AI...
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Submit for Grading
                    </>
                )}
            </Button>

            {submissionLoading && (
                <p className="text-xs text-center text-muted-foreground">
                    The AI is analyzing the essay. This may take a moment...
                </p>
            )}
        </div>
    );
};

export default EssaySubmissionForm;
