import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

jest.mock('../api/auth', () => ({
  registerRequest: jest.fn(),
  loginRequest: jest.fn(),
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  fetchAccountFavorites: jest.fn(),
  saveAccountFavorites: jest.fn(),
  deleteAccount: jest.fn(() => Promise.resolve({ ok: true })),
}));

const AGENCY = {
  id: 'u_1',
  role: 'seller',
  sellerType: 'agency',
  displayName: 'Kniss Realty',
  phone: '+213555000000',
};

function Probe() {
  const { isAuthenticated, isSeller, user, login, register, logout, removeAccount } = useAuth();
  return (
    <>
      <Text testID="auth">{isAuthenticated ? 'in' : 'out'}</Text>
      <Text testID="seller">{isSeller ? 'yes' : 'no'}</Text>
      <Text testID="name">{user?.displayName ?? '-'}</Text>
      <TouchableOpacity testID="login" onPress={() => login('+213555000000', 'demo1234')}>
        <Text>login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="register"
        onPress={() =>
          register({
            verificationToken: 'vt',
            accountType: 'individual',
            password: 'password1',
            fullName: 'Sami',
            acceptedTerms: true,
          })
        }
      >
        <Text>register</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout" onPress={() => logout()}>
        <Text>logout</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="remove" onPress={() => removeAccount()}>
        <Text>remove</Text>
      </TouchableOpacity>
    </>
  );
}

async function renderProbe() {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await screen.findByTestId('auth');
}

describe('AuthContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('starts signed out', async () => {
    await renderProbe();
    expect(screen.getByTestId('auth').props.children).toBe('out');
  });

  it('logs in, exposes the seller role, and persists the session', async () => {
    authApi.loginRequest.mockResolvedValue({ token: 'tok_1', user: AGENCY });

    await renderProbe();
    await act(async () => fireEvent.press(screen.getByTestId('login')));

    await waitFor(() => {
      expect(screen.getByTestId('auth').props.children).toBe('in');
    });
    expect(screen.getByTestId('seller').props.children).toBe('yes');
    expect(screen.getByTestId('name').props.children).toBe('Kniss Realty');

    const stored = JSON.parse(await AsyncStorage.getItem('kniss_go_session'));
    expect(stored.token).toBe('tok_1');
  });

  it('restores a stored session on mount', async () => {
    await AsyncStorage.setItem(
      'kniss_go_session',
      JSON.stringify({ token: 'tok_2', user: AGENCY })
    );

    await renderProbe();

    await waitFor(() => {
      expect(screen.getByTestId('auth').props.children).toBe('in');
    });
  });

  it('registers an individual seller and persists the session', async () => {
    authApi.registerRequest.mockResolvedValue({
      token: 'tok_3',
      user: { ...AGENCY, sellerType: 'individual', displayName: 'Sami' },
    });

    await renderProbe();
    await act(async () => fireEvent.press(screen.getByTestId('register')));

    await waitFor(() => {
      expect(screen.getByTestId('auth').props.children).toBe('in');
    });
    expect(screen.getByTestId('seller').props.children).toBe('yes');
    expect(authApi.registerRequest).toHaveBeenCalledWith(
      expect.objectContaining({ verificationToken: 'vt', accountType: 'individual' })
    );
  });

  it('clears the session on logout', async () => {
    authApi.loginRequest.mockResolvedValue({ token: 'tok_4', user: AGENCY });
    await renderProbe();
    await act(async () => fireEvent.press(screen.getByTestId('login')));
    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('in'));

    await act(async () => fireEvent.press(screen.getByTestId('logout')));

    await waitFor(() => {
      expect(screen.getByTestId('auth').props.children).toBe('out');
    });
    expect(await AsyncStorage.getItem('kniss_go_session')).toBeNull();
  });

  // Regression: a web browser's localStorage quota can fill up (large
  // favourited photos, mostly) well before this app ever runs out of things
  // to store. AsyncStorage.setItem then rejects, and it used to bubble all
  // the way up through login()/register(), so a login/sign-up that fully
  // succeeded server-side still showed as a hard failure with no way in.
  it('logging in still works even when the local session write fails (storage quota exceeded)', async () => {
    authApi.loginRequest.mockResolvedValue({ token: 'tok_6', user: AGENCY });
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(
        new Error(
          "Failed to execute 'setItem' on 'Storage': Setting the value of 'kniss_go_session' exceeded the quota."
        )
      );

    await renderProbe();

    await expect(act(async () => fireEvent.press(screen.getByTestId('login')))).resolves.not.toThrow();

    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('in'));
    expect(screen.getByTestId('name').props.children).toBe('Kniss Realty');
  });

  it('removeAccount deletes server-side then clears the session', async () => {
    authApi.loginRequest.mockResolvedValue({ token: 'tok_5', user: AGENCY });
    await renderProbe();
    await act(async () => fireEvent.press(screen.getByTestId('login')));
    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('in'));

    await act(async () => fireEvent.press(screen.getByTestId('remove')));

    await waitFor(() => expect(screen.getByTestId('auth').props.children).toBe('out'));
    expect(authApi.deleteAccount).toHaveBeenCalledWith('tok_5');
    expect(await AsyncStorage.getItem('kniss_go_session')).toBeNull();
  });
});
