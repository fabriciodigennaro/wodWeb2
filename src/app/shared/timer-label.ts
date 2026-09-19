import { formatClock } from './time-format';
import type { TimerConfig } from '@core/timer/config';
import { TimerKind } from '@core/timer/config';

export function timerLabel(config: TimerConfig): string {
  switch (config.kind) {
    case TimerKind.Amrap:
      return `AMRAP · ${formatClock(config.durationSeconds * 1000)}`;
    case TimerKind.Emom:
      return `EMOM · ${config.rounds}×${config.intervalSeconds}s`;
    case TimerKind.ForTime:
      return config.timeCapSeconds === null
        ? 'For Time'
        : `For Time · Cap ${formatClock(config.timeCapSeconds * 1000)}`;
    case TimerKind.Tabata:
      return `Tabata · ${config.rounds}×(${config.workSeconds}/${config.restSeconds})`;
    case TimerKind.Interval:
      return `Interval · ${config.rounds}×(${config.workSeconds}/${config.restSeconds})`;
    case TimerKind.Countdown:
      return `Countdown · ${formatClock(config.durationSeconds * 1000)}`;
    case TimerKind.Stopwatch:
      return 'Cronómetro';
  }
}
