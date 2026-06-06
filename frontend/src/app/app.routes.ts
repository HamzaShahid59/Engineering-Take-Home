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
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'select-office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/select-office/select-office').then(m => m.SelectOfficeComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'simulations/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/simulations/simulation-detail/simulation-detail').then(m => m.SimulationDetailComponent),
  },
  {
    path: 'simulations/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/simulator/edit/edit-simulator').then(m => m.EditSimulatorComponent),
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
