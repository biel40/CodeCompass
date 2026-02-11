import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SupabaseService } from '../../core';
import { Student, StudentProgress } from '../../models';

/**
 * Servicio para gestionar estudiantes en la base de datos.
 * Proporciona operaciones CRUD y consultas de progreso.
 *
 * @description Todas las operaciones están protegidas por Row Level Security (RLS)
 * en Supabase, garantizando que los usuarios solo accedan a datos autorizados.
 *
 * @example
 * ```typescript
 * private readonly studentsService = inject(StudentsService);
 *
 * // Obtener todos los estudiantes
 * const students = await this.studentsService.getStudents();
 *
 * // Crear un nuevo estudiante
 * const result = await this.studentsService.createStudent({
 *   fullName: 'Juan Pérez',
 *   email: 'juan@email.com',
 *   level: 'beginner'
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Obtiene todos los estudiantes ordenados por fecha de creación (más recientes primero).
   * @returns Lista de estudiantes o array vacío si hay error
   */
  async getStudents(): Promise<Student[]> {
    const { data, error } = await this.supabase.from('students').select('*').order('created_at', { ascending: false });

    if (error) {
      this.logError('Error al obtener estudiantes:', error);
      return [];
    }

    return this.mapStudents(data ?? []);
  }

  /**
   * Obtiene un estudiante por su ID.
   * @param id - UUID del estudiante
   * @returns Estudiante encontrado o null si no existe
   */
  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase.from('students').select('*').eq('id', id).single();

    if (error) {
      this.logError('Error al obtener estudiante:', error);
      return null;
    }

    return this.mapStudent(data);
  }

  /**
   * Crea un nuevo estudiante.
   * @param student - Datos parciales del estudiante (fullName y email son requeridos)
   * @returns Resultado con el estudiante creado o mensaje de error
   */
  async createStudent(student: Partial<Student>): Promise<{ success: boolean; error?: string; data?: Student }> {
    const { data, error } = await this.supabase
      .from('students')
      .insert({
        full_name: student.fullName,
        email: student.email,
        level: student.level ?? 'beginner',
        notes: student.notes,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: this.mapStudent(data) };
  }

  /**
   * Actualiza los datos de un estudiante existente.
   * @param id - UUID del estudiante a actualizar
   * @param student - Campos a actualizar
   * @returns Resultado de la operación
   */
  async updateStudent(id: string, student: Partial<Student>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('students')
      .update({
        full_name: student.fullName,
        email: student.email,
        level: student.level,
        notes: student.notes,
        is_active: student.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Elimina un estudiante de la base de datos.
   * @param id - UUID del estudiante a eliminar
   * @returns Resultado de la operación
   *
   * @warning Esta operación es irreversible. Considerar soft-delete (isActive: false) en su lugar.
   */
  async deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('students').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Obtiene el progreso de un estudiante en todos sus roadmaps asignados.
   * @param studentId - UUID del estudiante
   * @returns Lista de progreso por roadmap
   */
  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    const { data, error } = await this.supabase.from('student_progress').select('*').eq('student_id', studentId);

    if (error) {
      this.logError('Error al obtener progreso:', error);
      return [];
    }

    return (data ?? []).map((p) => ({
      studentId: p.student_id,
      roadmapId: p.roadmap_id,
      completedNodes: p.completed_nodes ?? [],
      currentNodeId: p.current_node_id,
      progressPercentage: p.progress_percentage ?? 0,
      lastActivityAt: new Date(p.last_activity_at),
    }));
  }

  /**
   * Loguea errores solo en desarrollo para evitar filtrar información en producción.
   * @internal
   */
  private logError(message: string, error: unknown): void {
    if (!environment.production) {
      console.error(message, error);
    }
  }

  /** @internal */
  private mapStudents(data: Record<string, unknown>[]): Student[] {
    return data.map((s) => this.mapStudent(s));
  }

  private mapStudent(s: Record<string, unknown>): Student {
    return {
      id: s['id'] as string,
      userId: s['user_id'] as string,
      fullName: s['full_name'] as string,
      email: s['email'] as string,
      avatarUrl: s['avatar_url'] as string | undefined,
      level: s['level'] as Student['level'],
      enrollmentDate: new Date(s['enrollment_date'] as string),
      notes: s['notes'] as string | undefined,
      isActive: s['is_active'] as boolean,
      createdAt: new Date(s['created_at'] as string),
      updatedAt: new Date(s['updated_at'] as string),
    };
  }
}
