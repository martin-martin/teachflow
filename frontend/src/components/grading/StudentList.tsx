import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { GradingStatus } from '@/types';
import { cn } from '@/lib/utils';

const StudentList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GradingStatus>('all');

  const {
    currentStudentId,
    setCurrentStudent,
    getStudentStatus,
    backendStudents,
    backendStudentsLoading,
    backendStudentsError,
    fetchStudentsFromBackend,
    clearCurrentGradingResult,
  } = useAppStore();

  // Fetch students from backend on mount
  useEffect(() => {
    fetchStudentsFromBackend();
  }, [fetchStudentsFromBackend]);

  const handleSelectStudent = (studentId: string) => {
    setCurrentStudent(studentId);
    clearCurrentGradingResult();
  };

  const filteredStudents = useMemo(() => {
    return backendStudents.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getStudentStatus(student.id);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [backendStudents, searchQuery, statusFilter, getStudentStatus]);

  const getStatusBadge = (status: GradingStatus) => {
    switch (status) {
      case 'graded':
        return (
          <span className="status-pill bg-success/10 text-success">
            Graded
          </span>
        );
      case 'needs-review':
        return (
          <span className="status-pill bg-warning/10 text-warning">
            Needs Review
          </span>
        );
      default:
        return (
          <span className="status-pill bg-muted text-muted-foreground">
            Not Graded
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Students</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => fetchStudentsFromBackend()}
            disabled={backendStudentsLoading}
          >
            <RefreshCw className={cn("w-4 h-4", backendStudentsLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | GradingStatus)}
          >
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="not-graded">Not Graded</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto p-2">
        {backendStudentsLoading && backendStudents.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : backendStudentsError ? (
          <div className="text-center py-8 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-destructive font-medium">Failed to load students</p>
            <p className="text-muted-foreground text-xs mt-1">{backendStudentsError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchStudentsFromBackend()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredStudents.map((student, index) => {
              const status = getStudentStatus(student.id);
              const isActive = currentStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={cn('student-row animate-slide-in', isActive && 'active')}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => handleSelectStudent(student.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}

            {filteredStudents.length === 0 && backendStudents.length > 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No students match your filters
              </div>
            )}

            {backendStudents.length === 0 && !backendStudentsLoading && !backendStudentsError && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No students available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          {filteredStudents.length} of {backendStudents.length} students
        </p>
      </div>
    </div>
  );
};

export default StudentList;

