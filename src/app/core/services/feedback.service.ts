import { Injectable, inject } from '@angular/core';
import { TimerCue, TimerCueKind } from '@core/timer/cues';
import { BrowserAudioGateway } from './browser-audio.gateway';
import { BrowserHapticGateway } from './browser-haptics.gateway';

@Injectable({ providedIn: 'root' })
export class TimerFeedbackService {
  private readonly audio = inject(BrowserAudioGateway);
  private readonly haptics = inject(BrowserHapticGateway);
  private lastHandledAt = -1;

  unlockOnGesture(): void {
    void this.audio.ensureUnlocked();
  }

  notify(cue: TimerCue): void {
    if (cue.atMillis === this.lastHandledAt) {
      return;
    }
    this.lastHandledAt = cue.atMillis;
    this.audio.play(cue);
    if (cue.kind === TimerCueKind.Tick) {
      this.haptics.buzz([15]);
    } else if (cue.kind === TimerCueKind.Go) {
      this.haptics.buzz([40, 40, 80]);
    } else if (cue.kind === TimerCueKind.Finish) {
      this.haptics.buzz([80, 60, 80, 60, 120]);
    }
  }
}
