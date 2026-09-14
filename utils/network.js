import * as Network from 'expo-network';

// Week 13's requirement: never assume the user has an internet connection.
// Every screen about to hit the Express server calls this first and bails
// out with a friendly message instead of letting fetch() throw a raw error.
export async function isOnline() {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected !== false && state.isInternetReachable !== false;
  } catch (error) {
    // Treat a failed check as online: better to attempt the request and let
    // it fail normally than block the user over a flaky detection.
    console.log('Network check failed, assuming online', error);
    return true;
  }
}
