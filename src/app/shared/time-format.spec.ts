import { formatClock } from './time-format';

describe('formatClock', () => {
  it('formats zero', () => {
    expect(formatClock(0)).toBe('00:00');
  });

  it('rounds remaining time up and elapsed time down', () => {
    expect(formatClock(2_500, true)).toBe('00:03');
    expect(formatClock(2_500, false)).toBe('00:02');
  });

  it('formats minutes and seconds', () => {
    expect(formatClock(20 * 60 * 1000)).toBe('20:00');
    expect(formatClock(59_999, true)).toBe('01:00');
    expect(formatClock(59_999)).toBe('00:59');
  });

  it('adds hours when needed', () => {
    expect(formatClock(3_660_000)).toBe('1:01:00');
  });

  it('clamps negative values', () => {
    expect(formatClock(-1)).toBe('00:00');
  });
});
