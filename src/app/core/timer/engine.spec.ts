import type { Clock } from './clock';
import { TimerKind, defaultTimerConfig, type TimerConfig } from './config';
import { TimerCueKind } from './cues';
import { TimerEngine } from './engine';
import { TimerPhase, TimerState } from './state';

class FakeClock implements Clock {
  private current = 100_000;

  now(): number {
    return this.current;
  }

  advance(ms: number): void {
    this.current += ms;
  }
}

function makeEngine(kind: TimerKind, overrides: Partial<TimerConfig> = {}) {
  const config = { ...defaultTimerConfig(kind), ...overrides };
  const clock = new FakeClock();
  const engine = new TimerEngine(config as TimerConfig, clock);
  return { engine, clock };
}

function pump(engine: TimerEngine, clock: FakeClock, ms: number): void {
  clock.advance(ms);
  engine.refresh();
}

describe('TimerEngine', () => {
  it('rejects an invalid config', () => {
    const clock = new FakeClock();
    const bad = { ...defaultTimerConfig(TimerKind.Amrap), durationSeconds: 0 };
    expect(() => new TimerEngine(bad, clock)).toThrow(/Invalid timer config/);
  });

  it('starts in Ready with a sensible initial remaining value', () => {
    const { engine } = makeEngine(TimerKind.Countdown, { prepSeconds: 0, durationSeconds: 10 });
    expect(engine.state()).toBe(TimerState.Ready);
    expect(engine.phase()).toBe(TimerPhase.Work);
    expect(engine.round()).toBe(1);
    expect(engine.elapsedMs()).toBe(0);
    expect(engine.remainingMs()).toBe(10_000);
    expect(engine.lastCue()).toBeNull();
  });

  it('runs a prep countdown before starting', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 10,
      durationSeconds: 10,
    });
    engine.start();
    expect(engine.state()).toBe(TimerState.Prep);
    expect(engine.remainingMs()).toBe(10_000);

    pump(engine, clock, 3_000);
    expect(engine.state()).toBe(TimerState.Prep);
    expect(engine.remainingMs()).toBe(7_000);
  });

  it('emits tick cues during the last 3s of prep and a go cue at start', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 10,
      durationSeconds: 10,
    });
    engine.start();

    pump(engine, clock, 6_999);
    expect(engine.lastCue()).toBeNull();

    pump(engine, clock, 1);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Tick);

    pump(engine, clock, 1_000);
    pump(engine, clock, 1_000);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Tick);

    pump(engine, clock, 1_000);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Go);
    expect(engine.state()).toBe(TimerState.Running);
  });

  it('does not re-emit a cue when refreshing with the same clock time', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 0,
      durationSeconds: 10,
    });
    engine.start();
    pump(engine, clock, 1_000);
    const cue = engine.lastCue();
    engine.refresh();
    expect(engine.lastCue()).toBe(cue);
  });

  it('never pauses an AMRAP and only increments its round manually', () => {
    const { engine, clock } = makeEngine(TimerKind.Amrap, { prepSeconds: 0, durationSeconds: 60 });
    engine.start();
    pump(engine, clock, 1_000);
    expect(engine.state()).toBe(TimerState.Running);

    engine.pause();
    expect(engine.state()).toBe(TimerState.Running);

    engine.togglePause();
    expect(engine.state()).toBe(TimerState.Running);

    engine.incrementRound();
    engine.incrementRound();
    expect(engine.round()).toBe(3);
    engine.incrementRound();
    expect(engine.round()).toBe(4);
  });

  it('finishes an AMRAP when the duration elapses', () => {
    const { engine, clock } = makeEngine(TimerKind.Amrap, { prepSeconds: 0, durationSeconds: 60 });
    engine.start();
    pump(engine, clock, 59_999);
    expect(engine.remainingMs()).toBe(1);

    pump(engine, clock, 1);
    expect(engine.state()).toBe(TimerState.Finished);
    expect(engine.remainingMs()).toBe(0);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Finish);
  });

  it('freezes and resumes a countdown keeping wall-clock continuity', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 0,
      durationSeconds: 10,
    });
    engine.start();
    pump(engine, clock, 4_000);
    expect(engine.remainingMs()).toBe(6_000);

    engine.pause();
    expect(engine.state()).toBe(TimerState.Paused);
    clock.advance(2_000);
    engine.resume();
    expect(engine.state()).toBe(TimerState.Running);
    expect(engine.remainingMs()).toBe(6_000);

    pump(engine, clock, 1_000);
    expect(engine.remainingMs()).toBe(5_000);
  });

  it('allows pausing during prep', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 10,
      durationSeconds: 20,
    });
    engine.start();
    pump(engine, clock, 5_000);
    expect(engine.state()).toBe(TimerState.Prep);

    engine.pause();
    expect(engine.state()).toBe(TimerState.Paused);
    clock.advance(2_000);
    engine.resume();
    expect(engine.remainingMs()).toBe(5_000);

    pump(engine, clock, 5_000);
    expect(engine.state()).toBe(TimerState.Running);
    expect(engine.remainingMs()).toBe(20_000);
  });

  it('advances EMOM rounds and finishes after the last one', () => {
    const { engine, clock } = makeEngine(TimerKind.Emom, {
      prepSeconds: 0,
      intervalSeconds: 3,
      rounds: 3,
    });
    engine.start();
    expect(engine.round()).toBe(1);
    expect(engine.remainingMs()).toBe(3_000);

    pump(engine, clock, 2_999);
    expect(engine.round()).toBe(1);
    expect(engine.remainingMs()).toBe(1);

    pump(engine, clock, 1);
    expect(engine.round()).toBe(2);
    expect(engine.remainingMs()).toBe(3_000);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Go);

    pump(engine, clock, 3_000);
    expect(engine.round()).toBe(3);

    pump(engine, clock, 2_999);
    expect(engine.remainingMs()).toBe(1);

    pump(engine, clock, 1);
    expect(engine.state()).toBe(TimerState.Finished);
    expect(engine.remainingMs()).toBe(0);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Finish);
  });

  it('alternates work and rest for tabata and skips the trailing rest', () => {
    const { engine, clock } = makeEngine(TimerKind.Tabata, {
      prepSeconds: 0,
      workSeconds: 2,
      restSeconds: 1,
      rounds: 2,
    });
    engine.start();
    expect(engine.phase()).toBe(TimerPhase.Work);
    expect(engine.round()).toBe(1);

    pump(engine, clock, 2_000);
    expect(engine.phase()).toBe(TimerPhase.Rest);
    expect(engine.round()).toBe(1);
    expect(engine.remainingMs()).toBe(1_000);

    pump(engine, clock, 1_000);
    expect(engine.phase()).toBe(TimerPhase.Work);
    expect(engine.round()).toBe(2);

    pump(engine, clock, 2_000);
    expect(engine.state()).toBe(TimerState.Finished);
    expect(engine.remainingMs()).toBe(0);
  });

  it('counts up for for-time without a cap', () => {
    const { engine, clock } = makeEngine(TimerKind.ForTime, {
      prepSeconds: 0,
      timeCapSeconds: null,
    });
    engine.start();
    expect(engine.remainingMs()).toBe(-1);

    pump(engine, clock, 5_000);
    expect(engine.state()).toBe(TimerState.Running);
    expect(engine.elapsedMs()).toBe(5_000);
    expect(engine.remainingMs()).toBe(-1);
  });

  it('finishes a for-time when the time cap is reached', () => {
    const { engine, clock } = makeEngine(TimerKind.ForTime, { prepSeconds: 0, timeCapSeconds: 3 });
    engine.start();
    pump(engine, clock, 2_999);
    expect(engine.remainingMs()).toBe(1);

    pump(engine, clock, 1);
    expect(engine.state()).toBe(TimerState.Finished);
    expect(engine.elapsedMs()).toBe(3_000);
    expect(engine.lastCue()?.kind).toBe(TimerCueKind.Finish);
  });

  it('counts up forever for the stopwatch', () => {
    const { engine, clock } = makeEngine(TimerKind.Stopwatch, { prepSeconds: 0 });
    engine.start();
    expect(engine.remainingMs()).toBe(-1);

    pump(engine, clock, 90_000);
    expect(engine.state()).toBe(TimerState.Running);
    expect(engine.elapsedMs()).toBe(90_000);
  });

  it('suppresses cue bursts after a large clock jump', () => {
    const { engine, clock } = makeEngine(TimerKind.Countdown, {
      prepSeconds: 0,
      durationSeconds: 10,
    });
    engine.start();
    pump(engine, clock, 1_000);
    expect(engine.lastCue()).toBeNull();

    clock.advance(10_000);
    engine.refresh();
    expect(engine.state()).toBe(TimerState.Finished);
    expect(engine.remainingMs()).toBe(0);
    expect(engine.lastCue()).toBeNull();
  });

  it('resets back to Ready preserving the config', () => {
    const { engine, clock } = makeEngine(TimerKind.Tabata, {
      prepSeconds: 0,
      workSeconds: 2,
      restSeconds: 1,
      rounds: 4,
    });
    engine.start();
    pump(engine, clock, 2_000);
    expect(engine.phase()).toBe(TimerPhase.Rest);

    engine.reset();
    expect(engine.state()).toBe(TimerState.Ready);
    expect(engine.phase()).toBe(TimerPhase.Work);
    expect(engine.round()).toBe(1);
    expect(engine.elapsedMs()).toBe(0);
    expect(engine.remainingMs()).toBe(2_000);
    expect(engine.lastCue()).toBeNull();
  });

  it('exposes count-up kinds', () => {
    expect(makeEngine(TimerKind.Stopwatch).engine.isCountUp).toBe(true);
    expect(makeEngine(TimerKind.ForTime).engine.isCountUp).toBe(true);
    expect(makeEngine(TimerKind.Countdown).engine.isCountUp).toBe(false);
  });
});
