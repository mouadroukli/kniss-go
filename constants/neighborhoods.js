// Fixed set of Algiers neighbourhoods with hardcoded coordinates. Real address
// search isn't reliable enough on Android emulators to be worth building here
// (see PROJECT_NOTES). Ben Aknoun keeps the coordinate this project has used
// as its test location since day one.
export const NEIGHBORHOODS = [
  { name: 'Ben Aknoun', latitude: 36.7538, longitude: 3.018 },
  { name: 'Hydra', latitude: 36.7452, longitude: 3.037 },
  { name: 'El Biar', latitude: 36.7676, longitude: 3.0335 },
  { name: 'Bir Mourad Raïs', latitude: 36.7335, longitude: 3.0486 },
  { name: 'Kouba', latitude: 36.7189, longitude: 3.0796 },
  { name: 'Cheraga', latitude: 36.7676, longitude: 2.9558 },
  { name: 'Bab Ezzouar', latitude: 36.7137, longitude: 3.1836 },
  { name: 'Birtouta', latitude: 36.6417, longitude: 2.9986 },
];

export function findNeighborhood(name) {
  return NEIGHBORHOODS.find((n) => n.name === name) || null;
}
