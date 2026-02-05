export interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: RoadmapCategory;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  nodes: RoadmapNode[];
  connections: RoadmapConnection[];
  isPublic: boolean;
  authorId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RoadmapCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'devops'
  | 'mobile'
  | 'data-science'
  | 'ai-ml'
  | 'other';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: NodeType;
  position: NodePosition;
  resources: Resource[];
  estimatedHours: number;
  isOptional: boolean;
}

export type NodeType = 'topic' | 'project' | 'milestone' | 'checkpoint';

export interface NodePosition {
  x: number;
  y: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  isPremium: boolean;
}

export type ResourceType = 'video' | 'article' | 'course' | 'documentation' | 'exercise' | 'book';

export interface RoadmapConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  isRequired: boolean;
}

export interface RoadmapAssignment {
  id: string;
  roadmapId: string;
  studentId: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  notes?: string;
}
