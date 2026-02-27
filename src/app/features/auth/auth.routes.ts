import { Routes } from '@angular/router';
import { publicGuard } from '../../core';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuard],
    loadComponent: () => import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    // Sin publicGuard: Supabase redirige aquí con un token de recovery
    // que autentica al usuario temporalmente. Si hubiera publicGuard,
    // el usuario sería redirigido al dashboard antes de cambiar la contraseña.
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
