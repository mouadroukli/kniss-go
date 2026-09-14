import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FavoritesProvider, useFavorites } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import { reportPropertyInterest } from '../api/properties';
import { fetchAccountFavorites, loginRequest } from '../api/auth';
import { navigationRef } from '../navigation/navigationRef';

jest.mock('../api/properties', () => ({
  reportPropertyInterest: jest.fn(() => Promise.resolve()),
}));
jest.mock('../api/auth', () => ({
  fetchAccountFavorites: jest.fn(() => Promise.resolve({ favorites: [] })),
  saveAccountFavorites: jest.fn(() => Promise.resolve({})),
  loginRequest: jest.fn(),
}));
jest.mock('../navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => true), navigate: jest.fn() },
}));

const PROPERTY_A = { id: 'p1', title: 'Test Villa', price: 1000000 };
const PROPERTY_B = { id: 'p2', title: 'Second Place', price: 2000000 };
const PROPERTY_WITH_PHOTOS = {
  id: 'p3',
  title: 'Photo Villa',
  price: 900000,
  photoUri: 'data:image/jpeg;base64,COVER',
  photos: ['data:image/jpeg;base64,AAA', 'data:image/jpeg;base64,BBB'],
};

const BUYER_A = { id: 'buyer-a', role: 'buyer', phone: '+213561000001', fullName: 'Buyer A' };

function Probe() {
  const { toggleFavorite, isFavorite, favorites } = useFavorites();
  const { login } = useAuth();
  return (
    <>
      <Text testID="favorite-count">{favorites.length}</Text>
      <Text testID="p1-favorite">{isFavorite('p1') ? 'yes' : 'no'}</Text>
      <Text testID="p2-favorite">{isFavorite('p2') ? 'yes' : 'no'}</Text>
      <Text testID="p3-favorite">{isFavorite('p3') ? 'yes' : 'no'}</Text>
      <TouchableOpacity testID="toggle-p1" onPress={() => toggleFavorite(PROPERTY_A)}>
        <Text>toggle p1</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="toggle-p2" onPress={() => toggleFavorite(PROPERTY_B)}>
        <Text>toggle p2</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="toggle-p3" onPress={() => toggleFavorite(PROPERTY_WITH_PHOTOS)}>
        <Text>toggle p3</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="login-a" onPress={() => login('+213561000001', 'password1')}>
        <Text>log in as account A</Text>
      </TouchableOpacity>
    </>
  );
}

const press = (testID) => act(async () => fireEvent.press(screen.getByTestId(testID)));

async function renderProbe() {
  await render(
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Probe />
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

describe('FavoritesContext — signed out (favoriting now requires a buyer account)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    fetchAccountFavorites.mockResolvedValue({ favorites: [] });
  });

  it('does not favorite anything and shows the sign-in prompt instead', async () => {
    await renderProbe();

    await press('toggle-p1');

    await screen.findByTestId('modal-sign-in');
    expect(screen.getByTestId('p1-favorite').props.children).toBe('no');
    expect(reportPropertyInterest).not.toHaveBeenCalled();
  });

  it('"Not now" dismisses with nothing favorited and no navigation', async () => {
    await renderProbe();

    await press('toggle-p1');
    await screen.findByTestId('modal-not-now');
    await press('modal-not-now');

    expect(screen.getByTestId('p1-favorite').props.children).toBe('no');
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it('"Log in / Sign up" closes the prompt and navigates to Login with a buyer intent — without favoriting yet', async () => {
    await renderProbe();

    await press('toggle-p1');
    await screen.findByTestId('modal-sign-in');
    await press('modal-sign-in');

    expect(navigationRef.navigate).toHaveBeenCalledWith('Login', { intent: 'buyer' });
    expect(screen.queryByTestId('modal-sign-in')).toBeNull();
    expect(screen.getByTestId('p1-favorite').props.children).toBe('no');
  });

  it('finishes favoriting automatically once sign-in succeeds, no second tap needed', async () => {
    loginRequest.mockResolvedValue({ token: 'tok-a', user: BUYER_A });
    fetchAccountFavorites.mockResolvedValue({ favorites: [] });

    await renderProbe();

    await press('toggle-p1');
    await screen.findByTestId('modal-sign-in');
    await press('modal-sign-in'); // navigates away; pendingProperty stays set

    await press('login-a');

    await waitFor(() => expect(screen.getByTestId('p1-favorite').props.children).toBe('yes'));
    expect(reportPropertyInterest).toHaveBeenCalledWith('p1', '+213561000001', 'Buyer A');
  });
});

describe('FavoritesContext — signed in as a buyer', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    loginRequest.mockResolvedValue({ token: 'tok-a', user: BUYER_A });
  });

  async function renderSignedIn(remoteFavorites = []) {
    fetchAccountFavorites.mockResolvedValue({ favorites: remoteFavorites });
    await renderProbe();
    await press('login-a');
    await waitFor(() => expect(fetchAccountFavorites).toHaveBeenCalledWith('tok-a'));
  }

  it('favorites immediately, with no prompt, using the account\'s real phone + name', async () => {
    await renderSignedIn();

    await press('toggle-p1');

    await waitFor(() => expect(screen.getByTestId('p1-favorite').props.children).toBe('yes'));
    expect(screen.queryByTestId('modal-sign-in')).toBeNull();
    expect(reportPropertyInterest).toHaveBeenCalledWith('p1', '+213561000001', 'Buyer A');
  });

  it('can remove a favorite', async () => {
    await renderSignedIn();
    await press('toggle-p1');
    await waitFor(() => expect(screen.getByTestId('p1-favorite').props.children).toBe('yes'));

    await press('toggle-p1');

    await waitFor(() => expect(screen.getByTestId('p1-favorite').props.children).toBe('no'));
  });

  it('does not persist the heavy photos array for a favourite — only the cover photoUri', async () => {
    await renderSignedIn();

    await press('toggle-p3');

    await waitFor(async () => {
      const stored = JSON.parse(await AsyncStorage.getItem('kniss_go_favorites_buyer-a'));
      expect(stored).toHaveLength(1);
      expect(stored[0].photoUri).toBe('data:image/jpeg;base64,COVER');
      expect(stored[0].photos).toBeUndefined();
    });
  });

  it('still favorites successfully in-memory even if the local write hits a storage quota error', async () => {
    await renderSignedIn();
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error("Setting the value of 'kniss_go_favorites_buyer-a' exceeded the quota."));

    await expect(press('toggle-p1')).resolves.not.toThrow();

    await waitFor(() => expect(screen.getByTestId('p1-favorite').props.children).toBe('yes'));
  });

  it('shows this account\'s own favourites from the server', async () => {
    await renderSignedIn([{ id: 'p9', title: 'Already saved' }]);

    await waitFor(() => expect(screen.getByTestId('favorite-count').props.children).toBe(1));
  });
});
