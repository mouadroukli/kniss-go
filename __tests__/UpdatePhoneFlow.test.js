import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { requestOtp, verifyOtp, changePhoneNumber } from '../api/auth';
import UpdatePhoneScreen from '../screens/UpdatePhoneScreen';
import UpdatePhoneCodeScreen from '../screens/UpdatePhoneCodeScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  changePhoneNumber: jest.fn(),
}));

const updateUser = jest.fn();

describe('Update phone number flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateUser.mockResolvedValue();
    useAuth.mockReturnValue({ user: { phone: '+213555000000' }, token: 'tok', updateUser });
  });

  it('sends a code to the new number and moves to the code screen', async () => {
    requestOtp.mockResolvedValue({ ok: true });
    const navigation = { navigate: jest.fn() };
    await render(
      <LanguageProvider>
        <UpdatePhoneScreen navigation={navigation} />
      </LanguageProvider>
    );

    await act(async () =>
      fireEvent.changeText(screen.getByPlaceholderText('0550 11 22 33'), '0551 22 33 44')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Send via WhatsApp')));

    await waitFor(() => expect(requestOtp).toHaveBeenCalledWith('0551 22 33 44', 'whatsapp'));
    expect(navigation.navigate).toHaveBeenCalledWith('UpdatePhoneCode', {
      newPhone: '0551 22 33 44',
      channel: 'whatsapp',
    });
  });

  it('verifies the code, commits the change and lands on the success screen', async () => {
    verifyOtp.mockResolvedValue({ verificationToken: 'vt' });
    changePhoneNumber.mockResolvedValue({ user: { phone: '+213551223344' } });
    const navigation = { replace: jest.fn() };
    const route = { params: { newPhone: '0551223344', channel: 'whatsapp' } };
    await render(
      <LanguageProvider>
        <UpdatePhoneCodeScreen navigation={navigation} route={route} />
      </LanguageProvider>
    );

    await act(async () =>
      fireEvent.changeText(screen.getByLabelText('Verification code'), '123456')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Verify')));

    await waitFor(() => expect(changePhoneNumber).toHaveBeenCalledWith('0551223344', 'vt', 'tok'));
    expect(updateUser).toHaveBeenCalledWith({ phone: '+213551223344' });
    expect(navigation.replace).toHaveBeenCalledWith('UpdateSuccess', { kind: 'phone' });
  });

  it('surfaces the server error when the number is already taken', async () => {
    verifyOtp.mockResolvedValue({ verificationToken: 'vt' });
    changePhoneNumber.mockRejectedValue(
      new Error('That number is already registered to another account.')
    );
    const navigation = { replace: jest.fn() };
    const route = { params: { newPhone: '0551223344', channel: 'sms' } };
    await render(
      <LanguageProvider>
        <UpdatePhoneCodeScreen navigation={navigation} route={route} />
      </LanguageProvider>
    );

    await act(async () =>
      fireEvent.changeText(screen.getByLabelText('Verification code'), '123456')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Verify')));

    await waitFor(() =>
      expect(
        screen.getByText('That number is already registered to another account.')
      ).toBeTruthy()
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
