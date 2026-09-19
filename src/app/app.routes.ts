import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'timers/setup/:kind',
    loadComponent: () =>
      import('./features/timers/setup/timer-setup').then((m) => m.TimerSetupComponent),
  },
  {
    path: 'timers/screen',
    loadComponent: () =>
      import('./features/timers/screen/timer-screen').then((m) => m.TimerScreenComponent),
  },
  { path: '**', redirectTo: '' },
];
