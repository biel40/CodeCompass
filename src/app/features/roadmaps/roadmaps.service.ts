import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../../core';
import { Roadmap, RoadmapAssignment } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class RoadmapsService {
  private readonly supabase = inject(SupabaseService);

  async getRoadmaps(): Promise<Roadmap[]> {
    const { data, error } = await this.supabase.from('roadmaps').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching roadmaps:', error);
      return [];
    }

    return this.mapRoadmaps(data ?? []);
  }

  async getRoadmapById(id: string): Promise<Roadmap | null> {
    const { data, error } = await this.supabase.from('roadmaps').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching roadmap:', error);
      return null;
    }

    return this.mapRoadmap(data);
  }

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

  async deleteRoadmap(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('roadmaps').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

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

  async getStudentAssignments(studentId: string): Promise<RoadmapAssignment[]> {
    const { data, error } = await this.supabase
      .from('roadmap_assignments')
      .select('*, roadmaps(*)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching assignments:', error);
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
