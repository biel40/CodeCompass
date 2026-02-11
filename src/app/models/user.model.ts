/**
 * Representa un usuario autenticado en el sistema.
 *
 * @property id - UUID único del usuario (de Supabase Auth)
 * @property email - Email del usuario (usado para login)
 * @property fullName - Nombre completo para mostrar
 * @property avatarUrl - URL de la imagen de perfil (opcional)
 * @property role - Rol que determina los permisos del usuario
 * @property createdAt - Fecha de creación de la cuenta
 * @property updatedAt - Fecha de última actualización del perfil
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roles disponibles en el sistema.
 * - `admin`: Acceso total al sistema
 * - `teacher`: Puede gestionar estudiantes y roadmaps
 * - `student`: Solo puede ver sus roadmaps asignados y progreso
 */
export type UserRole = 'admin' | 'teacher' | 'student';

/**
 * Estado de autenticación de la aplicación.
 * Gestionado por AuthService mediante signals.
 */
export interface AuthState {
  /** Usuario actual o null si no está autenticado */
  user: User | null;
  /** Indica si hay una sesión activa */
  isAuthenticated: boolean;
  /** Indica si se está verificando/cargando la sesión */
  isLoading: boolean;
  /** Mensaje de error de la última operación fallida */
  error: string | null;
}
