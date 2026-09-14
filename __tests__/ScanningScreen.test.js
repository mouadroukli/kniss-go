import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { fetchNearbyProperties } from '../api/properties';
import { isOnline } from '../utils/network';
import { LanguageProvider } from '../context/LanguageContext';
import ScanningScreen from '../screens/ScanningScreen';

jest.mock('../api/properties', () => ({ fetchNearbyProperties: jest.fn() }));
jest.mock('../utils/network', () => ({ isOnline: jest.fn() }));

// A couple of tests need to actually observe the in-between stages. With
// every mock resolving instantly, render() can flush the whole locating,
// scanning, found chain before an assertion ever runs, so those two steps
// get a real tiny setTimeout instead of an instant-resolving promise.
const delayed = (value, ms = 30) => () => new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function renderScan(params) {
  const navigation = { replace: jest.fn(), goBack: jest.fn() };
  await render(
    <LanguageProvider>
      <ScanningScreen navigation={navigation} route={{ params }} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<ScanningScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isOnline.mockResolvedValue(true);
    fetchNearbyProperties.mockResolvedValue({ count: 3, properties: [{ id: '1' }] });
  });

  it('GPS mode: locates, scans, finds, then hands off to Results', async () => {
    Location.getCurrentPositionAsync.mockImplementationOnce(
      delayed({ coords: { latitude: 36.75, longitude: 3.04 } })
    );
    fetchNearbyProperties.mockImplementationOnce(
      delayed({ count: 3, properties: [{ id: '1' }] }, 200)
    );

    const { navigation } = await renderScan({ radius: 2000, locationMode: 'current' });

    await screen.findByText('Finding your position...');
    expect(screen.getByText('Getting an exact GPS lock for accurate results.')).toBeTruthy();

    await screen.findByText('Scanning 2km around you...', {}, { timeout: 3000 });
    expect(fetchNearbyProperties).toHaveBeenCalledWith(36.75, 3.04, 2000);

    await screen.findByText('Found 3 properties nearby', {}, { timeout: 3000 });

    await waitFor(
      () =>
        expect(navigation.replace).toHaveBeenCalledWith('Results', {
          properties: [{ id: '1' }],
          radius: 2000,
        }),
      { timeout: 3000 }
    );
  });

  it('neighbourhood mode skips GPS permission entirely and searches from the chosen coordinate', async () => {
    await renderScan({ radius: 5000, locationMode: 'neighborhood', neighborhood: 'Hydra' });

    expect(await screen.findByText(/Centring the search on Hydra/)).toBeTruthy();

    await waitFor(
      () => expect(fetchNearbyProperties).toHaveBeenCalledWith(36.7452, 3.037, 5000),
      { timeout: 3000 }
    );
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shows the radius as a km label, not raw metres, once scanning', async () => {
    Location.getCurrentPositionAsync.mockImplementationOnce(
      delayed({ coords: { latitude: 36.75, longitude: 3.04 } })
    );
    fetchNearbyProperties.mockImplementationOnce(
      delayed({ count: 1, properties: [{ id: '1' }] }, 200)
    );
    await renderScan({ radius: 50000, locationMode: 'current' });
    await screen.findByText('Scanning 50km around you...', {}, { timeout: 3000 });
  });

  it('shows the offline error before ever touching location', async () => {
    isOnline.mockResolvedValue(false);
    await renderScan({ radius: 2000, locationMode: 'current' });

    expect(
      await screen.findByText(
        "You're offline. Reconnect to the internet to scan the area around you."
      )
    ).toBeTruthy();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('surfaces a permission error for GPS mode, with a test-location fallback', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    await renderScan({ radius: 2000, locationMode: 'current' });

    expect(await screen.findByText('Allow location access to see what is nearby.')).toBeTruthy();
    expect(screen.getByText('Continue with a test location')).toBeTruthy();
  });

  it('does not offer the GPS-only fallback button for a neighbourhood-mode error', async () => {
    fetchNearbyProperties.mockRejectedValue(new Error('network'));
    await renderScan({ radius: 2000, locationMode: 'neighborhood', neighborhood: 'Hydra' });

    expect(
      await screen.findByText(
        'Could not load nearby properties. Try again in a moment.',
        {},
        { timeout: 3000 }
      )
    ).toBeTruthy();
    expect(screen.queryByText('Continue with a test location')).toBeNull();
  });

  it('Cancel goes back immediately and the scan never hands off to Results', async () => {
    Location.getCurrentPositionAsync.mockImplementationOnce(
      delayed({ coords: { latitude: 36.75, longitude: 3.04 } }, 200)
    );
    const { navigation } = await renderScan({ radius: 2000, locationMode: 'current' });

    await act(async () => fireEvent.press(screen.getByLabelText('Cancel')));
    expect(navigation.goBack).toHaveBeenCalled();

    // Let the in-flight position/fetch calls resolve, if they were going to;
    // cancelling must stop the hand-off to Results either way.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
