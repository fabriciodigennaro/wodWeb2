import { Injectable } from '@angular/core';
import type { HapticGateway } from './haptics.gateway';

@Injectable({ providedIn: 'root' })
export class BrowserHapticGateway implements HapticGateway {
  supported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  buzz(pattern?: readonly number[]): void {
    if (!this.supported()) {
      return;
    }
    navigator.vibrate(pattern ?? [15]);
  }
}
