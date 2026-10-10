import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { type TimerConfig, TimerKind } from '@core/timer/config';
import { RecentWorkoutsService } from '@core/services/recent-workouts.service';
import { SettingsService } from '@core/services/settings.service';
import { timerLabel } from '@shared/timer-label';
import { TimerSessionService } from '../timers/session/timer-session.service';
import { SettingsModalComponent } from '@shared/settings-modal';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SettingsModalComponent],
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
  readonly settings = inject(SettingsService);
  private readonly session = inject(TimerSessionService);
  private readonly router = inject(Router);
  private readonly recentsService = inject(RecentWorkoutsService);

  readonly swipingIndex = signal<number | null>(null);
  readonly swipeOffset = signal(0);

  onOpenRecent(config: TimerConfig): void {
    this.session.config.set(config);
    void this.router.navigate(['/timers/screen']);
  }

  onSwipeStart(index: number): void {
    this.swipingIndex.set(index);
  }

  onSwipeMove(event: TouchEvent): void {
    const index = this.swipingIndex();
    if (index === null) return;
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    const startX = target.dataset['swipeStartX'];
    if (startX === undefined) {
      target.dataset['swipeStartX'] = touch.clientX.toString();
      return;
    }
    const deltaX = touch.clientX - parseInt(startX, 10);
    if (deltaX < 0) {
      this.swipeOffset.set(Math.max(deltaX, -100));
    }
  }

  onSwipeEnd(index: number): void {
    const offset = this.swipeOffset();
    this.swipeOffset.set(0);
    this.swipingIndex.set(null);
    if (offset < -60) {
      const config = this.recents()[index];
      if (config) {
        void this.recentsService.remove(config);
      }
    }
  }

  onClickRecent(index: number): void {
    if (this.swipeOffset() !== 0) {
      this.swipeOffset.set(0);
      this.swipingIndex.set(null);
      return;
    }
    const config = this.recents()[index];
    if (config) {
      this.onOpenRecent(config);
    }
  }
}
