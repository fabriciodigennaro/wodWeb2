import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { type TimerConfig, TimerKind } from '@core/timer/config';
import { RecentWorkoutsService } from '@core/services/recent-workouts.service';
import { timerLabel } from '@shared/timer-label';
import { TimerSessionService } from '../timers/session/timer-session.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  styleUrl: './home.css',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly timers: readonly { kind: TimerKind; label: string; description: string }[] = [
    { kind: TimerKind.Amrap, label: 'AMRAP', description: 'Máximas rondas en el tiempo' },
    { kind: TimerKind.Emom, label: 'EMOM', description: 'Cada minuto sobre el minuto' },
    { kind: TimerKind.ForTime, label: 'For Time', description: 'Cuenta en subida' },
    { kind: TimerKind.Tabata, label: 'Tabata', description: 'Trabajo / descanso' },
    { kind: TimerKind.Interval, label: 'Interval', description: 'Trabajo / descanso' },
    { kind: TimerKind.Countdown, label: 'Countdown', description: 'Cuenta atrás' },
    { kind: TimerKind.Stopwatch, label: 'Cronómetro', description: 'Cuenta libre' },
  ];

  readonly recents = inject(RecentWorkoutsService).recents;
  readonly timerLabel = timerLabel;
  private readonly session = inject(TimerSessionService);
  private readonly router = inject(Router);

  onOpenRecent(config: TimerConfig): void {
    this.session.config.set(config);
    void this.router.navigate(['/timers/screen']);
  }
}
