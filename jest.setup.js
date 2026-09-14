// AsyncStorage ships an official in-memory mock for Jest. Every test that
// touches persistence (favorites, language, profile) relies on this.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-updates is only exercised on the RTL language switch, which needs a
// real bundle reload. Stub it so importing LanguageContext doesn't blow up.
jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(() => Promise.resolve()),
}));

// Default every test to "online" so screens that pre-flight isOnline() don't
// hit the real native module. network.test.js overrides this locally.
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

// The image picker is native, so tests that render the profile or add-listing
// forms just need it to resolve. Individual tests override
// launchImageLibraryAsync when they want to simulate a pick.
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));

// expo-image-manipulator downscales picked listing photos before upload. Mock
// the SDK 57 context API (manipulate, resize, renderAsync, saveAsync) so
// tests get a small deterministic base64 without a native module.
jest.mock('expo-image-manipulator', () => {
  const makeContext = () => {
    const context = {
      resize: jest.fn(() => context),
      renderAsync: jest.fn(() =>
        Promise.resolve({
          saveAsync: jest.fn(() =>
            Promise.resolve({ uri: 'file://manip.jpg', base64: 'TUVBTA==', width: 1280, height: 853 })
          ),
        })
      ),
    };
    return context;
  };
  return {
    ImageManipulator: { manipulate: jest.fn(() => makeContext()) },
    SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  };
});

// Same for location, a native module; tests that don't exercise the
// current-location path just need it to import cleanly.
jest.mock('expo-location', () => ({
  Accuracy: { Low: 1 },
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 36.75, longitude: 3.04 } })
  ),
}));
