import type { TimerCue } from '@core/timer/cues';

export interface AudioGateway {
  ensureUnlocked(): Promise<void>;
  play(cue: TimerCue): void;
  supported(): boolean;
}
