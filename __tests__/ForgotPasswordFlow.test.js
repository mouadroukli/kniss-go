import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { requestOtp, verifyOtp } from '../api/auth';
import ForgotPhoneScreen from '../screens/ForgotPhoneScreen';
import ForgotOtpScreen from '../screens/ForgotOtpScreen';
import ForgotPasswordFormScreen from '../screens/ForgotPasswordFormScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

const resetPassword = jest.fn();

function renderScreen(Component, props) {
  return render(
    <LanguageProvider>
      <Component {...props} />
    </LanguageProvider>
  );
}

describe('Forgot password flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ resetPassword });
    requestOtp.mockResolvedValue({ ok: true });
  });

  it('sends a code to the entered phone and moves to the code screen', async () => {
    const navigation = { navigate: jest.fn() };
    await renderScreen(ForgotPhoneScreen, { navigation, route: { params: {} } });

    await act(async () =>
      fireEvent.changeText(screen.getByPlaceholderText('0550 11 22 33'), '0551 22 33 44')
    );
    await act(async () => fireEvent.press(screen.getByText('Continue')));
    await act(async () => fireEvent.press(screen.getByText('Send via WhatsApp')));

    await waitFor(() => expect(requestOtp).toHaveBeenCalledWith('0551 22 33 44', 'whatsapp'));
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotOtp', {
      phone: '0551 22 33 44',
      channel: 'whatsapp',
    });
  });

  it('carries over whatever phone number was already typed on the login screen', async () => {
    const navigation = { navigate: jest.fn() };
    await renderScreen(ForgotPhoneScreen, {
      navigation,
      route: { params: { phone: '0555000000' } },
    });

    expect(screen.getByDisplayValue('0555000000')).toBeTruthy();
  });

  it('verifies the code and hands the token to the password step', async () => {
    verifyOtp.mockResolvedValue({ verificationToken: 'vt' });
    const navigation = { navigate: jest.fn() };
    const route = { params: { phone: '+213551223344', channel: 'whatsapp' } };
    await renderScreen(ForgotOtpScreen, { navigation, route });

    await act(async () =>
      fireEvent.changeText(screen.getByLabelText('Verification code'), '654321')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Verify')));

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('ForgotPasswordForm', {
        phone: '+213551223344',
        verificationToken: 'vt',
      })
    );
  });

  it('rejects a short or mismatched password before calling the server', async () => {
    const navigation = { getParent: jest.fn(() => ({ reset: jest.fn() })) };
    const route = { params: { phone: '+213551223344', verificationToken: 'vt' } };
    await renderScreen(ForgotPasswordFormScreen, { navigation, route });

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'short');
      fireEvent.changeText(screen.getByPlaceholderText('Repeat your password'), 'short');
    });
    await act(async () => fireEvent.press(screen.getByLabelText('Confirm Password')));

    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password and signs a seller straight into the dashboard', async () => {
    resetPassword.mockResolvedValue({ role: 'seller' });
    const reset = jest.fn();
    const navigation = { getParent: jest.fn(() => ({ reset })) };
    const route = { params: { phone: '+213551223344', verificationToken: 'vt' } };
    await renderScreen(ForgotPasswordFormScreen, { navigation, route });

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'brandnewpass');
      fireEvent.changeText(screen.getByPlaceholderText('Repeat your password'), 'brandnewpass');
    });
    await act(async () => fireEvent.press(screen.getByLabelText('Confirm Password')));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith('+213551223344', 'vt', 'brandnewpass')
    );
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Dashboard' }] });
  });

  it('sends a buyer back to the buyer tabs, not the seller dashboard', async () => {
    resetPassword.mockResolvedValue({ role: 'buyer' });
    const reset = jest.fn();
    const navigation = { getParent: jest.fn(() => ({ reset })) };
    const route = { params: { phone: '+213551223344', verificationToken: 'vt' } };
    await renderScreen(ForgotPasswordFormScreen, { navigation, route });

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'brandnewpass');
      fireEvent.changeText(screen.getByPlaceholderText('Repeat your password'), 'brandnewpass');
    });
    await act(async () => fireEvent.press(screen.getByLabelText('Confirm Password')));

    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Main' }] })
    );
  });
});
