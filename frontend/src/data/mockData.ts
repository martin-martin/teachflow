import { Assignment, Student, Question, Answer, Submission, Feedback, RubricScore } from '@/types';

export const mockStudents: Student[] = [
  { id: 's1', name: 'Emma Thompson', className: 'English 101' },
  { id: 's2', name: 'James Wilson', className: 'English 101' },
  { id: 's3', name: 'Sofia Rodriguez', className: 'English 101' },
  { id: 's4', name: 'Michael Chen', className: 'English 101' },
  { id: 's5', name: 'Olivia Johnson', className: 'English 101' },
  { id: 's6', name: 'Ethan Brown', className: 'English 101' },
  { id: 's7', name: 'Ava Martinez', className: 'English 101' },
  { id: 's8', name: 'Noah Davis', className: 'English 101' },
  { id: 's9', name: 'Isabella Garcia', className: 'English 101' },
  { id: 's10', name: 'Liam Anderson', className: 'English 101' },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    teacherId: 't1',
    name: 'Essay 1 – Climate Change',
    description: 'Write a 500-word essay analyzing the effects of climate change on global ecosystems.',
    rubricType: 'essay',
    dueDate: '2024-03-15',
    className: 'English 101',
    studentCount: 10,
    gradedCount: 4,
    lastUpdated: '2024-03-12T14:30:00Z',
  },
  {
    id: 'a2',
    teacherId: 't1',
    name: 'Short Answer Quiz – World History',
    description: 'Answer questions about key events in 20th century history.',
    rubricType: 'short-answer',
    dueDate: '2024-03-10',
    className: 'History 201',
    studentCount: 8,
    gradedCount: 8,
    lastUpdated: '2024-03-11T10:15:00Z',
  },
  {
    id: 'a3',
    teacherId: 't1',
    name: 'Programming Assignment – Data Structures',
    description: 'Implement a binary search tree with insertion and deletion methods.',
    rubricType: 'code',
    dueDate: '2024-03-20',
    className: 'CS 301',
    studentCount: 6,
    gradedCount: 0,
    lastUpdated: '2024-03-08T09:00:00Z',
  },
];

export const mockQuestions: Question[] = [
  { id: 'q1', assignmentId: 'a1', index: 1, prompt: 'Describe the primary causes of climate change and their sources.' },
  { id: 'q2', assignmentId: 'a1', index: 2, prompt: 'What are the effects of climate change on marine ecosystems?' },
  { id: 'q3', assignmentId: 'a1', index: 3, prompt: 'How does climate change impact biodiversity on land?' },
  { id: 'q4', assignmentId: 'a1', index: 4, prompt: 'Propose three actionable solutions to mitigate climate change effects.' },
  { id: 'q5', assignmentId: 'a1', index: 5, prompt: 'Conclude with your perspective on individual vs. collective responsibility.' },
];

const sampleAnswers = [
  `Climate change is primarily caused by the burning of fossil fuels such as coal, oil, and natural gas. These activities release large amounts of carbon dioxide and other greenhouse gases into the atmosphere. Deforestation also contributes significantly, as trees absorb CO2 and their removal reduces this natural carbon sink. Industrial processes, agriculture, and transportation are major sources of emissions.

The greenhouse effect, while natural and necessary for life, becomes problematic when enhanced by human activities. Methane from livestock and rice paddies, nitrous oxide from fertilizers, and various industrial chemicals compound the problem. The concentration of CO2 in the atmosphere has risen from about 280 ppm before industrialization to over 420 ppm today.`,

  `Marine ecosystems are profoundly affected by climate change through several mechanisms. Ocean acidification, caused by absorbed CO2, makes it difficult for shellfish, corals, and plankton to form their calcium carbonate shells and skeletons. This threatens the foundation of marine food webs.

Rising ocean temperatures cause coral bleaching, destroying reef ecosystems that support 25% of all marine species. Warmer waters also drive fish populations toward the poles, disrupting established fishing communities. Sea level rise threatens coastal wetlands that serve as nurseries for many species.

Changes in ocean currents alter nutrient distribution, affecting productivity throughout the marine environment. Some areas become "dead zones" with insufficient oxygen to support life.`,

  `Terrestrial biodiversity faces multiple threats from climate change. Species that cannot adapt quickly enough or migrate to suitable habitats face extinction. Mountain species are particularly vulnerable as they run out of higher ground to occupy.

Phenological mismatches occur when species' life cycles become out of sync with their food sources or pollinators. For example, if flowers bloom before their pollinators emerge, both populations suffer. Forest composition is shifting as temperatures change, with some tree species declining while others expand their range.

Extreme weather events destroy habitats and can eliminate local populations. Droughts, floods, and wildfires have become more frequent and intense, leaving little time for recovery between events.`,

  `First, transitioning to renewable energy sources is essential. Solar, wind, and hydroelectric power can replace fossil fuels while creating jobs and energy independence. Government incentives and regulations can accelerate this transition.

Second, improving energy efficiency in buildings, transportation, and industry reduces overall demand. This includes better insulation, electric vehicles, and more efficient manufacturing processes. These changes often save money while reducing emissions.

Third, protecting and restoring forests and other natural carbon sinks removes CO2 from the atmosphere. Reforestation, sustainable forestry, and protecting peatlands and mangroves all contribute. Agricultural practices like no-till farming and cover crops can store carbon in soil.`,

  `While individual actions like reducing consumption and making sustainable choices matter, systemic change is essential. Governments and corporations control the majority of emissions through policy decisions and business practices.

However, collective action emerges from individual commitment. Voting for climate-conscious leaders, supporting sustainable businesses, and participating in movements creates political will for change. The climate crisis requires both personal responsibility and structural transformation.

Ultimately, climate change is a global problem requiring international cooperation. The Paris Agreement represents progress, but stronger commitments and enforcement mechanisms are needed. Future generations will judge us by how we respond to this challenge.`,
];

export const mockSubmissions: Submission[] = mockStudents.map((student, index) => ({
  id: `sub${index + 1}`,
  assignmentId: 'a1',
  studentId: student.id,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

export const mockAnswers: Answer[] = mockSubmissions.flatMap((submission) =>
  mockQuestions.map((question, qIndex) => ({
    id: `ans-${submission.id}-${question.id}`,
    submissionId: submission.id,
    questionId: question.id,
    content: sampleAnswers[qIndex] || 'Sample student answer for this question.',
  }))
);

const createDefaultRubricScores = (): RubricScore[] => [
  { criterion: 'Content', score: 0, maxScore: 5, comment: '' },
  { criterion: 'Structure', score: 0, maxScore: 5, comment: '' },
  { criterion: 'Language', score: 0, maxScore: 5, comment: '' },
];

export const mockFeedback: Feedback[] = mockSubmissions.flatMap((submission, sIndex) =>
  mockQuestions.map((question, qIndex) => ({
    id: `fb-${submission.id}-${question.id}`,
    submissionId: submission.id,
    questionId: question.id,
    overall: '',
    strengths: '',
    weaknesses: '',
    nextSteps: '',
    rubricScores: createDefaultRubricScores(),
    status: sIndex < 4 ? (qIndex < 3 ? 'graded' : 'not-graded') : 'not-graded',
    lastGenerated: sIndex < 4 && qIndex < 3 ? new Date(Date.now() - 60000).toISOString() : undefined,
    savedAt: sIndex < 4 && qIndex < 3 ? new Date(Date.now() - 30000).toISOString() : undefined,
  }))
);

export function getStudentStatus(studentId: string, assignmentId: string): 'not-graded' | 'graded' | 'needs-review' {
  const studentFeedback = mockFeedback.filter(
    (fb) => mockSubmissions.find((s) => s.id === fb.submissionId)?.studentId === studentId
  );
  
  const allGraded = studentFeedback.every((fb) => fb.status === 'graded');
  const hasNeedsReview = studentFeedback.some((fb) => fb.status === 'needs-review');
  const hasAnyGraded = studentFeedback.some((fb) => fb.status === 'graded');
  
  if (hasNeedsReview) return 'needs-review';
  if (allGraded && studentFeedback.length > 0) return 'graded';
  if (hasAnyGraded) return 'needs-review';
  return 'not-graded';
}
