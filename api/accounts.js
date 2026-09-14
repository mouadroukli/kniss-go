import { API_BASE_URL } from './properties';

// Public, no-auth lookup behind Property Detail's agency row and names in
// Interested buyers (server/index.js's /accounts/public/:phone route).
// Throws on a 404 like any other missing-resource call here, so callers
// should treat that as "no public profile".
export async function fetchPublicProfile(phone) {
  const response = await fetch(`${API_BASE_URL}/accounts/public/${encodeURIComponent(phone)}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Server responded with ${response.status}`);
  }
  return data;
}
