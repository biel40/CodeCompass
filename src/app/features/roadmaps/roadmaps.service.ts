import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SupabaseService } from '../../core';
import { Roadmap, RoadmapAssignment } from '../../models';

/**
 * Servicio para gestionar roadmaps de aprendizaje.
 * Proporciona operaciones CRUD y gestión de asignaciones a estudiantes.
 *
 * @description Los roadmaps son rutas de aprendizaje visuales compuestas por nodos
 * conectados que representan temas, proyectos y checkpoints.
 *
 * @example
 * ```typescript
 * private readonly roadmapsService = inject(RoadmapsService);
 *
 * // Obtener todos los roadmaps
 * const roadmaps = await this.roadmapsService.getRoadmaps();
 *
 * // Asignar un roadmap a un estudiante
 * await this.roadmapsService.assignRoadmap(roadmapId, studentId, teacherId);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RoadmapsService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Obtiene todos los roadmaps ordenados por fecha de creación.
   * @returns Lista de roadmaps o array vacío si hay error
   */
  async getRoadmaps(): Promise<Roadmap[]> {
    const { data, error } = await this.supabase.from('roadmaps').select('*').order('created_at', { ascending: false });

    if (error) {
      this.logError('Error al obtener roadmaps:', error);
      return [];
    }

    return this.mapRoadmaps(data ?? []);
  }

  /**
   * Obtiene un roadmap por su ID.
   * @param id - UUID del roadmap
   * @returns Roadmap encontrado o null si no existe
   */
  async getRoadmapById(id: string): Promise<Roadmap | null> {
    const { data, error } = await this.supabase.from('roadmaps').select('*').eq('id', id).single();

    if (error) {
      this.logError('Error al obtener roadmap:', error);
      return null;
    }

    return this.mapRoadmap(data);
  }

  /**
   * Crea un nuevo roadmap.
   * @param roadmap - Datos del roadmap (title y description son requeridos)
   * @returns Resultado con el roadmap creado o mensaje de error
   */
  async createRoadmap(roadmap: Partial<Roadmap>): Promise<{ success: boolean; error?: string; data?: Roadmap }> {
    const { data, error } = await this.supabase
      .from('roadmaps')
      .insert({
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category,
        difficulty: roadmap.difficulty,
        estimated_hours: roadmap.estimatedHours,
        nodes: roadmap.nodes ?? [],
        connections: roadmap.connections ?? [],
        is_public: roadmap.isPublic ?? false,
        tags: roadmap.tags ?? [],
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: this.mapRoadmap(data) };
  }

  /**
   * Actualiza un roadmap existente.
   * @param id - UUID del roadmap a actualizar
   * @param roadmap - Campos a actualizar
   * @returns Resultado de la operación
   */
  async updateRoadmap(id: string, roadmap: Partial<Roadmap>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('roadmaps')
      .update({
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category,
        difficulty: roadmap.difficulty,
        estimated_hours: roadmap.estimatedHours,
        nodes: roadmap.nodes,
        connections: roadmap.connections,
        is_public: roadmap.isPublic,
        tags: roadmap.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Elimina un roadmap de la base de datos.
   * @param id - UUID del roadmap a eliminar
   * @returns Resultado de la operación
   *
   * @warning Esto también eliminará todas las asignaciones asociadas
   */
  async deleteRoadmap(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('roadmaps').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Asigna un roadmap a un estudiante.
   * @param roadmapId - UUID del roadmap
   * @param studentId - UUID del estudiante
   * @param assignedBy - UUID del usuario que realiza la asignación
   * @param dueDate - Fecha límite opcional para completar el roadmap
   * @returns Resultado de la operación
   */
  async assignRoadmap(
    roadmapId: string,
    studentId: string,
    assignedBy: string,
    dueDate?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('roadmap_assignments').insert({
      roadmap_id: roadmapId,
      student_id: studentId,
      assigned_by: assignedBy,
      due_date: dueDate?.toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Obtiene las asignaciones de roadmaps de un estudiante.
   * @param studentId - UUID del estudiante
   * @returns Lista de asignaciones con datos del roadmap incluidos
   */
  async getStudentAssignments(studentId: string): Promise<RoadmapAssignment[]> {
    const { data, error } = await this.supabase
      .from('roadmap_assignments')
      .select('*, roadmaps(*)')
      .eq('student_id', studentId);

    if (error) {
      this.logError('Error al obtener asignaciones:', error);
      return [];
    }

    return (data ?? []).map((a) => ({
      id: a.id,
      roadmapId: a.roadmap_id,
      studentId: a.student_id,
      assignedBy: a.assigned_by,
      assignedAt: new Date(a.assigned_at),
      dueDate: a.due_date ? new Date(a.due_date) : undefined,
      notes: a.notes,
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
  private mapRoadmaps(data: Record<string, unknown>[]): Roadmap[] {
    return data.map((r) => this.mapRoadmap(r));
  }

  private mapRoadmap(r: Record<string, unknown>): Roadmap {
    return {
      id: r['id'] as string,
      title: r['title'] as string,
      description: r['description'] as string,
      category: r['category'] as Roadmap['category'],
      difficulty: r['difficulty'] as Roadmap['difficulty'],
      estimatedHours: r['estimated_hours'] as number,
      nodes: (r['nodes'] as Roadmap['nodes']) ?? [],
      connections: (r['connections'] as Roadmap['connections']) ?? [],
      isPublic: r['is_public'] as boolean,
      authorId: r['author_id'] as string,
      tags: (r['tags'] as string[]) ?? [],
      createdAt: new Date(r['created_at'] as string),
      updatedAt: new Date(r['updated_at'] as string),
    };
  }
}
