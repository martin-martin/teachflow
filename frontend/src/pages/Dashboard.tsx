import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Settings, 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { RUBRIC_TEMPLATES, RubricType } from '@/types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { teacher, assignments, setCurrentAssignment, addAssignment } = useAppStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: '',
    description: '',
    className: '',
    dueDate: '',
    rubricType: 'essay' as RubricType,
  });

  const handleCreateAssignment = () => {
    if (newAssignment.name && newAssignment.className) {
      addAssignment(newAssignment);
      setNewAssignment({
        name: '',
        description: '',
        className: '',
        dueDate: '',
        rubricType: 'essay',
      });
      setIsCreateOpen(false);
    }
  };

  const handleOpenAssignment = (assignmentId: string) => {
    setCurrentAssignment(assignmentId);
    navigate('/grading');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">FeedbackAI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{teacher?.name}</span>
            </span>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Select an assignment to start grading
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Set up a new assignment for grading with AI assistance.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Assignment Name</Label>
                  <Input
                    id="name"
                    value={newAssignment.name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                    placeholder="e.g., Essay 2 – Modern Literature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Brief description of the assignment..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class Name</Label>
                    <Input
                      id="class"
                      value={newAssignment.className}
                      onChange={(e) => setNewAssignment({ ...newAssignment, className: e.target.value })}
                      placeholder="e.g., English 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubric">Grading Rubric</Label>
                  <Select
                    value={newAssignment.rubricType}
                    onValueChange={(value: RubricType) => setNewAssignment({ ...newAssignment, rubricType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RUBRIC_TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignment Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment, index) => {
            const progress = Math.round((assignment.gradedCount / assignment.studentCount) * 100);
            const isComplete = progress === 100;

            return (
              <Card
                key={assignment.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleOpenAssignment(assignment.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant={isComplete ? 'default' : 'secondary'}
                      className={isComplete ? 'bg-success hover:bg-success' : ''}
                    >
                      {assignment.className}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {assignment.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                    {assignment.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{assignment.studentCount} students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(assignment.dueDate)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium flex items-center gap-1.5">
                          {isComplete && <CheckCircle2 className="w-4 h-4 text-success" />}
                          {assignment.gradedCount}/{assignment.studentCount} graded ({progress}%)
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {formatRelativeTime(assignment.lastUpdated)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <GraduationCap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first assignment to start grading with AI assistance.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
