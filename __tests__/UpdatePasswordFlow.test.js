import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { requestOtp, verifyOtp, changePassword } from '../api/auth';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import UpdatePasswordFormScreen from '../screens/UpdatePasswordFormScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  changePassword: jest.fn(),
}));

describe('Update password flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { phone: '+213555000000' }, token: 'tok' });
    requestOtp.mockResolvedValue({ ok: true });
  });

  it('OTPs the account number first, then hands a verification token to the form step', async () => {
    verifyOtp.mockResolvedValue({ verificationToken: 'vt' });
    const navigation = { navigate: jest.fn() };
    await render(
      <LanguageProvider>
        <UpdatePasswordScreen navigation={navigation} />
      </LanguageProvider>
    );

    await waitFor(() => expect(requestOtp).toHaveBeenCalledWith('+213555000000', 'whatsapp'));

    await act(async () =>
      fireEvent.changeText(screen.getByLabelText('Verification code'), '654321')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Verify')));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('UpdatePasswordForm', {
        verificationToken: 'vt',
      })
    );
  });

  it('rejects a short or mismatched password before calling the server', async () => {
    const navigation = { replace: jest.fn() };
    const route = { params: { verificationToken: 'vt' } };
    await render(
      <LanguageProvider>
        <UpdatePasswordFormScreen navigation={navigation} route={route} />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'short');
      fireEvent.changeText(screen.getByPlaceholderText('Repeat your password'), 'short');
    });
    await act(async () => fireEvent.press(screen.getByLabelText('Confirm Password')));
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('saves a valid new password and lands on the success screen', async () => {
    changePassword.mockResolvedValue({ ok: true });
    const navigation = { replace: jest.fn() };
    const route = { params: { verificationToken: 'vt' } };
    await render(
      <LanguageProvider>
        <UpdatePasswordFormScreen navigation={navigation} route={route} />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'brandnewpass');
      fireEvent.changeText(screen.getByPlaceholderText('Repeat your password'), 'brandnewpass');
    });
    await act(async () => fireEvent.press(screen.getByLabelText('Confirm Password')));

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith('brandnewpass', 'vt', 'tok')
    );
    expect(navigation.replace).toHaveBeenCalledWith('UpdateSuccess', { kind: 'password' });
  });
});
