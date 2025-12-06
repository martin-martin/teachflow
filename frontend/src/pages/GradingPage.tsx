import { useState, useRef } from "react";
import { Settings, ChevronLeft, ChevronRight, Save, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// Configure your backend URL here
const API_BASE = "http://127.0.0.1:8000";

interface StudentData {
  submissionText: string;
  feedback: {
    grade: string;
    summary_feedback: string;
    issues?: Array<{
      type: string;
      quote: string;
      comment: string;
      correction: string;
    }>;
  } | null;
}

const GradingPage = () => {
  const [students, setStudents] = useState<string[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number | null>(null);
  const [studentData, setStudentData] = useState<Record<string, StudentData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedStudent = selectedStudentIndex !== null ? students[selectedStudentIndex] : null;
  const currentData = selectedStudent ? studentData[selectedStudent] : null;

  // Convert student name to ID (simple: remove spaces, lowercase)
  const nameToId = (name: string) => name.toLowerCase().replace(/\s+/g, "_");

  const addStudent = () => {
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    if (students.includes(trimmed)) {
      toast({
        title: "Student exists",
        description: "This student name already exists",
        variant: "destructive",
      });
      return;
    }
    setStudents([...students, trimmed]);
    setSelectedStudentIndex(students.length);
    setNewStudentName("");
  };

  const removeStudent = (index: number) => {
    const studentName = students[index];
    const newStudents = students.filter((_, i) => i !== index);
    setStudents(newStudents);
    
    // Remove student data
    const newData = { ...studentData };
    delete newData[studentName];
    setStudentData(newData);
    
    // Adjust selection
    if (selectedStudentIndex === index) {
      setSelectedStudentIndex(newStudents.length > 0 ? 0 : null);
    } else if (selectedStudentIndex !== null && selectedStudentIndex > index) {
      setSelectedStudentIndex(selectedStudentIndex - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setStudentData((prev) => ({
        ...prev,
        [selectedStudent]: {
          ...prev[selectedStudent],
          submissionText: text,
          feedback: prev[selectedStudent]?.feedback || null,
        },
      }));
      await generateFeedback(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const generateFeedback = async (text: string) => {
    if (!selectedStudent) return;
    setIsGenerating(true);

    const studentId = nameToId(selectedStudent);

    try {
      const response = await fetch(`${API_BASE}/submissions/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay_text: text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate feedback");
      }

      const data = await response.json();
      setStudentData((prev) => ({
        ...prev,
        [selectedStudent]: {
          ...prev[selectedStudent],
          submissionText: text,
          feedback: data,
        },
      }));

      toast({
        title: "Success",
        description: "AI feedback generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate feedback",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateFeedbackText = (field: "grade" | "summary_feedback", value: string) => {
    if (!selectedStudent || !currentData?.feedback) return;
    setStudentData((prev) => ({
      ...prev,
      [selectedStudent]: {
        ...prev[selectedStudent],
        feedback: {
          ...prev[selectedStudent].feedback!,
          [field]: value,
        },
      },
    }));
  };

  const saveFeedback = async () => {
    if (!selectedStudent || !currentData?.feedback) return;

    const studentId = nameToId(selectedStudent);

    try {
      const response = await fetch(`${API_BASE}/feedback/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentData.feedback),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save feedback");
      }

      toast({
        title: "Saved",
        description: "Feedback saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save feedback",
        variant: "destructive",
      });
    }
  };

  const navigateStudent = (direction: "prev" | "next") => {
    if (students.length === 0 || selectedStudentIndex === null) return;
    let newIndex = selectedStudentIndex;
    if (direction === "prev") {
      newIndex = selectedStudentIndex > 0 ? selectedStudentIndex - 1 : students.length - 1;
    } else {
      newIndex = selectedStudentIndex < students.length - 1 ? selectedStudentIndex + 1 : 0;
    }
    setSelectedStudentIndex(newIndex);
  };

  const savePrintedVersion = () => {
    if (!selectedStudent || !currentData) return;

    const feedbackText = currentData.feedback
      ? `Grade: ${currentData.feedback.grade}\n\nFeedback: ${currentData.feedback.summary_feedback}`
      : "No feedback generated";

    const content = `Student: ${selectedStudent}\n\n--- Submission ---\n${currentData.submissionText || "No submission"}\n\n--- Feedback ---\n${feedbackText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStudent.replace(/\s+/g, "_")}_feedback.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Saved",
      description: "Feedback saved as text file",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addStudent();
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-card">
        {/* AI Config Button */}
        <div className="p-3 border-b border-border">
          <Button variant="outline" className="w-full justify-start gap-2" disabled>
            <Settings className="h-4 w-4" />
            AI Config
          </Button>
        </div>

        {/* Add Student Input */}
        <div className="p-3 border-b border-border">
          <div className="flex gap-2">
            <Input
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Input student name"
              className="flex-1 text-sm"
            />
            <Button variant="outline" size="icon" onClick={addStudent} disabled={!newStudentName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Student List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No students added yet
              </p>
            ) : (
              <div className="space-y-1">
                {students.map((student, index) => (
                  <div
                    key={student}
                    className={`group flex items-center gap-2 rounded-lg transition-colors ${
                      index === selectedStudentIndex
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedStudentIndex(index)}
                      className="flex-1 text-left px-3 py-2 text-sm"
                    >
                      {student}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${
                        index === selectedStudentIndex
                          ? "text-primary-foreground hover:bg-primary/80"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStudent(index);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Student Sheet Area */}
        <div className="flex-1 border border-border rounded-lg bg-card p-4 flex flex-col min-h-0">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">The student sheet</p>
                <p className="text-sm mt-2">Add a student and upload a text file to begin</p>
              </div>
            </div>
          ) : currentData?.submissionText ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{selectedStudent}'s Submission</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Replace
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {currentData.submissionText}
                </pre>
              </ScrollArea>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-lg font-medium text-muted-foreground">The student sheet</p>
              <p className="text-sm text-muted-foreground">
                Upload a text file to generate AI feedback for {selectedStudent}
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload text file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* AI Feedback Area */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="font-semibold mb-3">AI Feedback (modifiable by the teacher)</h3>
          {isGenerating ? (
            <p className="text-muted-foreground text-sm">Generating feedback...</p>
          ) : currentData?.feedback ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Grade</label>
                <Input
                  type="text"
                  value={currentData.feedback.grade}
                  onChange={(e) => updateFeedbackText("grade", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Summary Feedback</label>
                <Textarea
                  value={currentData.feedback.summary_feedback}
                  onChange={(e) => updateFeedbackText("summary_feedback", e.target.value)}
                  className="mt-1 min-h-[100px] resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={saveFeedback}>
                  Save Feedback
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {selectedStudent ? "Upload a submission to generate AI feedback" : "Select a student to view feedback"}
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigateStudent("prev")}
            disabled={students.length === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous student
          </Button>
          <Button
            variant="default"
            onClick={savePrintedVersion}
            disabled={!selectedStudent || !currentData?.feedback}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save the printed version
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateStudent("next")}
            disabled={students.length === 0}
            className="gap-2"
          >
            Next student
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default GradingPage;