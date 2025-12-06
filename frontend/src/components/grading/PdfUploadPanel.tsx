import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Clock, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { PdfSubmission, MatchStatus, OcrStatus } from '@/types';
import { cn } from '@/lib/utils';

const PdfUploadPanel = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const {
    pdfSubmissions,
    getAssignmentStudents,
    currentAssignmentId,
    uploadPdfSubmissions,
    updatePdfSubmissionStudent,
    retryOcr,
  } = useAppStore();

  const students = getAssignmentStudents();
  const assignmentPdfs = pdfSubmissions.filter(
    (pdf) => pdf.assignmentId === currentAssignmentId
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );
    
    if (files.length > 0 && currentAssignmentId) {
      uploadPdfSubmissions(files, currentAssignmentId);
    }
  }, [currentAssignmentId, uploadPdfSubmissions]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (file) => file.type === 'application/pdf'
    );
    
    if (files.length > 0 && currentAssignmentId) {
      uploadPdfSubmissions(files, currentAssignmentId);
    }
    
    // Reset input
    e.target.value = '';
  }, [currentAssignmentId, uploadPdfSubmissions]);

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-success/10 text-success border-success/20">Matched</Badge>;
      case 'unmatched':
        return <Badge variant="destructive">Unmatched</Badge>;
      case 'ambiguous':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Ambiguous</Badge>;
    }
  };

  const getOcrStatusBadge = (status: OcrStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="gap-1 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing...
          </Badge>
        );
      case 'done':
        return (
          <Badge variant="outline" className="gap-1 text-success border-success/20">
            <Check className="w-3 h-3" />
            Done
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            OCR Error
          </Badge>
        );
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          PDF Submissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('pdf-upload')?.click()}
        >
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Upload PDF Submissions</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop PDF files or click to browse
          </p>
        </div>

        {/* Uploaded PDFs List */}
        {assignmentPdfs.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {assignmentPdfs.map((pdf) => (
                <PdfSubmissionRow
                  key={pdf.id}
                  pdf={pdf}
                  students={students}
                  onStudentChange={(studentId) => updatePdfSubmissionStudent(pdf.id, studentId)}
                  onRetryOcr={() => retryOcr(pdf.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {assignmentPdfs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No PDF submissions uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface PdfSubmissionRowProps {
  pdf: PdfSubmission;
  students: { id: string; name: string }[];
  onStudentChange: (studentId: string | null) => void;
  onRetryOcr: () => void;
}

const PdfSubmissionRow = ({ pdf, students, onStudentChange, onRetryOcr }: PdfSubmissionRowProps) => {
  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Matched</Badge>;
      case 'unmatched':
        return <Badge variant="destructive" className="text-xs">Unmatched</Badge>;
      case 'ambiguous':
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Ambiguous</Badge>;
    }
  };

  const getOcrStatusBadge = (status: OcrStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="gap-1 text-xs animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'done':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-success border-success/20">
            <Check className="w-3 h-3" />
            Done
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="w-3 h-3" />
            Error
          </Badge>
        );
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border bg-card',
      pdf.matchStatus === 'unmatched' && 'border-destructive/50 bg-destructive/5',
      pdf.matchStatus === 'ambiguous' && 'border-warning/50 bg-warning/5'
    )}>
      <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">{pdf.fileName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Detected: <span className="font-medium">{pdf.detectedStudentName || 'Unknown'}</span>
          </span>
          {getStatusBadge(pdf.matchStatus)}
          {getOcrStatusBadge(pdf.ocrStatus)}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <Select
          value={pdf.studentId || 'unassigned'}
          onValueChange={(value) => onStudentChange(value === 'unassigned' ? null : value)}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pdf.ocrStatus === 'error' && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRetryOcr}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PdfUploadPanel;
