// Short "how long ago" label for an ISO timestamp, like "3d ago" or "2w ago".
// Used on the seller dashboard for listing age and lead age.
export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (seconds < minute) return 'just now';
  if (seconds < hour) return `${Math.floor(seconds / minute)}m ago`;
  if (seconds < day) return `${Math.floor(seconds / hour)}h ago`;

  const days = Math.floor(seconds / day);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Days left before a listing hits its 30-day expiry (negative once past).
export const LISTING_LIFESPAN_DAYS = 30;

export function daysUntilExpiry(createdAt) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return null;
  const expiresAt = created + LISTING_LIFESPAN_DAYS * 24 * 60 * 60 * 1000;
  return Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
}
