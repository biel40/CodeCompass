import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SupabaseService } from '../../core';
import {
  Bundle,
  ClassSession,
  CreateClassSessionData,
  CreateStudentBundleData,
  StudentBundle,
  StudentEarnings,
} from '../../models';

/**
 * Servicio para gestionar bonos de clases.
 * Proporciona operaciones CRUD para bonos, bonos de estudiantes y sesiones de clase.
 * @description Todas las operaciones están protegidas por Row Level Security (RLS)
 * en Supabase, garantizando que los usuarios solo accedan a datos autorizados.
 */
@Injectable({
  providedIn: 'root',
})
export class BundlesService {
  private readonly supabase = inject(SupabaseService);

  // ============================================
  // PLANTILLAS DE BONOS (bundles)
  // ============================================

  /**
   * Obtiene todas las plantillas de bonos del usuario.
   */
  async getBundles(): Promise<Bundle[]> {
    const { data, error } = await this.supabase
      .from('bundles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logError('Error al obtener bonos:', error);
      return [];
    }

    return (data ?? []).map((b) => this.mapBundle(b));
  }

  /**
   * Obtiene una plantilla de bono por ID.
   */
  async getBundleById(id: string): Promise<Bundle | null> {
    const { data, error } = await this.supabase.from('bundles').select('*').eq('id', id).single();

    if (error) {
      this.logError('Error al obtener bono:', error);
      return null;
    }

    return this.mapBundle(data);
  }

  /**
   * Crea una nueva plantilla de bono.
   */
  async createBundle(bundle: Partial<Bundle>): Promise<{ success: boolean; error?: string; data?: Bundle }> {
    const { data, error } = await this.supabase
      .from('bundles')
      .insert({
        name: bundle.name,
        total_classes: bundle.totalClasses,
        default_price: bundle.defaultPrice,
        description: bundle.description,
        is_active: bundle.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: this.mapBundle(data) };
  }

  /**
   * Actualiza una plantilla de bono existente.
   */
  async updateBundle(id: string, bundle: Partial<Bundle>): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('bundles')
      .update({
        name: bundle.name,
        total_classes: bundle.totalClasses,
        default_price: bundle.defaultPrice,
        description: bundle.description,
        is_active: bundle.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Elimina una plantilla de bono.
   */
  async deleteBundle(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('bundles').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ============================================
  // BONOS DE ESTUDIANTES (student_bundles)
  // ============================================

  /**
   * Obtiene todos los bonos de un estudiante.
   */
  async getStudentBundles(studentId: string): Promise<StudentBundle[]> {
    const { data, error } = await this.supabase
      .from('student_bundles')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logError('Error al obtener bonos del estudiante:', error);
      return [];
    }

    return (data ?? []).map((sb) => this.mapStudentBundle(sb));
  }

  /**
   * Obtiene un bono de estudiante por ID.
   */
  async getStudentBundleById(id: string): Promise<StudentBundle | null> {
    const { data, error } = await this.supabase.from('student_bundles').select('*').eq('id', id).single();

    if (error) {
      this.logError('Error al obtener bono de estudiante:', error);
      return null;
    }

    return this.mapStudentBundle(data);
  }

  /**
   * Asigna un nuevo bono a un estudiante.
   */
  async createStudentBundle(
    bundleData: CreateStudentBundleData
  ): Promise<{ success: boolean; error?: string; data?: StudentBundle }> {
    const { data, error } = await this.supabase
      .from('student_bundles')
      .insert({
        student_id: bundleData.studentId,
        bundle_id: bundleData.bundleId,
        name: bundleData.name,
        total_classes: bundleData.totalClasses,
        total_price: bundleData.totalPrice,
        is_paid: bundleData.isPaid ?? false,
        payment_date: bundleData.paymentDate?.toISOString().split('T')[0],
        notes: bundleData.notes,
        starts_at: bundleData.startsAt?.toISOString().split('T')[0],
        expires_at: bundleData.expiresAt?.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: this.mapStudentBundle(data) };
  }

  /**
   * Actualiza un bono de estudiante.
   */
  async updateStudentBundle(
    id: string,
    bundleData: Partial<CreateStudentBundleData & { isPaid: boolean; status: string }>
  ): Promise<{ success: boolean; error?: string }> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (bundleData.name !== undefined) updateData['name'] = bundleData.name;
    if (bundleData.totalClasses !== undefined) updateData['total_classes'] = bundleData.totalClasses;
    if (bundleData.totalPrice !== undefined) updateData['total_price'] = bundleData.totalPrice;
    if (bundleData.isPaid !== undefined) updateData['is_paid'] = bundleData.isPaid;
    if (bundleData.paymentDate !== undefined)
      updateData['payment_date'] = bundleData.paymentDate.toISOString().split('T')[0];
    if (bundleData.notes !== undefined) updateData['notes'] = bundleData.notes;
    if (bundleData.status !== undefined) updateData['status'] = bundleData.status;
    if (bundleData.expiresAt !== undefined) updateData['expires_at'] = bundleData.expiresAt.toISOString().split('T')[0];

    const { error } = await this.supabase.from('student_bundles').update(updateData).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Elimina un bono de estudiante.
   */
  async deleteStudentBundle(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('student_bundles').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Marca un bono como pagado.
   */
  async markBundleAsPaid(id: string, paymentDate?: Date): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('student_bundles')
      .update({
        is_paid: true,
        payment_date: (paymentDate ?? new Date()).toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ============================================
  // SESIONES DE CLASE (class_sessions)
  // ============================================

  /**
   * Obtiene todas las sesiones de un estudiante.
   */
  async getClassSessions(studentId: string): Promise<ClassSession[]> {
    const { data, error } = await this.supabase
      .from('class_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('session_date', { ascending: false });

    if (error) {
      this.logError('Error al obtener sesiones:', error);
      return [];
    }

    return (data ?? []).map((s) => this.mapClassSession(s));
  }

  /**
   * Obtiene las sesiones asociadas a un bono específico.
   */
  async getSessionsByBundle(bundleId: string): Promise<ClassSession[]> {
    const { data, error } = await this.supabase
      .from('class_sessions')
      .select('*')
      .eq('student_bundle_id', bundleId)
      .order('session_date', { ascending: false });

    if (error) {
      this.logError('Error al obtener sesiones del bono:', error);
      return [];
    }

    return (data ?? []).map((s) => this.mapClassSession(s));
  }

  /**
   * Registra una nueva sesión de clase.
   * Tras insertar, incrementa classes_used en el bono asociado si lo hay.
   */
  async createClassSession(
    sessionData: CreateClassSessionData
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('class_sessions')
      .insert({
        student_id: sessionData.studentId,
        student_bundle_id: sessionData.studentBundleId,
        session_date: sessionData.sessionDate.toISOString().split('T')[0],
        duration_minutes: sessionData.durationMinutes ?? 60,
        topic: sessionData.topic,
        notes: sessionData.notes,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // El trigger de Supabase incrementa classes_used automáticamente
    return { success: true };
  }

  /**
   * Elimina una sesión de clase y decrementa classes_used del bono asociado.
   */
  async deleteClassSession(id: string, _studentBundleId?: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.from('class_sessions').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // El trigger de Supabase decrementa classes_used automáticamente
    return { success: true };
  }

  /**
   * Actualiza una sesión de clase existente (tema y/o notas).
   */
  async updateClassSession(
    id: string,
    data: { topic?: string; notes?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const updateData: Record<string, unknown> = {};

    if (data.topic !== undefined) updateData['topic'] = data.topic || null;
    if (data.notes !== undefined) updateData['notes'] = data.notes || null;

    const { error } = await this.supabase.from('class_sessions').update(updateData).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Incrementa o decrementa classes_used de un bono.
   * Actualiza el estado a 'completed' si se alcanzó el total, o a 'active' si se redujo.
   */
  async incrementClassesUsed(bundleId: string, delta: number): Promise<{ success: boolean; error?: string }> {
    const bundle = await this.getStudentBundleById(bundleId);
    if (!bundle) return { success: false, error: 'Bono no encontrado' };

    const newValue = Math.max(0, bundle.classesUsed + delta);
    const updateData: Record<string, unknown> = {
      classes_used: newValue,
      updated_at: new Date().toISOString(),
    };

    if (newValue >= bundle.totalClasses && bundle.status === 'active') {
      updateData['status'] = 'completed';
    } else if (newValue < bundle.totalClasses && bundle.status === 'completed') {
      updateData['status'] = 'active';
    }

    const { error } = await this.supabase.from('student_bundles').update(updateData).eq('id', bundleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Establece directamente el número de clases usadas de un bono.
   * Actualiza el estado automáticamente según el nuevo valor.
   */
  async setClassesUsed(bundleId: string, classesUsed: number): Promise<{ success: boolean; error?: string }> {
    const bundle = await this.getStudentBundleById(bundleId);
    if (!bundle) return { success: false, error: 'Bono no encontrado' };

    const newValue = Math.max(0, Math.min(classesUsed, bundle.totalClasses));
    const updateData: Record<string, unknown> = {
      classes_used: newValue,
      updated_at: new Date().toISOString(),
    };

    // Actualizar estado según el nuevo valor
    if (newValue >= bundle.totalClasses && bundle.status === 'active') {
      updateData['status'] = 'completed';
    } else if (newValue < bundle.totalClasses && bundle.status === 'completed') {
      updateData['status'] = 'active';
    }

    const { error } = await this.supabase.from('student_bundles').update(updateData).eq('id', bundleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ============================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================

  /**
   * Obtiene el resumen de ingresos de un estudiante.
   */
  async getStudentEarnings(studentId: string): Promise<StudentEarnings | null> {
    const { data, error } = await this.supabase.from('student_earnings').select('*').eq('student_id', studentId).single();

    if (error) {
      this.logError('Error al obtener ingresos del estudiante:', error);
      return null;
    }

    return {
      studentId: data.student_id,
      fullName: data.full_name,
      email: data.email,
      totalBundles: data.total_bundles,
      totalPaid: Number(data.total_paid),
      totalPending: Number(data.total_pending),
      totalAmount: Number(data.total_amount),
      totalSessions: data.total_sessions,
    };
  }

  /**
   * Obtiene el resumen de todos los ingresos.
   */
  async getAllStudentEarnings(): Promise<StudentEarnings[]> {
    const { data, error } = await this.supabase.from('student_earnings').select('*');

    if (error) {
      this.logError('Error al obtener ingresos:', error);
      return [];
    }

    return (data ?? []).map((e) => ({
      studentId: e.student_id,
      fullName: e.full_name,
      email: e.email,
      totalBundles: e.total_bundles,
      totalPaid: Number(e.total_paid),
      totalPending: Number(e.total_pending),
      totalAmount: Number(e.total_amount),
      totalSessions: e.total_sessions,
    }));
  }

  // ============================================
  // MAPPERS PRIVADOS
  // ============================================

  private logError(message: string, error: unknown): void {
    if (!environment.production) {
      console.error(message, error);
    }
  }

  private mapBundle(b: Record<string, unknown>): Bundle {
    return {
      id: b['id'] as string,
      userId: b['user_id'] as string,
      name: b['name'] as string,
      totalClasses: b['total_classes'] as number,
      defaultPrice: Number(b['default_price']),
      description: b['description'] as string | undefined,
      isActive: b['is_active'] as boolean,
      createdAt: new Date(b['created_at'] as string),
      updatedAt: new Date(b['updated_at'] as string),
    };
  }

  private mapStudentBundle(sb: Record<string, unknown>): StudentBundle {
    return {
      id: sb['id'] as string,
      studentId: sb['student_id'] as string,
      bundleId: sb['bundle_id'] as string | undefined,
      name: sb['name'] as string,
      totalClasses: sb['total_classes'] as number,
      classesUsed: sb['classes_used'] as number,
      totalPrice: Number(sb['total_price']),
      pricePerClass: Number(sb['price_per_class']),
      isPaid: sb['is_paid'] as boolean,
      paymentDate: sb['payment_date'] ? new Date(sb['payment_date'] as string) : undefined,
      status: sb['status'] as StudentBundle['status'],
      notes: sb['notes'] as string | undefined,
      startsAt: new Date(sb['starts_at'] as string),
      expiresAt: sb['expires_at'] ? new Date(sb['expires_at'] as string) : undefined,
      createdAt: new Date(sb['created_at'] as string),
      updatedAt: new Date(sb['updated_at'] as string),
    };
  }

  private mapClassSession(s: Record<string, unknown>): ClassSession {
    return {
      id: s['id'] as string,
      studentId: s['student_id'] as string,
      studentBundleId: s['student_bundle_id'] as string | undefined,
      sessionDate: new Date(s['session_date'] as string),
      durationMinutes: s['duration_minutes'] as number,
      topic: s['topic'] as string | undefined,
      notes: s['notes'] as string | undefined,
      createdAt: new Date(s['created_at'] as string),
    };
  }
}
