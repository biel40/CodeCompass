import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../../core';
import { Student, StudentProgress } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private readonly supabase = inject(SupabaseService);

  async getStudents(): Promise<Student[]> {
    const { data, error } = await this.supabase.from('students').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }

    return this.mapStudents(data ?? []);
  }

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase.from('students').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching student:', error);
      return null;
    }

    return this.mapStudent(data);
  }

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

  async deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('students').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    const { data, error } = await this.supabase.from('student_progress').select('*').eq('student_id', studentId);

    if (error) {
      console.error('Error fetching progress:', error);
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
