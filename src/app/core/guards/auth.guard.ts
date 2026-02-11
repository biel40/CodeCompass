import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';

/**
 * Guard que protege rutas que requieren autenticación.
 * Redirige al login si el usuario no está autenticado.
 *
 * @example
 * ```typescript
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   loadComponent: () => import('./dashboard.component')
 * }
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guard para rutas públicas que no deben ser accesibles por usuarios autenticados.
 * Redirige al dashboard si el usuario ya está autenticado.
 *
 * @example
 * ```typescript
 * {
 *   path: 'auth/login',
 *   canActivate: [publicGuard],
 *   loadComponent: () => import('./login.component')
 * }
 * ```
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
