import { formatPrice, formatDistance } from '../utils/format';

describe('formatPrice', () => {
  it('formats a sale price with no suffix', () => {
    expect(formatPrice(14000000, 'Sell')).toBe('14,000,000 DZD');
  });

  it('appends /mo for a rental', () => {
    expect(formatPrice(45000, 'Rent')).toBe('45,000 DZD/mo');
  });
});

describe('formatDistance', () => {
  it('shows metres below 1km', () => {
    expect(formatDistance(40)).toBe('40m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('switches to kilometres at 1km and up, dropping a trailing .0', () => {
    expect(formatDistance(1000)).toBe('1km');
    expect(formatDistance(2000)).toBe('2km');
    expect(formatDistance(50000)).toBe('50km');
  });

  it('keeps one decimal place for a non-whole number of kilometres', () => {
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(34521)).toBe('34.5km');
  });

  it('handles missing input without throwing', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });
});
