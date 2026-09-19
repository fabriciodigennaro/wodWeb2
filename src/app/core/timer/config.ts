export enum TimerKind {
  Amrap = 'amrap',
  Emom = 'emom',
  ForTime = 'for-time',
  Tabata = 'tabata',
  Interval = 'interval',
  Countdown = 'countdown',
  Stopwatch = 'stopwatch',
}

interface BaseTimingConfig {
  readonly prepSeconds: number;
}

export interface AmrapConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Amrap;
  readonly durationSeconds: number;
}

export interface EmomConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Emom;
  readonly intervalSeconds: number;
  readonly rounds: number;
}

export interface ForTimeConfig extends BaseTimingConfig {
  readonly kind: TimerKind.ForTime;
  readonly timeCapSeconds: number | null;
}

export interface TabataConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Tabata;
  readonly workSeconds: number;
  readonly restSeconds: number;
  readonly rounds: number;
}

export interface IntervalConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Interval;
  readonly workSeconds: number;
  readonly restSeconds: number;
  readonly rounds: number;
}

export interface CountdownConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Countdown;
  readonly durationSeconds: number;
}

export interface StopwatchConfig extends BaseTimingConfig {
  readonly kind: TimerKind.Stopwatch;
}

export type TimerConfig =
  | AmrapConfig
  | EmomConfig
  | ForTimeConfig
  | TabataConfig
  | IntervalConfig
  | CountdownConfig
  | StopwatchConfig;

export function defaultTimerConfig(kind: TimerKind): TimerConfig {
  switch (kind) {
    case TimerKind.Amrap:
      return { kind, prepSeconds: 10, durationSeconds: 20 * 60 };
    case TimerKind.Emom:
      return { kind, prepSeconds: 10, intervalSeconds: 60, rounds: 10 };
    case TimerKind.ForTime:
      return { kind, prepSeconds: 10, timeCapSeconds: null };
    case TimerKind.Tabata:
      return { kind, prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 8 };
    case TimerKind.Interval:
      return { kind, prepSeconds: 10, workSeconds: 60, restSeconds: 30, rounds: 8 };
    case TimerKind.Countdown:
      return { kind, prepSeconds: 10, durationSeconds: 10 * 60 };
    case TimerKind.Stopwatch:
      return { kind, prepSeconds: 0 };
  }
}

export function validateTimerConfig(config: TimerConfig): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(config.prepSeconds) || config.prepSeconds < 0) {
    errors.push('prepSeconds must be a non-negative integer');
  }
  switch (config.kind) {
    case TimerKind.Amrap:
    case TimerKind.Countdown:
      if (config.durationSeconds <= 0) errors.push('durationSeconds must be positive');
      break;
    case TimerKind.Emom:
      if (config.intervalSeconds <= 0) errors.push('intervalSeconds must be positive');
      if (!Number.isInteger(config.rounds) || config.rounds < 1)
        errors.push('rounds must be a positive integer');
      break;
    case TimerKind.ForTime:
      if (config.timeCapSeconds !== null && config.timeCapSeconds <= 0) {
        errors.push('timeCapSeconds must be null or positive');
      }
      break;
    case TimerKind.Tabata:
    case TimerKind.Interval:
      if (config.workSeconds <= 0) errors.push('workSeconds must be positive');
      if (config.restSeconds <= 0) errors.push('restSeconds must be positive');
      if (!Number.isInteger(config.rounds) || config.rounds < 1)
        errors.push('rounds must be a positive integer');
      break;
    case TimerKind.Stopwatch:
      break;
    default:
      errors.push('unknown timer kind');
  }
  return errors;
}

export function isValidTimerConfig(config: TimerConfig): boolean {
  return validateTimerConfig(config).length === 0;
}
