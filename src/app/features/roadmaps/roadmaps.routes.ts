import { Routes } from '@angular/router';

export const ROADMAPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./roadmaps-list/roadmaps-list.component').then((m) => m.RoadmapsListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./roadmap-editor/roadmap-editor.component').then((m) => m.RoadmapEditorComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./roadmap-view/roadmap-view.component').then((m) => m.RoadmapViewComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./roadmap-editor/roadmap-editor.component').then((m) => m.RoadmapEditorComponent),
  },
];
