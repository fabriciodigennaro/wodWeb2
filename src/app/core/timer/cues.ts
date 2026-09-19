export enum TimerCueKind {
  Tick = 'tick',
  Go = 'go',
  Finish = 'finish',
}

export interface TimerCue {
  readonly kind: TimerCueKind;
  readonly atMillis: number;
}
