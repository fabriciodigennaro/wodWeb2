import { TestBed } from '@angular/core/testing';
import { TimerKind } from '@core/timer/config';
import { RecentWorkoutsService } from './recent-workouts.service';

describe('RecentWorkoutsService', () => {
  let service: RecentWorkoutsService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(RecentWorkoutsService);
  });

  it('starts empty', () => {
    expect(service.recents()).toEqual([]);
  });

  it('remembers a config at the top of the list', async () => {
    await service.remember({ kind: TimerKind.Amrap, prepSeconds: 10, durationSeconds: 1200 });
    await service.remember({
      kind: TimerKind.Emom,
      prepSeconds: 10,
      intervalSeconds: 60,
      rounds: 10,
    });
    expect(service.recents().map((config) => config.kind)).toEqual([
      TimerKind.Emom,
      TimerKind.Amrap,
    ]);
  });

  it('deduplicates equal configs and never keeps more than five', async () => {
    for (let index = 0; index < 7; index += 1) {
      await service.remember({
        kind: TimerKind.Amrap,
        prepSeconds: 10,
        durationSeconds: 1200 + index,
      });
    }
    await service.remember({ kind: TimerKind.Amrap, prepSeconds: 10, durationSeconds: 1200 + 6 });
    expect(service.recents().length).toBe(5);
  });

  it('persists recents to localStorage', async () => {
    await service.remember({
      kind: TimerKind.Tabata,
      prepSeconds: 10,
      workSeconds: 20,
      restSeconds: 10,
      rounds: 8,
    });
    const stored = localStorage.getItem('wodweb2.recents');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? '')[0].kind).toBe(TimerKind.Tabata);
  });
});
