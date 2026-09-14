import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import { fetchPublicProfile } from '../api/accounts';
import PublicProfileScreen from '../screens/PublicProfileScreen';

jest.mock('../api/accounts', () => ({ fetchPublicProfile: jest.fn() }));

async function renderProfile(params) {
  const navigation = { push: jest.fn() };
  await render(
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <PublicProfileScreen route={{ params }} navigation={navigation} />
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
  return { navigation };
}

describe('<PublicProfileScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an agency profile with its display name, type and active listings', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'seller',
      sellerType: 'agency',
      displayName: 'Kniss Realty',
      photo: null,
      listings: [
        { id: '2', title: 'Villa avec jardin', type: 'Villa', listingType: 'Sell', price: 28500000, area: 210, rooms: 5 },
        { id: '4', title: 'Local commercial', type: 'Commercial', listingType: 'Rent', price: 80000, area: 95, rooms: 0 },
      ],
    });

    await renderProfile({ phone: '+213555000000' });

    await screen.findByText('Kniss Realty');
    expect(screen.getByText('Agency')).toBeTruthy();
    expect(screen.getByText('Villa avec jardin')).toBeTruthy();
    expect(screen.getByText('Local commercial')).toBeTruthy();
  });

  it('excludes the listing the viewer came from', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'seller',
      sellerType: 'individual',
      displayName: 'Amina Bensalem',
      photo: null,
      listings: [
        { id: '3', title: 'Studio meublé', type: 'Apartment', listingType: 'Rent', price: 45000, area: 42, rooms: 1 },
      ],
    });

    await renderProfile({ phone: '+213550000001', excludePropertyId: '3' });

    await screen.findByText('Amina Bensalem');
    expect(screen.getByText('No other active listings')).toBeTruthy();
    expect(screen.queryByText('Studio meublé')).toBeNull();
  });

  it('shows a buyer profile with no listings section at all', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'buyer',
      sellerType: null,
      displayName: 'Sami Amrani',
      photo: null,
      listings: [],
    });

    await renderProfile({ phone: '+213561000001' });

    await screen.findByText('Sami Amrani');
    expect(screen.getByText('Buyer')).toBeTruthy();
    expect(screen.queryByText('Other listings')).toBeNull();
    expect(screen.queryByText('No other active listings')).toBeNull();
  });

  it('opens a listing on tap via navigation.push, not navigate', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'seller',
      sellerType: 'agency',
      displayName: 'Kniss Realty',
      photo: null,
      listings: [
        { id: '2', title: 'Villa avec jardin', type: 'Villa', listingType: 'Sell', price: 28500000, area: 210, rooms: 5 },
      ],
    });

    const { navigation } = await renderProfile({ phone: '+213555000000' });
    await screen.findByText('Villa avec jardin');

    await act(async () => fireEvent.press(screen.getByText('Villa avec jardin')));

    expect(navigation.push).toHaveBeenCalledWith(
      'PropertyDetail',
      expect.objectContaining({ property: expect.objectContaining({ id: '2' }) })
    );
  });

  it('shows a plain error message when the account cannot be found', async () => {
    fetchPublicProfile.mockRejectedValue(new Error('No account found for that number'));

    await renderProfile({ phone: '+213500000000' });

    await waitFor(() =>
      expect(screen.getByText('No account found for that number')).toBeTruthy()
    );
  });
});
