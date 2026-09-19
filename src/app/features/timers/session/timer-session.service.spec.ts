import { TestBed } from '@angular/core/testing';
import { TimerKind, defaultTimerConfig } from '@core/timer/config';
import { TimerSessionService } from './timer-session.service';

describe('TimerSessionService', () => {
  let service: TimerSessionService;

  beforeEach(() => {
    service = TestBed.inject(TimerSessionService);
  });

  it('starts without a config', () => {
    expect(service.config()).toBeNull();
  });

  it('stores the chosen config for the timer screen', () => {
    const config = defaultTimerConfig(TimerKind.Amrap);
    service.config.set(config);
    expect(service.config()).toBe(config);
  });
});
