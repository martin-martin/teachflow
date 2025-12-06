import { MatchStatus, Student } from '@/types';

/**
 * OCR utility functions for PDF processing.
 * These are stubs that simulate OCR behavior - replace with real OCR service later.
 */

// Simulates network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sample text content for different "students" based on file name patterns
const sampleTexts: Record<string, string> = {
  default: `Climate change is primarily caused by the burning of fossil fuels such as coal, oil, and natural gas. These activities release large amounts of carbon dioxide and other greenhouse gases into the atmosphere.

The greenhouse effect, while natural and necessary for life, becomes problematic when enhanced by human activities. Deforestation also contributes significantly, as trees absorb CO2 and their removal reduces this natural carbon sink.

Marine ecosystems are profoundly affected by climate change through several mechanisms. Ocean acidification, caused by absorbed CO2, makes it difficult for shellfish, corals, and plankton to form their calcium carbonate shells and skeletons.

Rising ocean temperatures cause coral bleaching, destroying reef ecosystems that support 25% of all marine species. This threatens the foundation of marine food webs and affects biodiversity globally.

In conclusion, addressing climate change requires both individual action and systemic policy changes. We must transition to renewable energy sources and protect our natural carbon sinks.`,
};

/**
 * Extract full text from entire PDF using OCR.
 * 
 * TODO: Integrate with real OCR service (e.g., Google Cloud Vision, AWS Textract, Tesseract).
 * For now, simulates OCR with a delay and returns sample text.
 * 
 * @param fileOrUrl - The PDF file or URL to process
 * @returns Promise<string> - The extracted text content
 */
export async function extractTextFromPdf(fileOrUrl: File | string): Promise<string> {
  // Simulate OCR processing time (2-4 seconds)
  await delay(2000 + Math.random() * 2000);

  // In a real implementation, this would:
  // 1. Upload the PDF to an OCR service
  // 2. Wait for processing
  // 3. Return the extracted text

  // For demo, return sample text with some variation based on file name
  const fileName = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl.name;
  
  // Add file-specific header to make text unique per file
  const header = `[Extracted from: ${fileName}]\n\n`;
  
  return header + sampleTexts.default;
}

/**
 * Extract only the upper-left "name box" text from first page.
 * 
 * TODO: Integrate with real OCR service with bounding box support.
 * The real implementation should:
 * 1. Process only the first page
 * 2. Focus on the upper-left quadrant (typically where students write their names)
 * 3. Return the detected name text
 * 
 * @param fileOrUrl - The PDF file or URL to process
 * @returns Promise<string> - The detected student name
 */
export async function extractNameFromTopLeft(fileOrUrl: File | string): Promise<string> {
  // Simulate OCR processing time (0.5-1.5 seconds, faster since only first page corner)
  await delay(500 + Math.random() * 1000);

  const fileName = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl.name;
  
  // Try to extract a name from the filename
  // Common patterns: "StudentName_Assignment.pdf", "FirstName LastName - Essay.pdf"
  const namePatterns = [
    /^([A-Z][a-z]+[\s_-]+[A-Z][a-z]+)/,  // "FirstName LastName" or "FirstName_LastName"
    /^([A-Z][a-z]+[A-Z][a-z]+)/,          // "FirstNameLastName" (camelCase)
  ];
  
  for (const pattern of namePatterns) {
    const match = fileName.match(pattern);
    if (match) {
      // Clean up the name (replace underscores/hyphens with spaces)
      return match[1].replace(/[_-]/g, ' ');
    }
  }
  
  // If no pattern matches, simulate finding a name from the mock students
  // In real implementation, this would be actual OCR output
  const mockNames = [
    'Emma Thompson',
    'James Wilson', 
    'Sofia Rodriguez',
    'Michael Chen',
    'Olivia Johnson',
    'Ethan Brown',
    'Ava Martinez',
    'Noah Davis',
    'Isabella Garcia',
    'Liam Anderson',
  ];
  
  // Pick a "random" but consistent name based on filename hash
  const hash = fileName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return mockNames[hash % mockNames.length];
}

export interface MatchResult {
  matchedStudentId: string | null;
  status: MatchStatus;
  candidates?: { id: string; name: string }[];
}

/**
 * Match a detected name to an existing student in the list.
 * 
 * Implements fuzzy matching with:
 * - Case-insensitive exact match
 * - Partial matching (first name or last name)
 * - Similarity scoring for ambiguous matches
 * 
 * @param detectedName - The name extracted from OCR
 * @param students - List of students to match against
 * @returns MatchResult with matched student ID, status, and any candidate matches
 */
export function matchStudentByName({
  detectedName,
  students,
}: {
  detectedName: string;
  students: { id: string; name: string }[];
}): MatchResult {
  if (!detectedName || detectedName.trim() === '') {
    return { matchedStudentId: null, status: 'unmatched' };
  }

  const normalizedDetected = detectedName.toLowerCase().trim();
  
  // Try exact match first (case-insensitive)
  const exactMatch = students.find(
    (s) => s.name.toLowerCase().trim() === normalizedDetected
  );
  
  if (exactMatch) {
    return { matchedStudentId: exactMatch.id, status: 'matched' };
  }

  // Try partial matching (first name or last name)
  const detectedParts = normalizedDetected.split(/\s+/);
  const partialMatches = students.filter((s) => {
    const nameParts = s.name.toLowerCase().split(/\s+/);
    return detectedParts.some((dp) => 
      nameParts.some((np) => np === dp || np.startsWith(dp) || dp.startsWith(np))
    );
  });

  if (partialMatches.length === 1) {
    return { matchedStudentId: partialMatches[0].id, status: 'matched' };
  }

  if (partialMatches.length > 1) {
    return {
      matchedStudentId: null,
      status: 'ambiguous',
      candidates: partialMatches.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  // No match found
  return { matchedStudentId: null, status: 'unmatched' };
}

/**
 * Get the total number of pages in a PDF.
 * 
 * TODO: Integrate with real PDF processing library.
 * 
 * @param fileOrUrl - The PDF file or URL
 * @returns Promise<number> - The number of pages
 */
export async function getPdfPageCount(fileOrUrl: File | string): Promise<number> {
  // Simulate processing
  await delay(100);
  
  // Return a random page count between 1 and 5 for demo
  return Math.floor(Math.random() * 5) + 1;
}

/**
 * Create a blob URL for a PDF file.
 * In a real implementation, this might upload to cloud storage.
 */
export function createPdfUrl(file: File): string {
  return URL.createObjectURL(file);
}
