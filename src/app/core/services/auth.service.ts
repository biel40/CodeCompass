import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthState, User } from '../../models';
import { SupabaseService } from './supabase.service';

/**
 * Servicio de autenticación que gestiona el estado del usuario.
 * Utiliza signals para un estado reactivo y eficiente.
 *
 * @description Maneja inicio de sesión, registro, cierre de sesión y
 * recuperación de contraseña a través de Supabase Auth.
 *
 * @security
 * - Las credenciales nunca se almacenan en el cliente
 * - Los tokens se gestionan automáticamente por Supabase
 * - El estado se limpia completamente al cerrar sesión
 *
 * @example
 * ```typescript
 * private readonly auth = inject(AuthService);
 *
 * // Verificar autenticación
 * if (this.auth.isAuthenticated()) { ... }
 *
 * // Obtener usuario actual
 * const user = this.auth.user();
 * ```
 */
@Injectable()
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  private readonly state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.handleAuthChange(event, session);
    });

    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (session?.user) {
      await this.loadUserProfile(session.user);
    } else {
      this.state.update((s) => ({ ...s, isLoading: false }));
    }
  }

  private async handleAuthChange(event: AuthChangeEvent, session: Session | null): Promise<void> {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
      await this.loadUserProfile(session.user);
    } else if (event === 'SIGNED_OUT') {
      this.state.set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }

  private async loadUserProfile(supabaseUser: SupabaseUser): Promise<void> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        fullName: profile?.full_name ?? '',
        avatarUrl: profile?.avatar_url,
        role: profile?.role ?? 'student',
        createdAt: new Date(profile?.created_at),
        updatedAt: new Date(profile?.updated_at),
      };

      this.state.set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Solo loguear en desarrollo para evitar exponer detalles en producción
      if (!environment.production) {
        console.error('Error al cargar perfil de usuario:', error);
      }
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar perfil',
      }));
    }
  }

  /**
   * Inicia sesión con email y contraseña.
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Resultado de la operación con mensaje de error si falla
   */
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Registra un nuevo usuario con email y contraseña.
   * Crea automáticamente un perfil asociado en la tabla profiles.
   *
   * @param email - Email del nuevo usuario
   * @param password - Contraseña (mínimo 6 caracteres)
   * @param fullName - Nombre completo del usuario
   * @returns Resultado de la operación
   *
   * @security El usuario recibirá un email de confirmación antes de poder acceder
   */
  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        error: error.message,
      }));
      return { success: false, error: error.message };
    }

    // El perfil se crea automáticamente mediante un trigger en Supabase
    // cuando se inserta un nuevo usuario en auth.users

    this.state.update((s) => ({ ...s, isLoading: false }));
    return { success: true };
  }

  /**
   * Cierra la sesión del usuario actual.
   * Limpia el estado local y redirige al login.
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Envía un email de recuperación de contraseña.
   * @param email - Email del usuario que quiere recuperar su contraseña
   * @returns Resultado de la operación
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Actualiza la contraseña del usuario autenticado.
   * Se utiliza después de que el usuario hace clic en el enlace de recuperación.
   * @param newPassword - Nueva contraseña (mínimo 6 caracteres)
   * @returns Resultado de la operación
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /** Limpia cualquier mensaje de error del estado. */
  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }
}
