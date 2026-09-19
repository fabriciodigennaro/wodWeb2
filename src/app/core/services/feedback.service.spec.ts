import { TestBed } from '@angular/core/testing';
import { type Mock, vi } from 'vitest';
import { TimerCue, TimerCueKind } from '@core/timer/cues';
import type { AudioGateway } from './audio.gateway';
import { BrowserAudioGateway } from './browser-audio.gateway';
import { BrowserHapticGateway } from './browser-haptics.gateway';
import type { HapticGateway } from './haptics.gateway';
import { TimerFeedbackService } from './feedback.service';

describe('TimerFeedbackService', () => {
  let play: Mock;
  let buzz: Mock;

  function createService(): TimerFeedbackService {
    play = vi.fn();
    buzz = vi.fn();
    const audio: AudioGateway = {
      supported: () => true,
      ensureUnlocked: () => Promise.resolve(),
      play,
    };
    const haptics: HapticGateway = { supported: () => true, buzz };
    TestBed.configureTestingModule({
      providers: [
        { provide: BrowserAudioGateway, useValue: audio },
        { provide: BrowserHapticGateway, useValue: haptics },
      ],
    });
    return TestBed.inject(TimerFeedbackService);
  }

  it('plays the cue exactly once even when notified repeatedly at the same instant', () => {
    const service = createService();
    const cue: TimerCue = { kind: TimerCueKind.Tick, atMillis: 5000 };
    service.notify(cue);
    service.notify(cue);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays again for a cue at a different instant', () => {
    const service = createService();
    service.notify({ kind: TimerCueKind.Tick, atMillis: 5000 });
    service.notify({ kind: TimerCueKind.Tick, atMillis: 9000 });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('buzzes when the haptic gateway supports vibration', () => {
    createService().notify({ kind: TimerCueKind.Go, atMillis: 1000 });
    expect(buzz).toHaveBeenCalledTimes(1);
  });
});
