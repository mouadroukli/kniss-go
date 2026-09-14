import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import ConnectGoogleScreen from '../screens/ConnectGoogleScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

async function renderConnect(user) {
  useAuth.mockReturnValue({ user });
  const reset = jest.fn();
  const navigation = { getParent: jest.fn(() => ({ reset })) };
  await render(
    <LanguageProvider>
      <ConnectGoogleScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { reset };
}

describe('<ConnectGoogleScreen /> — the last sign-up step', () => {
  it('drops a newly-created seller onto the Dashboard', async () => {
    const { reset } = await renderConnect({ role: 'seller' });
    await act(async () => fireEvent.press(screen.getByText('Skip')));
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Dashboard' }] });
  });

  it('drops a newly-created buyer onto the buyer tabs, not the seller dashboard', async () => {
    const { reset } = await renderConnect({ role: 'buyer' });
    await act(async () => fireEvent.press(screen.getByText('Continue')));
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] });
  });
});
