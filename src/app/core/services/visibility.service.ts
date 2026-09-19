import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VisibilityService {
  private readonly initialVisible =
    typeof document === 'undefined' ? true : document.visibilityState === 'visible';

  readonly isVisible = signal(this.initialVisible);
  readonly isFocused = signal(true);

  constructor() {
    if (typeof document === 'undefined') {
      return;
    }
    document.addEventListener('visibilitychange', () => {
      this.isVisible.set(document.visibilityState === 'visible');
    });
    window.addEventListener('focus', () => this.isFocused.set(true));
    window.addEventListener('blur', () => this.isFocused.set(false));
  }
}
