import { signal } from '@angular/core';
import type { Clock } from './clock';
import { TimerKind, isValidTimerConfig, type TimerConfig } from './config';
import { TimerCueKind, type TimerCue } from './cues';
import { TimerPhase, TimerState } from './state';

const INFINITE_MS = Number.POSITIVE_INFINITY;
const PREP_WARN_WINDOW_MS = 3000;
const MAX_CUE_JUMP_MS = 4000;

interface Segment {
  readonly phase: TimerPhase;
  readonly durationMs: number;
}

interface ScheduledCue {
  readonly elapsedMs: number;
  readonly kind: TimerCueKind;
}

function buildSegments(config: TimerConfig): Segment[] {
  switch (config.kind) {
    case TimerKind.Amrap:
      return [{ phase: TimerPhase.Work, durationMs: config.durationSeconds * 1000 }];
    case TimerKind.Emom:
      return Array.from({ length: config.rounds }, () => ({
        phase: TimerPhase.Work,
        durationMs: config.intervalSeconds * 1000,
      }));
    case TimerKind.ForTime:
      return [
        {
          phase: TimerPhase.Work,
          durationMs: config.timeCapSeconds === null ? INFINITE_MS : config.timeCapSeconds * 1000,
        },
      ];
    case TimerKind.Tabata:
    case TimerKind.Interval: {
      const segments: Segment[] = [];
      for (let round = 0; round < config.rounds; round++) {
        segments.push({ phase: TimerPhase.Work, durationMs: config.workSeconds * 1000 });
        if (round < config.rounds - 1) {
          segments.push({ phase: TimerPhase.Rest, durationMs: config.restSeconds * 1000 });
        }
      }
      return segments;
    }
    case TimerKind.Countdown:
      return [{ phase: TimerPhase.Work, durationMs: config.durationSeconds * 1000 }];
    case TimerKind.Stopwatch:
      return [{ phase: TimerPhase.Work, durationMs: INFINITE_MS }];
  }
}

function buildSchedule(
  prepMs: number,
  totalMs: number,
  segments: readonly Segment[],
): ScheduledCue[] {
  const cues: ScheduledCue[] = [];
  if (prepMs > 0) {
    cues.push(
      { elapsedMs: prepMs - PREP_WARN_WINDOW_MS, kind: TimerCueKind.Tick },
      { elapsedMs: prepMs - 2000, kind: TimerCueKind.Tick },
      { elapsedMs: prepMs - 1000, kind: TimerCueKind.Tick },
      { elapsedMs: prepMs, kind: TimerCueKind.Go },
    );
  }
  let boundary = prepMs;
  let previousBoundary = prepMs;
  for (const segment of segments) {
    if (!Number.isFinite(segment.durationMs)) {
      break;
    }
    boundary += segment.durationMs;
    const isFinal = boundary === totalMs;
    for (const offset of [PREP_WARN_WINDOW_MS, 2000, 1000]) {
      const elapsedMs = boundary - offset;
      if (elapsedMs > previousBoundary) {
        cues.push({ elapsedMs, kind: TimerCueKind.Tick });
      }
    }
    cues.push({ elapsedMs: boundary, kind: isFinal ? TimerCueKind.Finish : TimerCueKind.Go });
    previousBoundary = boundary;
  }
  return cues;
}

export class TimerEngine {
  readonly state = signal<TimerState>(TimerState.Ready);
  readonly phase = signal<TimerPhase>(TimerPhase.Work);
  readonly round = signal(1);
  readonly elapsedMs = signal(0);
  readonly remainingMs = signal(0);
  readonly lastCue = signal<TimerCue | null>(null);

  private readonly segments: Segment[];
  private readonly segmentStartsMs: number[];
  private readonly prepMs: number;
  private readonly programMs: number;
  private readonly schedule: ScheduledCue[];

  private effectiveStartMs = 0;
  private pausedElapsedMs = 0;
  private lastSyncElapsedMs = -1;

  constructor(
    readonly config: TimerConfig,
    private readonly clock: Clock,
  ) {
    if (!isValidTimerConfig(config)) {
      throw new Error(`Invalid timer config: ${config.kind}`);
    }
    this.prepMs = config.prepSeconds * 1000;
    this.segments = buildSegments(config);
    this.programMs = this.segments.reduce((sum, segment) => sum + segment.durationMs, 0);
    let cursor = 0;
    this.segmentStartsMs = this.segments.map((segment) => {
      const start = cursor;
      cursor += segment.durationMs;
      return start;
    });
    this.schedule = buildSchedule(this.prepMs, this.prepMs + this.programMs, this.segments);
    this.reset();
  }

  get isCountUp(): boolean {
    return this.config.kind === TimerKind.ForTime || this.config.kind === TimerKind.Stopwatch;
  }

  start(): void {
    if (this.state() !== TimerState.Ready) {
      return;
    }
    this.effectiveStartMs = this.clock.now();
    this.lastSyncElapsedMs = -1;
    this.pausedElapsedMs = 0;
    this.round.set(1);
    this.state.set(this.prepMs > 0 ? TimerState.Prep : TimerState.Running);
    this.refresh();
  }

  pause(): void {
    if (this.config.kind === TimerKind.Amrap) {
      return;
    }
    const current = this.state();
    if (current !== TimerState.Prep && current !== TimerState.Running) {
      return;
    }
    this.pausedElapsedMs = this.clock.now() - this.effectiveStartMs;
    this.state.set(TimerState.Paused);
  }

  resume(): void {
    if (this.state() !== TimerState.Paused) {
      return;
    }
    this.effectiveStartMs = this.clock.now() - this.pausedElapsedMs;
    this.state.set(TimerState.Running);
    this.refresh();
  }

  togglePause(): void {
    if (this.state() === TimerState.Paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  reset(): void {
    this.effectiveStartMs = 0;
    this.pausedElapsedMs = 0;
    this.lastSyncElapsedMs = -1;
    this.state.set(TimerState.Ready);
    this.phase.set(TimerPhase.Work);
    this.round.set(1);
    this.elapsedMs.set(0);
    const first = this.segments[0];
    this.remainingMs.set(
      this.prepMs > 0
        ? this.prepMs
        : first !== undefined && Number.isFinite(first.durationMs)
          ? first.durationMs
          : -1,
    );
    this.lastCue.set(null);
  }

  incrementRound(): void {
    if (this.config.kind !== TimerKind.Amrap) {
      return;
    }
    this.round.update((round) => round + 1);
  }

  refresh(): void {
    const current = this.state();
    if (current !== TimerState.Prep && current !== TimerState.Running) {
      return;
    }
    const elapsedMs = this.clock.now() - this.effectiveStartMs;
    if (elapsedMs < this.prepMs) {
      this.state.set(TimerState.Prep);
      this.phase.set(TimerPhase.Work);
      this.elapsedMs.set(elapsedMs);
      this.remainingMs.set(this.prepMs - elapsedMs);
    } else {
      const programElapsedMs = elapsedMs - this.prepMs;
      if (programElapsedMs >= this.programMs) {
        this.state.set(TimerState.Finished);
        this.elapsedMs.set(elapsedMs);
        this.remainingMs.set(0);
      } else {
        const [index, offsetMs] = this.locateSegment(programElapsedMs);
        const segment = this.segments[index];
        this.state.set(TimerState.Running);
        this.phase.set(segment.phase);
        this.round.set(this.roundForSegment(index));
        this.elapsedMs.set(elapsedMs);
        this.remainingMs.set(
          Number.isFinite(segment.durationMs) ? segment.durationMs - offsetMs : -1,
        );
      }
    }
    this.emitDueCues(elapsedMs);
  }

  private locateSegment(programElapsedMs: number): [number, number] {
    let index = 0;
    while (
      index < this.segments.length - 1 &&
      programElapsedMs >= this.segmentStartsMs[index + 1]
    ) {
      index++;
    }
    return [index, programElapsedMs - this.segmentStartsMs[index]];
  }

  private roundForSegment(index: number): number {
    switch (this.config.kind) {
      case TimerKind.Emom:
        return index + 1;
      case TimerKind.Tabata:
      case TimerKind.Interval:
        return Math.floor(index / 2) + 1;
      case TimerKind.Amrap:
        return this.round();
      default:
        return 1;
    }
  }

  private emitDueCues(elapsedMs: number): void {
    const gapMs = elapsedMs - this.lastSyncElapsedMs;
    if (gapMs > MAX_CUE_JUMP_MS) {
      this.lastSyncElapsedMs = elapsedMs;
      return;
    }
    for (const cue of this.schedule) {
      if (cue.elapsedMs > this.lastSyncElapsedMs && cue.elapsedMs <= elapsedMs) {
        this.lastCue.set({ kind: cue.kind, atMillis: this.effectiveStartMs + cue.elapsedMs });
      }
    }
    this.lastSyncElapsedMs = elapsedMs;
  }
}
