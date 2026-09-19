import { TimerKind } from '@core/timer/config';
import { timerLabel } from './timer-label';

describe('timerLabel', () => {
  it('labels an AMRAP with its duration', () => {
    expect(timerLabel({ kind: TimerKind.Amrap, prepSeconds: 10, durationSeconds: 1200 })).toBe(
      'AMRAP · 20:00',
    );
  });

  it('labels an EMOM with rounds and interval', () => {
    expect(
      timerLabel({ kind: TimerKind.Emom, prepSeconds: 10, intervalSeconds: 60, rounds: 10 }),
    ).toBe('EMOM · 10×60s');
  });

  it('labels a cap-less For Time without a cap', () => {
    expect(timerLabel({ kind: TimerKind.ForTime, prepSeconds: 10, timeCapSeconds: null })).toBe(
      'For Time',
    );
  });

  it('labels a capped For Time with the cap', () => {
    expect(timerLabel({ kind: TimerKind.ForTime, prepSeconds: 10, timeCapSeconds: 900 })).toBe(
      'For Time · Cap 15:00',
    );
  });

  it('labels a Tabata with work/rest rounds', () => {
    expect(
      timerLabel({
        kind: TimerKind.Tabata,
        prepSeconds: 10,
        workSeconds: 20,
        restSeconds: 10,
        rounds: 8,
      }),
    ).toBe('Tabata · 8×(20/10)');
  });

  it('labels an Interval with work/rest rounds', () => {
    expect(
      timerLabel({
        kind: TimerKind.Interval,
        prepSeconds: 10,
        workSeconds: 60,
        restSeconds: 30,
        rounds: 8,
      }),
    ).toBe('Interval · 8×(60/30)');
  });

  it('labels a Countdown with its duration', () => {
    expect(timerLabel({ kind: TimerKind.Countdown, prepSeconds: 10, durationSeconds: 600 })).toBe(
      'Countdown · 10:00',
    );
  });

  it('labels a Stopwatch', () => {
    expect(timerLabel({ kind: TimerKind.Stopwatch, prepSeconds: 0 })).toBe('Cronómetro');
  });
});
