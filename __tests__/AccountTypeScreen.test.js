import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import AccountTypeScreen from '../screens/AccountTypeScreen';

async function renderAccountType() {
  const navigation = { navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <AccountTypeScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<AccountTypeScreen /> — the new buyer-vs-seller fork', () => {
  it('offers Buyer and Seller tiles', async () => {
    await renderAccountType();
    expect(screen.getByText('Buyer')).toBeTruthy();
    expect(screen.getByText('Seller')).toBeTruthy();
  });

  it('Buyer skips straight to the phone step, no role picker', async () => {
    const { navigation } = await renderAccountType();
    await act(async () => fireEvent.press(screen.getByText('Buyer')));
    expect(navigation.navigate).toHaveBeenCalledWith('SignupPhone', { accountType: 'buyer' });
  });

  it('Seller goes on to the unchanged Individual/Agency screen', async () => {
    const { navigation } = await renderAccountType();
    await act(async () => fireEvent.press(screen.getByText('Seller')));
    expect(navigation.navigate).toHaveBeenCalledWith('SignupRole');
  });

  it('"I already have an account" goes to a plain login, no intent', async () => {
    const { navigation } = await renderAccountType();
    await act(async () =>
      fireEvent.press(screen.getByText('I already have an account'))
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});
