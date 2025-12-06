import { useState } from 'react';
import { FileText, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PdfSubmission } from '@/types';
import { cn } from '@/lib/utils';

interface OcrTextEditorProps {
  pdfSubmission: PdfSubmission | null;
  onTextChange: (text: string) => void;
  className?: string;
}

const OcrTextEditor = ({ pdfSubmission, onTextChange, className }: OcrTextEditorProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!pdfSubmission?.ocrText) return;
    
    try {
      await navigator.clipboard.writeText(pdfSubmission.ocrText);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  if (!pdfSubmission) {
    return (
      <div className={cn('flex items-center justify-center bg-card border-l', className)}>
        <div className="text-center p-8">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Select a student with a PDF submission to view extracted text
          </p>
        </div>
      </div>
    );
  }

  if (pdfSubmission.ocrStatus === 'processing') {
    return (
      <div className={cn('flex items-center justify-center bg-card border-l', className)}>
        <div className="text-center p-8">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            Processing OCR...
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Extracting text from PDF
          </p>
        </div>
      </div>
    );
  }

  if (pdfSubmission.ocrStatus === 'error') {
    return (
      <div className={cn('flex items-center justify-center bg-card border-l', className)}>
        <div className="text-center p-8">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-destructive text-sm font-medium">
            OCR Failed
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Please retry or upload a clearer scan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-card border-l', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Extracted Text (editable)</h3>
          <Badge variant="outline" className="text-xs">
            OCR
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Note about OCR */}
      <div className="px-4 py-2 bg-warning/5 border-b">
        <p className="text-xs text-warning flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          This text is generated from OCR and may contain recognition errors.
        </p>
      </div>

      {/* Text Editor */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Textarea
            value={pdfSubmission.ocrText}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
            placeholder="OCR text will appear here..."
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default OcrTextEditor;
