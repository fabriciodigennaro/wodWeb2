import { Injectable, signal } from '@angular/core';
import type { TimerConfig } from '@core/timer/config';

@Injectable({ providedIn: 'root' })
export class TimerSessionService {
  readonly config = signal<TimerConfig | null>(null);
}
