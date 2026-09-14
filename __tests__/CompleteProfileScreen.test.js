import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

// The screen's own behaviour is what's under test here; session plumbing is
// AuthContext's job (covered in its own suite), so useAuth is stubbed.
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

const register = jest.fn();

async function renderProfile(accountType) {
  const navigation = { navigate: jest.fn() };
  const route = {
    params: {
      accountType,
      phone: '+213770123456',
      verificationToken: 'vt-123',
      password: 'hunter2000',
    },
  };
  await render(
    <LanguageProvider>
      <CompleteProfileScreen navigation={navigation} route={route} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<CompleteProfileScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    register.mockResolvedValue({ id: 'u_1', displayName: 'Sami' });
    useAuth.mockReturnValue({ register });
  });

  it('hides the agency name field for an individual', async () => {
    await renderProfile('individual');
    expect(screen.queryByPlaceholderText('e.g. Kniss Realty')).toBeNull();
  });

  it('shows the agency name field for an agency', async () => {
    await renderProfile('agency');
    expect(screen.getByPlaceholderText('e.g. Kniss Realty')).toBeTruthy();
  });

  it('gates Continue on name + terms, then registers and moves to the Google step', async () => {
    const { navigation } = await renderProfile('individual');

    // Nothing filled in, so Continue is blocked.
    expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('e.g. Zakaria Lounis'), 'Sami Test');
      fireEvent.changeText(screen.getByPlaceholderText('2'), '3');
      fireEvent(
        screen.getByLabelText('Accept the privacy policy and terms of service'),
        'valueChange',
        true
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);
    });

    await act(async () => fireEvent.press(screen.getByLabelText('Continue')));

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        verificationToken: 'vt-123',
        accountType: 'individual',
        password: 'hunter2000',
        fullName: 'Sami Test',
        monthlyListings: 3,
        acceptedTerms: true,
      })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('SignupGoogle');
  });

  it('hides the monthly-listings question for a buyer account (they never post)', async () => {
    await renderProfile('buyer');
    expect(screen.queryByPlaceholderText('2')).toBeNull();
  });

  it('registers a buyer without a monthly listing count once name + terms are given', async () => {
    const { navigation } = await renderProfile('buyer');

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('e.g. Zakaria Lounis'), 'Amina Buyer');
      fireEvent(
        screen.getByLabelText('Accept the privacy policy and terms of service'),
        'valueChange',
        true
      );
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Continue').props.accessibilityState.disabled).toBe(false)
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Continue')));

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ accountType: 'buyer', fullName: 'Amina Buyer', monthlyListings: 0 })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('SignupGoogle');
  });
});
