import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AuthState, User } from '../../models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
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
    if (event === 'SIGNED_IN' && session?.user) {
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
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error loading profile',
      }));
    }
  }

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

    if (data.user) {
      await this.createUserProfile(data.user.id, fullName, email);
    }

    return { success: true };
  }

  private async createUserProfile(userId: string, fullName: string, email: string): Promise<void> {
    await this.supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      email,
      role: 'student',
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }
}
