import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services';

/**
 * Espera a que el estado de autenticación se haya resuelto
 * (sesión restaurada desde localStorage) antes de evaluar el guard.
 */
function waitForAuthReady(authService: AuthService) {
  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
  );
}

/**
 * Guard que protege rutas que requieren autenticación.
 * Espera a que la sesión se restaure antes de decidir.
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

  if (!authService.isLoading()) {
    return authService.isAuthenticated() || router.createUrlTree(['/auth/login']);
  }

  return waitForAuthReady(authService).pipe(
    map(() => authService.isAuthenticated() || router.createUrlTree(['/auth/login'])),
  );
};

/**
 * Guard para rutas públicas que no deben ser accesibles por usuarios autenticados.
 * Espera a que la sesión se restaure antes de decidir.
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

  if (!authService.isLoading()) {
    return !authService.isAuthenticated() || router.createUrlTree(['/dashboard']);
  }

  return waitForAuthReady(authService).pipe(
    map(() => !authService.isAuthenticated() || router.createUrlTree(['/dashboard'])),
  );
};
