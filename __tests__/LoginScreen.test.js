import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import LoginScreen from '../screens/LoginScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

const login = jest.fn();

async function renderLogin(route) {
  const reset = jest.fn();
  const navigation = { replace: jest.fn(), getParent: jest.fn(() => ({ reset })) };
  await render(
    <LanguageProvider>
      <LoginScreen navigation={navigation} route={route} />
    </LanguageProvider>
  );
  return { navigation, reset };
}

async function submit(phone, password) {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText('0550 11 22 33'), phone);
    fireEvent.changeText(screen.getByPlaceholderText('Your password'), password);
  });
  await act(async () => fireEvent.press(screen.getByText('Log in')));
}

describe('<LoginScreen /> — role-aware redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login });
  });

  it('sends a seller to the Dashboard', async () => {
    login.mockResolvedValue({ role: 'seller' });
    const { reset } = await renderLogin();

    await submit('0555000000', 'demo1234');

    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Dashboard' }] })
    );
  });

  it('sends a buyer back to the buyer tabs, not the seller dashboard', async () => {
    login.mockResolvedValue({ role: 'buyer' });
    const { reset } = await renderLogin();

    await submit('0561112233', 'password1');

    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] })
    );
  });
});

describe('<LoginScreen /> — "I don\'t have an account"', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login });
  });

  it('goes to the role picker by default', async () => {
    const { navigation } = await renderLogin();

    await act(async () => fireEvent.press(screen.getByText("I don't have an account")));

    expect(navigation.replace).toHaveBeenCalledWith('Onboarding');
  });

  it('skips straight to buyer sign-up when reached with a buyer intent (from Welcome\'s "Save favourites")', async () => {
    const { navigation } = await renderLogin({ params: { intent: 'buyer' } });

    await act(async () => fireEvent.press(screen.getByText("I don't have an account")));

    expect(navigation.replace).toHaveBeenCalledWith('Onboarding', {
      screen: 'SignupPhone',
      params: { accountType: 'buyer' },
    });
  });
});
