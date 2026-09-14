import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { connectGoogle } from '../api/auth';
import LinkedAccountsScreen from '../screens/LinkedAccountsScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({ connectGoogle: jest.fn() }));

const updateUser = jest.fn();

describe('<LinkedAccountsScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateUser.mockResolvedValue();
  });

  it('shows the phone read-only and a Connect button when Google is not linked', async () => {
    useAuth.mockReturnValue({
      user: { phone: '+213555000000', googleConnected: false },
      token: 'tok',
      updateUser,
    });
    await render(
      <LanguageProvider>
        <LinkedAccountsScreen />
      </LanguageProvider>
    );
    expect(screen.getByText('+213555000000')).toBeTruthy();
    expect(screen.getByLabelText('Connect Google')).toBeTruthy();
  });

  it('links Google (visual only) and refreshes the session', async () => {
    useAuth.mockReturnValue({
      user: { phone: '+213555000000', googleConnected: false },
      token: 'tok',
      updateUser,
    });
    connectGoogle.mockResolvedValue({ user: { phone: '+213555000000', googleConnected: true } });
    await render(
      <LanguageProvider>
        <LinkedAccountsScreen />
      </LanguageProvider>
    );

    await act(async () => fireEvent.press(screen.getByLabelText('Connect Google')));

    await waitFor(() => expect(connectGoogle).toHaveBeenCalledWith('tok'));
    expect(updateUser).toHaveBeenCalledWith({ phone: '+213555000000', googleConnected: true });
  });

  it('shows a Connected pill once linked', async () => {
    useAuth.mockReturnValue({
      user: { phone: '+213555000000', googleConnected: true },
      token: 'tok',
      updateUser,
    });
    await render(
      <LanguageProvider>
        <LinkedAccountsScreen />
      </LanguageProvider>
    );
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.queryByLabelText('Connect Google')).toBeNull();
  });
});
