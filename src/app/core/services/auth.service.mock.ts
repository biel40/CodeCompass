import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthState, User } from '../../models';

const MOCK_USER: User = {
  id: 'mock-user-001',
  email: 'demo@codecompass.dev',
  fullName: 'Demo',
  avatarUrl: undefined,
  role: 'teacher',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
};

const AUTH_STORAGE_KEY = 'codecompass_auth_session';

interface StoredSession {
  user: User;
  isAuthenticated: boolean;
}

/**
 * Mock implementation of AuthService for local development without Supabase.
 * Activated when `environment.useMocks` is true.
 *
 * Accepts any email/password and always returns the MOCK_USER.
 * Persists session in localStorage to survive page refreshes.
 */
@Injectable()
export class MockAuthService {
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
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session: StoredSession = JSON.parse(stored);
        // Restore dates from JSON
        session.user.createdAt = new Date(session.user.createdAt);
        session.user.updatedAt = new Date(session.user.updatedAt);
        
        this.state.set({
          user: session.user,
          isAuthenticated: session.isAuthenticated,
          isLoading: false,
          error: null,
        });
        return;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    
    this.state.update((s) => ({ ...s, isLoading: false }));
  }

  private saveSession(user: User): void {
    const session: StoredSession = {
      user,
      isAuthenticated: true,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async signInWithEmail(_email: string, _password: string): Promise<{ success: boolean; error?: string }> {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    // Simulate a small network delay
    await this.delay(500);

    this.state.set({
      user: MOCK_USER,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    this.saveSession(MOCK_USER);

    return { success: true };
  }

  async signUpWithEmail(
    _email: string,
    _password: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    await this.delay(500);

    const newUser = { ...MOCK_USER, fullName };

    this.state.set({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    this.saveSession(newUser);

    return { success: true };
  }

  async signOut(): Promise<void> {
    this.clearSession();
    this.state.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(_email: string): Promise<{ success: boolean; error?: string }> {
    await this.delay(300);
    return { success: true };
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
