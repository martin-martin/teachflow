import { RubricScore, RubricType, RUBRIC_TEMPLATES } from '@/types';

export interface GenerateFeedbackInput {
  assignmentName: string;
  rubricType: RubricType;
  questionPrompt: string;
  studentAnswer: string;
}

export interface GenerateFeedbackFromOcrInput {
  assignmentName: string;
  rubricType: RubricType;
  studentName: string;
  ocrText: string;
}

export interface GeneratedFeedback {
  overall: string;
  strengths: string;
  weaknesses: string;
  nextSteps: string;
  rubricScores: RubricScore[];
}

// Simulates network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates AI feedback for a student's answer.
 * 
 * TODO: Replace with real AI API call.
 * This function is designed to be easily swapped out with an actual AI service.
 * The input/output structure follows a common pattern for LLM-based feedback systems.
 */
export async function generateFeedbackForAnswer(
  input: GenerateFeedbackInput
): Promise<GeneratedFeedback> {
  // Simulate API latency (1.5-3 seconds)
  await delay(1500 + Math.random() * 1500);

  const { rubricType, questionPrompt } = input;
  const criteria = RUBRIC_TEMPLATES[rubricType].criteria;

  // Generate template-based feedback (replace with actual AI response)
  const rubricScores: RubricScore[] = criteria.map((criterion) => ({
    criterion,
    score: Math.floor(Math.random() * 2) + 3, // Random score 3-5
    maxScore: 5,
    comment: getRandomComment(criterion),
  }));

  return {
    overall: `This response demonstrates a solid understanding of the topic addressed in the question: "${questionPrompt.slice(0, 50)}..." The student shows clear analytical thinking and provides relevant examples to support their arguments.`,
    strengths: `• Clear thesis statement that addresses the prompt directly
• Good use of specific examples and evidence
• Logical flow of ideas with appropriate transitions
• Demonstrates understanding of key concepts`,
    weaknesses: `• Some arguments could be developed more fully
• A few minor grammatical errors present
• Could include more diverse sources or perspectives
• Conclusion could be strengthened with a stronger call to action`,
    nextSteps: `1. Review the feedback on each criterion and revise accordingly
2. Consider adding more specific data or statistics to strengthen arguments
3. Proofread carefully for grammatical accuracy
4. Practice writing stronger concluding statements`,
    rubricScores,
  };
}

/**
 * Generates AI feedback from OCR-extracted text from a PDF submission.
 * 
 * TODO: Replace with real AI API call.
 * This version is optimized for handwritten submissions processed through OCR.
 */
export async function generateFeedbackForSubmission(
  input: GenerateFeedbackFromOcrInput
): Promise<GeneratedFeedback> {
  // Simulate API latency (1.5-3 seconds)
  await delay(1500 + Math.random() * 1500);

  const { rubricType, studentName, ocrText } = input;
  const criteria = RUBRIC_TEMPLATES[rubricType].criteria;

  // Generate template-based feedback (replace with actual AI response)
  const rubricScores: RubricScore[] = criteria.map((criterion) => ({
    criterion,
    score: Math.floor(Math.random() * 2) + 3, // Random score 3-5
    maxScore: 5,
    comment: getRandomComment(criterion),
  }));

  const wordCount = ocrText.split(/\s+/).length;

  return {
    overall: `${studentName}'s submission demonstrates a solid understanding of the assignment topic. The work contains approximately ${wordCount} words and shows thoughtful engagement with the material. The student has addressed the key requirements and provided relevant supporting details.`,
    strengths: `• Clear organization and logical progression of ideas
• Strong opening that establishes the main argument
• Good use of specific examples to support claims
• Demonstrates critical thinking and original analysis
• Appropriate vocabulary and terminology for the subject`,
    weaknesses: `• Some handwriting was difficult to read in places (OCR may have errors)
• A few sentences could be more clearly structured
• Would benefit from additional evidence or citations
• Transitions between paragraphs could be smoother
• Conclusion could more effectively summarize main points`,
    nextSteps: `1. Review OCR-extracted text for any recognition errors
2. Consider expanding on the strongest arguments presented
3. Add more specific examples or data to support claims
4. Work on paragraph transitions for better flow
5. Revise conclusion to strengthen the closing argument`,
    rubricScores,
  };
}

function getRandomComment(criterion: string): string {
  const comments: Record<string, string[]> = {
    Content: [
      'Thorough coverage of main points.',
      'Good depth of analysis.',
      'Could include more supporting evidence.',
    ],
    Structure: [
      'Well-organized with clear paragraphs.',
      'Logical progression of ideas.',
      'Consider adding clearer transitions.',
    ],
    Language: [
      'Clear and concise writing style.',
      'Minor grammatical issues to address.',
      'Good vocabulary use throughout.',
    ],
    Correctness: [
      'Answer is factually accurate.',
      'Main concepts are well-understood.',
      'Minor inaccuracies noted.',
    ],
    Clarity: [
      'Response is easy to follow.',
      'Ideas are clearly expressed.',
      'Some points could be clearer.',
    ],
    Style: [
      'Clean and readable code.',
      'Good naming conventions.',
      'Consider adding more comments.',
    ],
    Efficiency: [
      'Good algorithmic approach.',
      'Time complexity is appropriate.',
      'Could optimize memory usage.',
    ],
  };

  const criterionComments = comments[criterion] || ['Good work on this aspect.'];
  return criterionComments[Math.floor(Math.random() * criterionComments.length)];
}

/**
 * Regenerates feedback with a specific modification.
 * 
 * TODO: Replace with real AI API call that includes the modifier in the prompt.
 */
export async function regenerateFeedback(
  input: GenerateFeedbackInput,
  modifier: 'shorten' | 'more-positive' | 'more-concise'
): Promise<GeneratedFeedback> {
  const baseFeedback = await generateFeedbackForAnswer(input);

  // Apply modifier (in real implementation, this would be part of the prompt)
  switch (modifier) {
    case 'shorten':
      return {
        ...baseFeedback,
        overall: baseFeedback.overall.split('.').slice(0, 2).join('.') + '.',
        strengths: baseFeedback.strengths.split('\n').slice(0, 2).join('\n'),
        weaknesses: baseFeedback.weaknesses.split('\n').slice(0, 2).join('\n'),
      };
    case 'more-positive':
      return {
        ...baseFeedback,
        overall: 'Excellent work! ' + baseFeedback.overall,
        strengths: baseFeedback.strengths + '\n• Shows great potential for growth',
      };
    case 'more-concise':
      return {
        ...baseFeedback,
        overall: baseFeedback.overall.replace(/demonstrates|provides|shows/g, 'has'),
        nextSteps: baseFeedback.nextSteps.split('\n').slice(0, 2).join('\n'),
      };
    default:
      return baseFeedback;
  }
}

/**
 * Regenerates feedback from OCR text with a specific modification.
 */
export async function regenerateFeedbackFromOcr(
  input: GenerateFeedbackFromOcrInput,
  modifier: 'shorten' | 'more-positive' | 'more-concise'
): Promise<GeneratedFeedback> {
  const baseFeedback = await generateFeedbackForSubmission(input);

  switch (modifier) {
    case 'shorten':
      return {
        ...baseFeedback,
        overall: baseFeedback.overall.split('.').slice(0, 2).join('.') + '.',
        strengths: baseFeedback.strengths.split('\n').slice(0, 2).join('\n'),
        weaknesses: baseFeedback.weaknesses.split('\n').slice(0, 2).join('\n'),
      };
    case 'more-positive':
      return {
        ...baseFeedback,
        overall: 'Excellent work! ' + baseFeedback.overall,
        strengths: baseFeedback.strengths + '\n• Shows great potential for growth',
      };
    case 'more-concise':
      return {
        ...baseFeedback,
        overall: baseFeedback.overall.replace(/demonstrates|provides|shows/g, 'has'),
        nextSteps: baseFeedback.nextSteps.split('\n').slice(0, 2).join('\n'),
      };
    default:
      return baseFeedback;
  }
}
