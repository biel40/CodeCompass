import { Injectable } from '@angular/core';

/**
 * Mock implementation of SupabaseService for local development without a Supabase instance.
 * Activated when `environment.useMocks` is true.
 */
@Injectable()
export class MockSupabaseService {
  get client(): unknown {
    return this.createMockProxy('client');
  }

  get auth(): unknown {
    return {
      onAuthStateChange: (_callback: unknown) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: (_credentials: unknown) =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: (_credentials: unknown) =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: (_email: unknown) => Promise.resolve({ error: null }),
    };
  }

  from(_table: string) {
    return this.createQueryBuilder();
  }

  storage(_bucket: string) {
    return {
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ data: null, error: null }),
    };
  }

  private createQueryBuilder(): Record<string, unknown> {
    const builder: Record<string, (...args: unknown[]) => unknown> = {};
    const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'in', 'order', 'limit', 'range', 'single', 'maybeSingle'];

    for (const method of chainMethods) {
      builder[method] = (..._args: unknown[]) => {
        if (method === 'single' || method === 'maybeSingle') {
          return Promise.resolve({ data: null, error: null });
        }
        return builder;
      };
    }

    // Make the builder itself thenable so `await supabase.from(...).select(...)` resolves
    (builder as Record<string, unknown>)['then'] = (resolve: (value: unknown) => void) => {
      resolve({ data: [], error: null });
    };

    return builder;
  }

  private createMockProxy(name: string): unknown {
    console.warn(`[MockSupabaseService] Accediendo a "${name}" — devolviendo mock.`);
    return {};
  }
}
