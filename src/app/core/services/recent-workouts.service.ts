import { Injectable, inject, signal } from '@angular/core';
import { type TimerConfig } from '@core/timer/config';
import { BrowserStorageGateway } from '@core/services/browser-storage.gateway';

const RECENTS_KEY = 'wodweb2.recents';
const MAX_RECENTS = 5;

@Injectable({ providedIn: 'root' })
export class RecentWorkoutsService {
  private readonly storage = inject(BrowserStorageGateway);
  readonly recents = signal<readonly TimerConfig[]>([]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const stored = await this.storage.get<TimerConfig[]>(RECENTS_KEY);
    if (stored !== undefined && this.recents().length === 0) {
      this.recents.set(stored);
    }
  }

  async remember(config: TimerConfig): Promise<void> {
    const next = [config, ...this.recents().filter((item) => !sameConfig(item, config))].slice(
      0,
      MAX_RECENTS,
    );
    this.recents.set(next);
    await this.storage.set(RECENTS_KEY, next);
  }
}

function sameConfig(a: TimerConfig, b: TimerConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
