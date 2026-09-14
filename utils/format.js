export function formatPrice(price, listingType) {
  const formatted = `${price.toLocaleString('en-US')} DZD`;
  return listingType === 'Rent' ? `${formatted}/mo` : formatted;
}

// A search radius (or a listing's distance) can run from 100m to 50km, so
// show metres below 1km and kilometres above it: "34521m" should never appear.
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  const rounded = Math.round(km * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}km`;
}
