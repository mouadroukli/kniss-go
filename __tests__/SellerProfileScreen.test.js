import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import SellerProfileScreen from '../screens/SellerProfileScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

const logout = jest.fn();
const removeAccount = jest.fn();

const press = (query) => act(async () => fireEvent.press(query()));

async function renderProfile() {
  const navigate = jest.fn();
  const reset = jest.fn();
  const navigation = { navigate, reset, getParent: jest.fn(() => ({ reset })) };
  await render(
    <LanguageProvider>
      <SellerProfileScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigate, reset };
}

describe('<SellerProfileScreen />', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    logout.mockResolvedValue();
    removeAccount.mockResolvedValue();
    useAuth.mockReturnValue({
      user: { displayName: 'Zakaria Lounes', phone: '+213555000000', sellerType: 'agency' },
      logout,
      removeAccount,
    });
  });

  it('shows the account identity and the full menu', async () => {
    await renderProfile();
    expect(screen.getByText('Zakaria Lounes')).toBeTruthy();
    expect(screen.getByText('+213555000000')).toBeTruthy();
    [
      'User Profile',
      'Languages',
      'Update Phone Number',
      'Update Password',
      'Linked Accounts',
      'Help',
      'Terms and Conditions',
      'Sign Out',
      'Remove My Account',
    ].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  // Regression: the Profile menu used to be hardcoded English, so switching
  // language while signed in as a seller had no visible effect anywhere on
  // this screen even though the language actually changed underneath it.
  it('renders the menu in the stored language (French), not just English', async () => {
    await AsyncStorage.setItem('kniss_go_language', 'fr');
    await renderProfile();

    expect(screen.getByText('Profil utilisateur')).toBeTruthy();
    expect(screen.getByText('Déconnexion')).toBeTruthy();
    expect(screen.getByText('Supprimer mon compte')).toBeTruthy();
    expect(screen.queryByText('User Profile')).toBeNull();
  });

  it('routes each menu row to its screen', async () => {
    const { navigate } = await renderProfile();
    await press(() => screen.getByLabelText('Update Phone Number'));
    expect(navigate).toHaveBeenCalledWith('UpdatePhone');
    await press(() => screen.getByLabelText('Linked Accounts'));
    expect(navigate).toHaveBeenCalledWith('LinkedAccounts');
  });

  it('signs out only after the confirm dialog', async () => {
    const { reset } = await renderProfile();

    await press(() => screen.getByTestId('row-sign-out'));
    expect(logout).not.toHaveBeenCalled();

    await press(() => screen.getByTestId('confirm-modal-confirm'));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] });
  });

  it('deletes the account (not just logs out) after the Remove confirm dialog', async () => {
    const { reset } = await renderProfile();

    await press(() => screen.getByTestId('row-remove-account'));
    expect(removeAccount).not.toHaveBeenCalled();

    await press(() => screen.getByTestId('confirm-modal-confirm'));

    await waitFor(() => expect(removeAccount).toHaveBeenCalled());
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Welcome' }] });
  });
});
