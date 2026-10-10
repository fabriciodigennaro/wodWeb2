import { Injectable, inject, signal } from '@angular/core';
import { BrowserAudioGateway } from './browser-audio.gateway';
import { RecentWorkoutsService } from './recent-workouts.service';

const VOLUME_KEY = 'wodweb2.volume';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly audio = inject(BrowserAudioGateway);
  private readonly recents = inject(RecentWorkoutsService);

  readonly volume = signal(0.5);
  readonly isSettingsOpen = signal(false);

  constructor() {
    this.loadVolume();
  }

  private async loadVolume(): Promise<void> {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(VOLUME_KEY);
    if (stored !== null) {
      const vol = parseFloat(stored);
      if (!Number.isNaN(vol)) {
        this.volume.set(vol);
        this.audio.setVolume(vol);
      }
    } else {
      this.audio.setVolume(0.5);
    }
  }

  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volume.set(clamped);
    this.audio.setVolume(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOLUME_KEY, clamped.toString());
    }
  }

  async clearRecents(): Promise<void> {
    await this.recents.clear();
  }

  toggleSettings(): void {
    this.isSettingsOpen.update((v) => !v);
  }

  closeSettings(): void {
    this.isSettingsOpen.set(false);
  }

  openSettings(): void {
    this.isSettingsOpen.set(true);
  }
}