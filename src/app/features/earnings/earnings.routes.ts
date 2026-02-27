import { Routes } from '@angular/router';

export const EARNINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./earnings-list/earnings-list.component').then((m) => m.EarningsListComponent),
  },
];
