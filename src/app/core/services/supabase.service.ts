import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Servicio singleton que encapsula el cliente de Supabase.
 * Proporciona acceso tipado a autenticación, base de datos y storage.
 *
 * @description Este servicio debe ser inyectado a través de la configuración
 * de providers en app.config.ts, permitiendo sustituirlo por un mock en desarrollo.
 *
 * @example
 * ```typescript
 * private readonly supabase = inject(SupabaseService);
 *
 * // Consultar datos
 * const { data } = await this.supabase.from('students').select('*');
 *
 * // Autenticación
 * await this.supabase.auth.signInWithPassword({ email, password });
 * ```
 */
@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  /**
   * Acceso directo al cliente Supabase completo.
   * Usar solo cuando se necesiten funcionalidades no expuestas por otros métodos.
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Acceso al módulo de autenticación de Supabase.
   * Incluye métodos para login, registro, logout y gestión de sesiones.
   */
  get auth() {
    return this.supabase.auth;
  }

  /**
   * Crea un query builder para la tabla especificada.
   * @param table - Nombre de la tabla en la base de datos
   * @returns Query builder de Supabase para operaciones CRUD
   */
  from(table: string) {
    return this.supabase.from(table);
  }

  /**
   * Acceso al bucket de storage especificado.
   * @param bucket - Nombre del bucket de almacenamiento
   * @returns Cliente de storage para subir/descargar archivos
   */
  storage(bucket: string) {
    return this.supabase.storage.from(bucket);
  }
}
