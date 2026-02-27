import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services';

/** Email del administrador autorizado */
const ADMIN_EMAIL = 'biel40aws@gmail.com';

/**
 * Espera a que el estado de autenticación se haya resuelto
 * antes de evaluar el guard.
 */
function waitForAuthReady(authService: AuthService) {
    return toObservable(authService.isLoading).pipe(
        filter((loading) => !loading),
        take(1),
    );
}

/**
 * Guard que protege rutas que requieren permisos de administrador.
 * Solo permite acceso al usuario con email específico.
 * Redirige al dashboard si el usuario no es administrador.
 *
 * @example
 * ```typescript
 * {
 *   path: 'earnings',
 *   canActivate: [adminGuard],
 *   loadComponent: () => import('./earnings.component')
 * }
 * ```
 */
export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAdmin = () => authService.user()?.email === ADMIN_EMAIL;

    if (!authService.isLoading()) {
        if (!authService.isAuthenticated()) {
            return router.createUrlTree(['/auth/login']);
        }
        return isAdmin() || router.createUrlTree(['/dashboard']);
    }

    return waitForAuthReady(authService).pipe(
        map(() => {
            if (!authService.isAuthenticated()) {
                return router.createUrlTree(['/auth/login']);
            }
            return isAdmin() || router.createUrlTree(['/dashboard']);
        }),
    );
};
