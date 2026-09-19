import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { SystemClock } from '@core/timer/clock';
import { TimerKind } from '@core/timer/config';
import { TimerEngine } from '@core/timer/engine';
import { TimerPhase, TimerState } from '@core/timer/state';
import { BrowserWakeLockService } from '@core/services/browser-wake-lock.service';
import { TimerFeedbackService } from '@core/services/feedback.service';
import { VisibilityService } from '@core/services/visibility.service';
import { formatClock } from '@shared/time-format';
import { timerLabel } from '@shared/timer-label';
import { TimerSessionService } from '../session/timer-session.service';

const ROUND_KINDS = new Set([
  TimerKind.Amrap,
  TimerKind.Emom,
  TimerKind.Tabata,
  TimerKind.Interval,
]);

function statusLabel(state: TimerState, phase: TimerPhase): string {
  switch (state) {
    case TimerState.Ready:
      return 'Listo';
    case TimerState.Prep:
      return 'Get ready';
    case TimerState.Running:
      return phase === TimerPhase.Rest ? 'Descanso' : 'Corriendo';
    case TimerState.Paused:
      return 'Pausa';
    case TimerState.Finished:
      return '¡Tiempo!';
  }
}

@Component({
  selector: 'app-timer-screen',
  styleUrl: './timer-screen.css',
  templateUrl: './timer-screen.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerScreenComponent implements OnDestroy {
  readonly TimerState = TimerState;

  readonly engine: TimerEngine;
  private timerId = 0;

  readonly timeText = computed(() => {
    const state = this.engine.state();
    if (state === TimerState.Prep) {
      return formatClock(this.engine.remainingMs(), true);
    }
    return this.engine.isCountUp
      ? formatClock(this.engine.elapsedMs())
      : formatClock(this.engine.remainingMs(), true);
  });

  readonly statusText = computed(() => statusLabel(this.engine.state(), this.engine.phase()));

  readonly headerText = computed(() => timerLabel(this.engine.config));

  readonly isAmrap = computed(() => this.engine.config.kind === TimerKind.Amrap);

  readonly showRound = computed(() => ROUND_KINDS.has(this.engine.config.kind));

  private readonly router = inject(Router);
  private readonly session = inject(TimerSessionService);
  private readonly feedback = inject(TimerFeedbackService);
  private readonly wakeLock = inject(BrowserWakeLockService);
  private readonly visibility = inject(VisibilityService);

  constructor() {
    const config = this.session.config();
    if (config === null) {
      this.engine = new TimerEngine(
        {
          kind: TimerKind.Amrap,
          prepSeconds: 10,
          durationSeconds: 20 * 60,
        },
        new SystemClock(),
      );
      void this.router.navigate(['/']);
      return;
    }
    this.engine = new TimerEngine(config, new SystemClock());
    this.timerId = setInterval(() => this.onClockTick(), 100);
    this.engine.refresh();
    effect(() => {
      const running = this.engine.state() === TimerState.Running && this.visibility.isVisible();
      if (running) {
        void this.wakeLock.acquire();
      } else {
        this.wakeLock.release();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerId !== 0) {
      clearInterval(this.timerId);
    }
    this.wakeLock.release();
  }

  private onClockTick(): void {
    this.engine.refresh();
    const cue = this.engine.lastCue();
    if (cue !== null) {
      this.feedback.notify(cue);
    }
  }

  onStart(): void {
    this.feedback.unlockOnGesture();
    this.engine.start();
    this.onClockTick();
  }

  onPause(): void {
    this.engine.pause();
  }

  onBackHome(): void {
    void this.router.navigate(['/']);
  }

  onResume(): void {
    this.feedback.unlockOnGesture();
    this.engine.resume();
    this.onClockTick();
  }

  onReset(): void {
    this.engine.reset();
    this.onClockTick();
  }

  onIncrementRound(): void {
    this.engine.incrementRound();
    this.onClockTick();
  }
}
