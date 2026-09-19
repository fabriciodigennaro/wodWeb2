import { SystemClock } from './clock';

describe('SystemClock', () => {
  it('returns the current wall-clock time', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });

  it('advances over time', async () => {
    const clock = new SystemClock();
    const first = clock.now();
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(clock.now()).toBeGreaterThan(first);
  });
});
