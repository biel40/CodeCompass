/**
 * Plantilla de bono reutilizable.
 * Define configuraciones predeterminadas para bonos de clases.
 *
 * @example
 * ```typescript
 * const bundle: Bundle = {
 *   id: 'uuid',
 *   userId: 'user-uuid',
 *   name: 'Bono 5 clases',
 *   totalClasses: 5,
 *   defaultPrice: 50,
 *   description: 'Bono básico de 5 clases a 10€/clase',
 *   isActive: true
 * };
 * ```
 */
export interface Bundle {
  id: string;
  userId: string;
  name: string;
  totalClasses: number;
  defaultPrice: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bono asignado a un estudiante específico.
 * Representa un contrato de clases con seguimiento de uso y pago.
 */
export interface StudentBundle {
  id: string;
  studentId: string;
  bundleId?: string;
  name: string;
  totalClasses: number;
  classesUsed: number;
  totalPrice: number;
  /** Precio calculado por clase (totalPrice / totalClasses) */
  pricePerClass: number;
  isPaid: boolean;
  paymentDate?: Date;
  status: StudentBundleStatus;
  notes?: string;
  startsAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Estados posibles de un bono de estudiante */
export type StudentBundleStatus = 'active' | 'completed' | 'expired' | 'cancelled';

/**
 * Registro de una sesión de clase impartida.
 */
export interface ClassSession {
  id: string;
  studentId: string;
  studentBundleId?: string;
  sessionDate: Date;
  durationMinutes: number;
  topic?: string;
  notes?: string;
  createdAt: Date;
}

/**
 * Resumen de ingresos por estudiante.
 * Usado para vistas de dashboard y reportes.
 */
export interface StudentEarnings {
  studentId: string;
  fullName: string;
  email?: string;
  totalBundles: number;
  totalPaid: number;
  totalPending: number;
  totalAmount: number;
  totalSessions: number;
}

/**
 * Datos para crear un nuevo bono de estudiante.
 */
export interface CreateStudentBundleData {
  studentId: string;
  bundleId?: string;
  name: string;
  totalClasses: number;
  totalPrice: number;
  isPaid?: boolean;
  paymentDate?: Date;
  notes?: string;
  startsAt?: Date;
  expiresAt?: Date;
}

/**
 * Datos para crear una nueva sesión de clase.
 */
export interface CreateClassSessionData {
  studentId: string;
  studentBundleId?: string;
  sessionDate: Date;
  durationMinutes?: number;
  topic?: string;
  notes?: string;
}
