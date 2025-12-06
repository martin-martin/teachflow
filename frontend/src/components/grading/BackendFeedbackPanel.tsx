import { useState, useEffect } from 'react';
import {
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileText,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BackendFeedbackPanelProps {
    className?: string;
}

const BackendFeedbackPanel = ({ className }: BackendFeedbackPanelProps) => {
    const { toast } = useToast();
    const [editedGrade, setEditedGrade] = useState('');
    const [editedSummary, setEditedSummary] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    const {
        currentStudentId,
        currentGradingResult,
        submissionLoading,
        feedbackSaving,
        feedbackSaveError,
        updateFeedbackOnBackend,
        backendStudents,
    } = useAppStore();

    const currentStudent = backendStudents.find((s) => s.id === currentStudentId);

    // Initialize edited values when grading result changes
    useEffect(() => {
        if (currentGradingResult) {
            setEditedGrade(currentGradingResult.grade || '');
            setEditedSummary(currentGradingResult.summary_feedback || '');
            setHasChanges(false);
        }
    }, [currentGradingResult]);

    // Track changes
    useEffect(() => {
        if (currentGradingResult) {
            const gradeChanged = editedGrade !== (currentGradingResult.grade || '');
            const summaryChanged = editedSummary !== (currentGradingResult.summary_feedback || '');
            setHasChanges(gradeChanged || summaryChanged);
        }
    }, [editedGrade, editedSummary, currentGradingResult]);

    const handleSave = async () => {
        if (!currentStudentId) return;

        const success = await updateFeedbackOnBackend(currentStudentId, editedGrade, editedSummary);
        if (success) {
            setHasChanges(false);
            toast({
                title: 'Feedback saved',
                description: 'Your changes have been saved successfully.',
            });
        } else {
            toast({
                title: 'Failed to save',
                description: feedbackSaveError || 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    // No student selected
    if (!currentStudentId) {
        return (
            <div className={cn('h-full flex items-center justify-center bg-card p-8', className)}>
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Select a student to view and edit feedback
                    </p>
                </div>
            </div>
        );
    }

    // Submission in progress
    if (submissionLoading) {
        return (
            <div className={cn('h-full flex items-center justify-center bg-card p-8', className)}>
                <div className="text-center">
                    <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium">Analyzing essay...</p>
                    <p className="text-muted-foreground text-sm mt-1">AI is grading the submission</p>
                </div>
            </div>
        );
    }

    // No grading result yet
    if (!currentGradingResult) {
        return (
            <div className={cn('h-full flex items-center justify-center bg-card p-8', className)}>
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Submit an essay for grading to see feedback here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('h-full flex flex-col bg-card', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold">AI Feedback</h3>
                        <Badge variant="secondary" className="text-xs">
                            Editable
                        </Badge>
                        {hasChanges && (
                            <Badge variant="outline" className="text-xs text-warning border-warning">
                                Unsaved changes
                            </Badge>
                        )}
                    </div>
                    {currentStudent && (
                        <p className="text-xs text-muted-foreground">
                            Student: {currentStudent.name}
                        </p>
                    )}
                </div>
                <Button
                    onClick={handleSave}
                    disabled={feedbackSaving || !hasChanges}
                    size="sm"
                    className="gap-2"
                >
                    {feedbackSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* Save error */}
                    {feedbackSaveError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Save Failed</AlertTitle>
                            <AlertDescription>{feedbackSaveError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Grade */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Grade</label>
                        <Input
                            value={editedGrade}
                            onChange={(e) => setEditedGrade(e.target.value)}
                            placeholder="Enter grade..."
                            className="font-semibold text-lg"
                        />
                    </div>

                    {/* Summary Feedback */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Summary Feedback</label>
                        <Textarea
                            value={editedSummary}
                            onChange={(e) => setEditedSummary(e.target.value)}
                            placeholder="AI-generated feedback summary..."
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Issues List (read-only display) */}
                    {currentGradingResult.issues && currentGradingResult.issues.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Issues Identified</label>
                            <div className="border rounded-lg overflow-hidden">
                                {currentGradingResult.issues.map((issue, index) => (
                                    <div key={index} className="p-3 border-b last:border-b-0 bg-muted/20">
                                        <div className="flex items-start gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                                                {issue.type}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium text-muted-foreground">Quote: </span>
                                                <span className="italic text-destructive/80">"{issue.quote}"</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Issue: </span>
                                                <span>{issue.comment}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Correction: </span>
                                                <span className="text-success">{issue.correction}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Essay text preview */}
                    {currentGradingResult.essay_text && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Original Essay
                                <Badge variant="outline" className="text-xs">Read-only</Badge>
                            </label>
                            <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
                                    {currentGradingResult.essay_text}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Teacher note */}
                    <div className="pt-2">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Teacher Review</AlertTitle>
                            <AlertDescription>
                                You can edit the grade and summary feedback above. Click "Save Changes" to persist your edits.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default BackendFeedbackPanel;
