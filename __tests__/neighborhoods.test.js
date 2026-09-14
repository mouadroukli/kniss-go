import { NEIGHBORHOODS, findNeighborhood } from '../constants/neighborhoods';

describe('neighbourhood constants', () => {
  it('keeps Ben Aknoun on the project\'s long-standing test coordinate', () => {
    const benAknoun = findNeighborhood('Ben Aknoun');
    expect(benAknoun).toEqual({ name: 'Ben Aknoun', latitude: 36.7538, longitude: 3.018 });
  });

  it('lists the eight Algiers neighbourhoods, each with real coordinates', () => {
    const names = NEIGHBORHOODS.map((n) => n.name);
    expect(names).toEqual([
      'Ben Aknoun',
      'Hydra',
      'El Biar',
      'Bir Mourad Raïs',
      'Kouba',
      'Cheraga',
      'Bab Ezzouar',
      'Birtouta',
    ]);
    for (const n of NEIGHBORHOODS) {
      expect(typeof n.latitude).toBe('number');
      expect(typeof n.longitude).toBe('number');
      // all within greater Algiers
      expect(n.latitude).toBeGreaterThan(36.5);
      expect(n.latitude).toBeLessThan(36.9);
      expect(n.longitude).toBeGreaterThan(2.8);
      expect(n.longitude).toBeLessThan(3.3);
    }
  });

  it('returns null for an unknown name', () => {
    expect(findNeighborhood('Nowhere')).toBeNull();
  });
});
