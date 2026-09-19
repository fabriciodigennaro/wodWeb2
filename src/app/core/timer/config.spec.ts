import { TimerKind, defaultTimerConfig, validateTimerConfig } from './config';

describe('TimerConfig', () => {
  it.each(Object.values(TimerKind))('provides a valid default for %s', (kind) => {
    const config = defaultTimerConfig(kind);
    expect(config.kind).toBe(kind);
    expect(validateTimerConfig(config)).toEqual([]);
  });

  it('disables prep for the stopwatch by default', () => {
    expect(defaultTimerConfig(TimerKind.Stopwatch).prepSeconds).toBe(0);
  });

  it('defaults to a 10s prep for timed kinds', () => {
    expect(defaultTimerConfig(TimerKind.Amrap).prepSeconds).toBe(10);
    expect(defaultTimerConfig(TimerKind.Tabata).prepSeconds).toBe(10);
    expect(defaultTimerConfig(TimerKind.ForTime).prepSeconds).toBe(10);
  });

  it('flags non-positive amrap durations', () => {
    const bad = { ...defaultTimerConfig(TimerKind.Amrap), durationSeconds: 0 };
    expect(validateTimerConfig(bad)).toContain('durationSeconds must be positive');
  });

  it('flags fractional rounds', () => {
    const bad = { ...defaultTimerConfig(TimerKind.Emom), rounds: 2.5 };
    expect(validateTimerConfig(bad)).toContain('rounds must be a positive integer');
  });

  it('accepts a null time cap for for-time', () => {
    expect(validateTimerConfig(defaultTimerConfig(TimerKind.ForTime))).toEqual([]);
  });
});
