import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'simulator',
    pathMatch: 'full',
  },
  {
    path: 'simulator',
    loadComponent: () =>
      import('./features/simulator/simulator').then(m => m.SimulatorComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/applications/applications').then(m => m.ApplicationsComponent),
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documents/documents').then(m => m.DocumentsComponent),
  },
  {
    path: '**',
    redirectTo: 'simulator',
  },
];
