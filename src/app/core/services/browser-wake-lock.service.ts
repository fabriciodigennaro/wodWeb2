import { Injectable } from '@angular/core';
import type { WakeLockGateway } from './wake-lock.gateway';

@Injectable({ providedIn: 'root' })
export class BrowserWakeLockService implements WakeLockGateway {
  private lock: WakeLockSentinel | null = null;

  supported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  async acquire(): Promise<boolean> {
    if (!this.supported()) {
      return false;
    }
    try {
      this.lock = await navigator.wakeLock.request('screen');
      this.lock.addEventListener('release', () => {
        this.lock = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  release(): void {
    const lock = this.lock;
    this.lock = null;
    if (lock !== null && !lock.released) {
      void lock.release();
    }
  }
}
