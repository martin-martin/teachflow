import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PdfSubmission } from '@/types';

interface PdfViewerProps {
  pdfSubmission: PdfSubmission | null;
  className?: string;
}

const PdfViewer = ({ pdfSubmission, className }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const totalPages = pdfSubmission?.totalPages || 1;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(200, prev + 25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(50, prev - 25));
  };

  if (!pdfSubmission) {
    return (
      <div className={cn('flex items-center justify-center bg-muted/30', className)}>
        <div className="text-center p-8">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No PDF submission available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a PDF in the submissions panel above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-muted/30', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Preview Area */}
      <div className="flex-1 overflow-auto p-4">
        <Card 
          className="mx-auto bg-white shadow-lg transition-transform"
          style={{
            width: `${(8.5 * 96 * zoom) / 100}px`,
            minHeight: `${(11 * 96 * zoom) / 100}px`,
          }}
        >
          {/* Simulated PDF content */}
          <div className="p-8 space-y-4" style={{ fontSize: `${14 * zoom / 100}px` }}>
            {/* Student name area (upper-left) */}
            <div className="border-b pb-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Student Name:</p>
              <p className="font-medium">{pdfSubmission.detectedStudentName || 'Unknown'}</p>
            </div>

            {/* Simulated handwritten content */}
            <div className="space-y-3 font-serif italic text-muted-foreground">
              <p>
                [This is a simulated preview of the PDF document. In a real implementation, 
                this would display the actual PDF content using a library like pdf.js or 
                react-pdf.]
              </p>
              <p>
                File: {pdfSubmission.fileName}
              </p>
              <p>
                The OCR-extracted text is shown in the panel to the right. You can edit 
                the extracted text before generating AI feedback.
              </p>
            </div>

            {/* Page indicator at bottom */}
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PdfViewer;
