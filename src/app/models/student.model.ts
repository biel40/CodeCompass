export interface Student {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  level: StudentLevel;
  enrollmentDate: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StudentProgress {
  studentId: string;
  roadmapId: string;
  completedNodes: string[];
  currentNodeId: string | null;
  progressPercentage: number;
  lastActivityAt: Date;
}
