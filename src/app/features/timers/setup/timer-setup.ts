import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TimerKind,
  defaultTimerConfig,
  isValidTimerConfig,
  type AmrapConfig,
  type EmomConfig,
  type ForTimeConfig,
  type IntervalConfig,
  type TabataConfig,
  type TimerConfig,
} from '@core/timer/config';
import { TimerSessionService } from '../session/timer-session.service';
import { RecentWorkoutsService } from '@core/services/recent-workouts.service';

@Component({
  selector: 'app-timer-setup',
  styleUrl: './timer-setup.css',
  templateUrl: './timer-setup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerSetupComponent {
  readonly TimerKind = TimerKind;

  readonly kind = signal<TimerKind>(TimerKind.Amrap);
  readonly amrapMinutes = signal(20);
  readonly amrapSeconds = signal(0);
  readonly emomIntervalSeconds = signal(60);
  readonly emomRounds = signal(10);
  readonly fortimeCapMinutes = signal(0);
  readonly fortimeCapSeconds = signal(0);
  readonly tabataWorkSeconds = signal(20);
  readonly tabataRestSeconds = signal(10);
  readonly tabataRounds = signal(8);
  readonly intervalWorkSeconds = signal(60);
  readonly intervalRestSeconds = signal(30);
  readonly intervalRounds = signal(8);
  readonly prepSeconds = signal(10);

  readonly amrapInvalid = computed(() => this.amrapMinutes() * 60 + this.amrapSeconds() <= 0);

  readonly emomInvalid = computed(
    () =>
      this.emomIntervalSeconds() < 1 ||
      !Number.isInteger(this.emomRounds()) ||
      this.emomRounds() < 1,
  );

  readonly fortimeInvalid = computed(
    () =>
      this.fortimeCapMinutes() < 0 || this.fortimeCapSeconds() < 0 || this.fortimeCapSeconds() > 59,
  );

  readonly tabataInvalid = computed(
    () =>
      this.tabataWorkSeconds() < 1 ||
      this.tabataRestSeconds() < 1 ||
      !Number.isInteger(this.tabataRounds()) ||
      this.tabataRounds() < 1,
  );

  readonly intervalInvalid = computed(
    () =>
      this.intervalWorkSeconds() < 1 ||
      this.intervalRestSeconds() < 1 ||
      !Number.isInteger(this.intervalRounds()) ||
      this.intervalRounds() < 1,
  );

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(TimerSessionService);
  private readonly recents = inject(RecentWorkoutsService);

  constructor() {
    const param = this.route.snapshot.paramMap.get('kind');
    const match = Object.values(TimerKind).find((value) => value === param);
    if (match !== undefined) {
      this.kind.set(match);
    }
    const defaults = defaultTimerConfig(this.kind());
    if (defaults.kind === TimerKind.Amrap) {
      this.amrapMinutes.set(Math.floor(defaults.durationSeconds / 60));
      this.amrapSeconds.set(defaults.durationSeconds % 60);
      this.prepSeconds.set(defaults.prepSeconds);
    } else if (defaults.kind === TimerKind.Emom) {
      this.emomIntervalSeconds.set(defaults.intervalSeconds);
      this.emomRounds.set(defaults.rounds);
      this.prepSeconds.set(defaults.prepSeconds);
    } else if (defaults.kind === TimerKind.ForTime) {
      this.fortimeCapMinutes.set(0);
      this.fortimeCapSeconds.set(0);
      this.prepSeconds.set(defaults.prepSeconds);
    } else if (defaults.kind === TimerKind.Tabata) {
      this.tabataWorkSeconds.set(defaults.workSeconds);
      this.tabataRestSeconds.set(defaults.restSeconds);
      this.tabataRounds.set(defaults.rounds);
      this.prepSeconds.set(defaults.prepSeconds);
    } else if (defaults.kind === TimerKind.Interval) {
      this.intervalWorkSeconds.set(defaults.workSeconds);
      this.intervalRestSeconds.set(defaults.restSeconds);
      this.intervalRounds.set(defaults.rounds);
      this.prepSeconds.set(defaults.prepSeconds);
    }
  }

  onBackHome(): void {
    void this.router.navigate(['/']);
  }

  private startTimer(config: TimerConfig): void {
    this.session.config.set(config);
    void this.recents.remember(config);
    void this.router.navigate(['/timers/screen']);
  }

  onStartAmrap(): void {
    const config: TimerConfig = {
      kind: TimerKind.Amrap,
      prepSeconds: this.prepSeconds(),
      durationSeconds: this.amrapMinutes() * 60 + this.amrapSeconds(),
    } satisfies AmrapConfig;
    if (!isValidTimerConfig(config)) {
      return;
    }
    this.startTimer(config);
  }

  onStartEmom(): void {
    const config: TimerConfig = {
      kind: TimerKind.Emom,
      prepSeconds: this.prepSeconds(),
      intervalSeconds: this.emomIntervalSeconds(),
      rounds: this.emomRounds(),
    } satisfies EmomConfig;
    if (!isValidTimerConfig(config)) {
      return;
    }
    this.startTimer(config);
  }

  onStartFortime(): void {
    const capTotal = this.fortimeCapMinutes() * 60 + this.fortimeCapSeconds();
    const config: TimerConfig = {
      kind: TimerKind.ForTime,
      prepSeconds: this.prepSeconds(),
      timeCapSeconds: capTotal > 0 ? capTotal : null,
    } satisfies ForTimeConfig;
    if (!isValidTimerConfig(config)) {
      return;
    }
    this.startTimer(config);
  }

  onStartTabata(): void {
    const config: TimerConfig = {
      kind: TimerKind.Tabata,
      prepSeconds: this.prepSeconds(),
      workSeconds: this.tabataWorkSeconds(),
      restSeconds: this.tabataRestSeconds(),
      rounds: this.tabataRounds(),
    } satisfies TabataConfig;
    if (!isValidTimerConfig(config)) {
      return;
    }
    this.startTimer(config);
  }

  onStartInterval(): void {
    const config: TimerConfig = {
      kind: TimerKind.Interval,
      prepSeconds: this.prepSeconds(),
      workSeconds: this.intervalWorkSeconds(),
      restSeconds: this.intervalRestSeconds(),
      rounds: this.intervalRounds(),
    } satisfies IntervalConfig;
    if (!isValidTimerConfig(config)) {
      return;
    }
    this.startTimer(config);
  }

  onMinutesInput(event: Event): void {
    this.amrapMinutes.set(this.readNumber(event));
  }

  onSecondsInput(event: Event): void {
    this.amrapSeconds.set(this.readNumber(event));
  }

  onEmomIntervalInput(event: Event): void {
    this.emomIntervalSeconds.set(this.readNumber(event));
  }

  onEmomRoundsInput(event: Event): void {
    this.emomRounds.set(this.readNumber(event));
  }

  onFortimeCapMinutesInput(event: Event): void {
    this.fortimeCapMinutes.set(this.readNumber(event));
  }

  onFortimeCapSecondsInput(event: Event): void {
    this.fortimeCapSeconds.set(this.readNumber(event));
  }

  onTabataWorkInput(event: Event): void {
    this.tabataWorkSeconds.set(this.readNumber(event));
  }

  onTabataRestInput(event: Event): void {
    this.tabataRestSeconds.set(this.readNumber(event));
  }

  onTabataRoundsInput(event: Event): void {
    this.tabataRounds.set(this.readNumber(event));
  }

  onIntervalWorkInput(event: Event): void {
    this.intervalWorkSeconds.set(this.readNumber(event));
  }

  onIntervalRestInput(event: Event): void {
    this.intervalRestSeconds.set(this.readNumber(event));
  }

  onIntervalRoundsInput(event: Event): void {
    this.intervalRounds.set(this.readNumber(event));
  }

  onPrepInput(event: Event): void {
    this.prepSeconds.set(this.readNumber(event));
  }

  private readNumber(event: Event): number {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    return Number.isFinite(value) ? value : 0;
  }
}
