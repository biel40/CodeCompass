/**
 * Representa una ruta de aprendizaje con estructura de nodos conectados.
 *
 * @property id - UUID único del roadmap
 * @property title - Título descriptivo
 * @property description - Descripción detallada del contenido
 * @property category - Área tecnológica principal
 * @property difficulty - Nivel de dificultad
 * @property estimatedHours - Horas estimadas para completar
 * @property nodes - Nodos que componen el roadmap
 * @property connections - Conexiones entre nodos
 * @property isPublic - Si es visible para todos los usuarios
 * @property authorId - UUID del creador
 * @property tags - Etiquetas para búsqueda y filtrado
 */
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

/** Categorías de roadmaps por área tecnológica */
export type RoadmapCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'devops'
  | 'mobile'
  | 'data-science'
  | 'ai-ml'
  | 'other';

/** Niveles de dificultad de un roadmap */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Nodo individual dentro de un roadmap.
 * Representa un tema, proyecto, hito o checkpoint.
 */
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

/** Tipos de nodo en un roadmap */
export type NodeType = 'topic' | 'project' | 'milestone' | 'checkpoint';

/** Posición visual del nodo en el canvas */
export interface NodePosition {
  x: number;
  y: number;
}

/** Recurso de aprendizaje asociado a un nodo */
export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  isPremium: boolean;
}

/** Tipos de recursos de aprendizaje */
export type ResourceType = 'video' | 'article' | 'course' | 'documentation' | 'exercise' | 'book';

/** Conexión entre dos nodos del roadmap */
export interface RoadmapConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  /** Si es true, el nodo origen debe completarse antes del destino */
  isRequired: boolean;
}

/** Asignación de un roadmap a un estudiante */
export interface RoadmapAssignment {
  id: string;
  roadmapId: string;
  studentId: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  notes?: string;
}
