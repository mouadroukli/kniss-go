import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import WelcomeScreen from '../screens/WelcomeScreen';

async function renderWelcome() {
  const navigation = { navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <WelcomeScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<WelcomeScreen />', () => {
  it('keeps "Discover nearby properties" as the primary, account-free entry point', async () => {
    const { navigation } = await renderWelcome();

    await act(async () =>
      fireEvent.press(screen.getByLabelText('Discover nearby properties'))
    );

    expect(navigation.navigate).toHaveBeenCalledWith('Main', { screen: 'Explore' });
  });

  it('down to exactly two buttons — no standalone "Post a listing" or "I already have an account"', async () => {
    await renderWelcome();

    expect(screen.getByLabelText('Discover nearby properties')).toBeTruthy();
    expect(screen.getByLabelText('Log in / Sign up')).toBeTruthy();
    expect(screen.queryByLabelText('Post a listing')).toBeNull();
    expect(screen.queryByLabelText('I already have an account')).toBeNull();
  });

  it('"Log in / Sign up" leads to the login screen, not straight into sign-up', async () => {
    const { navigation } = await renderWelcome();

    await act(async () => fireEvent.press(screen.getByLabelText('Log in / Sign up')));

    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});
