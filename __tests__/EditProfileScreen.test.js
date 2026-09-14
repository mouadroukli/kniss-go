import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { updateProfile } from '../api/auth';
import EditProfileScreen from '../screens/EditProfileScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({ updateProfile: jest.fn() }));

const updateUser = jest.fn();

async function renderEdit(user) {
  const navigation = { goBack: jest.fn() };
  await render(
    <LanguageProvider>
      <EditProfileScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

const AGENCY = {
  sellerType: 'agency',
  fullName: 'Zakaria Lounes',
  agencyName: '16 real estate',
  phone: '+213555000000',
  photo: null,
};
const INDIVIDUAL = { ...AGENCY, sellerType: 'individual', agencyName: null };

describe('<EditProfileScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateUser.mockResolvedValue();
    updateProfile.mockResolvedValue({ user: { ...AGENCY, fullName: 'Zakaria L' } });
    useAuth.mockReturnValue({ user: AGENCY, token: 'tok', updateUser });
  });

  it('shows the Agency Name field for an agency account', async () => {
    await renderEdit();
    expect(screen.getByDisplayValue('16 real estate')).toBeTruthy();
  });

  it('hides the Agency Name field for an individual account', async () => {
    useAuth.mockReturnValue({ user: INDIVIDUAL, token: 'tok', updateUser });
    await renderEdit();
    expect(screen.queryByPlaceholderText('e.g. Kniss Realty')).toBeNull();
  });

  it('shows the phone number as read-only text, not an editable field', async () => {
    await renderEdit();
    expect(screen.getByText('+213555000000')).toBeTruthy();
    expect(screen.queryByDisplayValue('+213555000000')).toBeNull(); // no TextInput holds it
  });

  it('PATCHes the account and refreshes the session on Save', async () => {
    const { navigation } = await renderEdit();

    await act(async () =>
      fireEvent.changeText(screen.getByDisplayValue('Zakaria Lounes'), 'Zakaria L')
    );
    await act(async () => fireEvent.press(screen.getByLabelText('Save')));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(
        { fullName: 'Zakaria L', agencyName: '16 real estate', photo: '' },
        'tok'
      )
    );
    expect(updateUser).toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
