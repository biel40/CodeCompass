/**
 * Representa un estudiante en el sistema.
 *
 * @property id - UUID único del estudiante
 * @property userId - Referencia al usuario de auth (si tiene cuenta)
 * @property fullName - Nombre completo del estudiante
 * @property email - Email de contacto
 * @property avatarUrl - URL de la foto de perfil (opcional)
 * @property level - Nivel actual del estudiante
 * @property enrollmentDate - Fecha de inscripción
 * @property notes - Notas del profesor sobre el estudiante
 * @property isActive - Si el estudiante está activo en el sistema
 */
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

/**
 * Niveles de conocimiento de un estudiante.
 * - `beginner`: Principiante, conceptos básicos
 * - `intermediate`: Intermedio, puede trabajar con supervisión
 * - `advanced`: Avanzado, trabaja de forma autónoma
 */
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Progreso de un estudiante en un roadmap específico.
 */
export interface StudentProgress {
  /** UUID del estudiante */
  studentId: string;
  /** UUID del roadmap */
  roadmapId: string;
  /** IDs de los nodos completados */
  completedNodes: string[];
  /** ID del nodo en el que está actualmente */
  currentNodeId: string | null;
  /** Porcentaje de completado (0-100) */
  progressPercentage: number;
  /** Fecha de última actividad */
  lastActivityAt: Date;
}
