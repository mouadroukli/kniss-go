import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SERVER_PORT = 3000;

// "My computer's localhost" means something different depending on what's
// running the app: the browser or an iOS simulator IS the host machine, so
// plain "localhost" works. The Android emulator is its own machine, so it
// needs the "10.0.2.2" alias. A physical phone needs the computer's real LAN
// IP, which we pull from Expo Go's own Metro connection instead of asking
// anyone to hardcode it.
function resolveApiHost() {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const hostFromMetro = hostUri?.split(':')?.[0];
  if (hostFromMetro) {
    return hostFromMetro;
  }

  // No Metro host to read, e.g. a standalone build, so fall back to the
  // Android emulator alias, since that's this project's main dev target.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

// EXPO_PUBLIC_ vars are inlined at build time (see eas.json), so a standalone
// build points at the hosted server instead of a laptop-only localhost/
// 10.0.2.2 address that only ever worked because the server happened to be
// running on the same machine as the emulator during dev.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${resolveApiHost()}:${SERVER_PORT}`;

export async function fetchNearbyProperties(latitude, longitude, radius) {
  const url = `${API_BASE_URL}/properties/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return response.json();
}

// Posting a listing requires a signed-in seller, so the caller passes the
// session token, which goes on the Authorization header.
export async function createProperty(propertyData, token) {
  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(propertyData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Server responded with ${response.status}`);
  }

  return data;
}

// Tells the server a buyer is interested in a listing so the owner can see it
// on their dashboard. Called best-effort when a buyer favourites a property.
// name is optional since an account might not have a display name set.
export async function reportPropertyInterest(propertyId, phone, name) {
  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone, name }),
  });
  if (!response.ok) {
    throw new Error(`Interest report failed (${response.status})`);
  }
}
