import { Injectable } from '@angular/core';
import { TimerCue, TimerCueKind } from '@core/timer/cues';
import type { AudioGateway } from './audio.gateway';

@Injectable({ providedIn: 'root' })
export class BrowserAudioGateway implements AudioGateway {
  private readonly supportedFlag =
    typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  private context: AudioContext | null = null;

  supported(): boolean {
    return this.supportedFlag;
  }

  ensureUnlocked(): Promise<void> {
    const context = this.audioContext();
    if (context === null) {
      return Promise.resolve();
    }
    return context.state === 'suspended'
      ? context.resume().then(() => undefined)
      : Promise.resolve();
  }

  play(cue: TimerCue): void {
    if (!this.supported()) {
      return;
    }
    const context = this.audioContext();
    if (context === null) {
      return;
    }
    const baseFrequency =
      cue.kind === TimerCueKind.Finish ? 660 : cue.kind === TimerCueKind.Go ? 880 : 440;
    this.beep(context, baseFrequency, 0, 0.18);
    if (cue.kind === TimerCueKind.Go || cue.kind === TimerCueKind.Finish) {
      this.beep(context, baseFrequency, 0.28, 0.22);
    }
  }

  private audioContext(): AudioContext | null {
    if (!this.supported()) {
      return null;
    }
    if (this.context === null) {
      const AudioCtor =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (typeof AudioCtor === 'undefined') {
        return null;
      }
      this.context = new AudioCtor();
    }
    return this.context;
  }

  private beep(
    context: AudioContext,
    frequency: number,
    delaySeconds: number,
    durationSeconds: number,
  ): void {
    const now = context.currentTime + delaySeconds;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.05);
  }
}
