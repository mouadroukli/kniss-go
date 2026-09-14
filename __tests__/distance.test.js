import { distanceInMeters } from '../server/distance';

describe('distanceInMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(distanceInMeters(36.75, 3.02, 36.75, 3.02)).toBe(0);
  });

  it('matches a known distance between two Algiers points within a few meters', () => {
    // Roughly 111m apart along a line of longitude at this latitude
    const distance = distanceInMeters(36.7538, 3.018, 36.7548, 3.018);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it('is symmetric regardless of point order', () => {
    const a = distanceInMeters(36.75, 3.02, 36.76, 3.03);
    const b = distanceInMeters(36.76, 3.03, 36.75, 3.02);
    expect(a).toBeCloseTo(b, 5);
  });
});
