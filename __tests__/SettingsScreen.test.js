import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import SettingsScreen from '../screens/SettingsScreen';

// Regression coverage for the "Sign Out does nothing" bug: it was wired to
// RN's Alert.alert(), which is a documented no-op on web (react-native-web's
// Alert.alert is an empty function), so the confirm dialog, and therefore
// the whole sign-out, never happened there.

const BUYER = {
  id: 'u_1',
  role: 'buyer',
  sellerType: null,
  displayName: 'Amina Buyer',
  fullName: 'Amina Buyer',
  phone: '+213561112233',
};

async function renderSettings() {
  const reset = jest.fn();
  const navigate = jest.fn();
  const navigation = { navigate, getParent: jest.fn(() => ({ reset })) };
  await render(
    <LanguageProvider>
      <AuthProvider>
        <SettingsScreen navigation={navigation} />
      </AuthProvider>
    </LanguageProvider>
  );
  return { navigation, navigate, reset };
}

async function renderSignedIn() {
  await AsyncStorage.setItem('kniss_go_session', JSON.stringify({ token: 'tok_1', user: BUYER }));
  const result = await renderSettings();
  await screen.findByText('Amina Buyer');
  return result;
}

describe('<SettingsScreen /> — signed out (buyer never needs an account to browse)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('offers to log in or create an account, with no account-only rows', async () => {
    await renderSettings();

    await screen.findByText('Log in or create an account');
    expect(screen.queryByText('User Profile')).toBeNull();
    expect(screen.queryByText('Update Phone Number')).toBeNull();
    expect(screen.queryByText('Sign Out')).toBeNull();
    // Languages, Help and Terms don't need an account.
    expect(screen.getByText('Languages')).toBeTruthy();
    expect(screen.getByText('Help')).toBeTruthy();
  }, 20000);

  it('routes to Login', async () => {
    const { navigate } = await renderSettings();
    await act(async () => fireEvent.press(screen.getByText('Log in or create an account')));
    expect(navigate).toHaveBeenCalledWith('Login');
  });
});

describe('<SettingsScreen /> — signed in as a buyer', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows the account menu: profile, phone, password, linked accounts', async () => {
    await renderSignedIn();
    expect(screen.getByText('+213561112233')).toBeTruthy();
    [
      'User Profile',
      'Update Phone Number',
      'Update Password',
      'Linked Accounts',
      'Languages',
      'Sign Out',
      'Remove My Account',
    ].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('does not sign out immediately — a confirmation shows first', async () => {
    await renderSignedIn();

    await act(async () => fireEvent.press(screen.getByLabelText('Sign Out')));

    await screen.findByTestId('confirm-modal-confirm');
    expect(await AsyncStorage.getItem('kniss_go_session')).not.toBeNull();
  });

  it('cancelling the confirmation leaves the session untouched', async () => {
    const { reset } = await renderSignedIn();

    await act(async () => fireEvent.press(screen.getByLabelText('Sign Out')));
    await screen.findByTestId('confirm-modal-cancel');
    await act(async () => fireEvent.press(screen.getByTestId('confirm-modal-cancel')));

    expect(await AsyncStorage.getItem('kniss_go_session')).not.toBeNull();
    expect(reset).not.toHaveBeenCalled();
  });

  it('confirming clears the session and resets to the Welcome screen', async () => {
    const { reset } = await renderSignedIn();

    await act(async () => fireEvent.press(screen.getByLabelText('Sign Out')));
    await screen.findByTestId('confirm-modal-confirm');
    await act(async () => fireEvent.press(screen.getByTestId('confirm-modal-confirm')));

    expect(await AsyncStorage.getItem('kniss_go_session')).toBeNull();
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] });
  });

  it('routes Update Phone Number and Linked Accounts to their screens', async () => {
    const { navigate } = await renderSignedIn();
    await act(async () => fireEvent.press(screen.getByLabelText('Update Phone Number')));
    expect(navigate).toHaveBeenCalledWith('UpdatePhone');
    await act(async () => fireEvent.press(screen.getByLabelText('Linked Accounts')));
    expect(navigate).toHaveBeenCalledWith('LinkedAccounts');
  });
});
