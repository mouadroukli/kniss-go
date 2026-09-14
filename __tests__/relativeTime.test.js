import { relativeTime, daysUntilExpiry, LISTING_LIFESPAN_DAYS } from '../utils/relativeTime';

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms).toISOString();

describe('relativeTime', () => {
  it('labels recent times in minutes and hours', () => {
    expect(relativeTime(ago(30 * 1000))).toBe('just now');
    expect(relativeTime(ago(5 * 60 * 1000))).toBe('5m ago');
    expect(relativeTime(ago(3 * 60 * 60 * 1000))).toBe('3h ago');
  });

  it('labels days, weeks, months', () => {
    expect(relativeTime(ago(2 * DAY))).toBe('2d ago');
    expect(relativeTime(ago(10 * DAY))).toBe('1w ago');
    expect(relativeTime(ago(45 * DAY))).toBe('1mo ago');
  });

  it('is empty for an unparseable value', () => {
    expect(relativeTime('not a date')).toBe('');
  });
});

describe('daysUntilExpiry', () => {
  it('counts down from the 30-day lifespan', () => {
    expect(daysUntilExpiry(ago(28 * DAY))).toBe(LISTING_LIFESPAN_DAYS - 28);
    expect(daysUntilExpiry(ago(2 * DAY))).toBe(LISTING_LIFESPAN_DAYS - 2);
  });

  it('goes negative once a listing is past its lifespan', () => {
    expect(daysUntilExpiry(ago(40 * DAY))).toBeLessThan(0);
  });

  it('is null for an unparseable value', () => {
    expect(daysUntilExpiry('nope')).toBeNull();
  });
});
