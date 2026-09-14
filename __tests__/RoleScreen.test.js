import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import RoleScreen from '../screens/RoleScreen';

async function renderRole() {
  const navigation = { navigate: jest.fn(), getParent: jest.fn(() => ({ navigate: jest.fn() })) };
  await render(
    <LanguageProvider>
      <RoleScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<RoleScreen />', () => {
  it('offers only Individual and Agency — no Buyer tile', async () => {
    await renderRole();
    expect(screen.getByText('Individual')).toBeTruthy();
    expect(screen.getByText('Agency')).toBeTruthy();
    expect(screen.queryByText('Buyer')).toBeNull();
  });

  it('carries accountType: "individual" forward to the phone step', async () => {
    const { navigation } = await renderRole();
    await act(async () => fireEvent.press(screen.getByText('Individual')));
    expect(navigation.navigate).toHaveBeenCalledWith('SignupPhone', { accountType: 'individual' });
  });

  it('carries accountType: "agency" forward to the phone step', async () => {
    const { navigation } = await renderRole();
    await act(async () => fireEvent.press(screen.getByText('Agency')));
    expect(navigation.navigate).toHaveBeenCalledWith('SignupPhone', { accountType: 'agency' });
  });
});
