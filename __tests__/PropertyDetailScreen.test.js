import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import { fetchPublicProfile } from '../api/accounts';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';

jest.mock('../api/accounts', () => ({ fetchPublicProfile: jest.fn() }));

// A Villa-shaped base record, every structure field populated. Individual
// tests switch type and check which rows the detail card actually renders.
const BASE = {
  id: '1',
  title: 'Test listing',
  description: 'A description',
  type: 'Villa',
  listingType: 'Sell',
  price: 1000000,
  priceNote: 'Fixed price',
  area: 200,
  landArea: 400,
  rooms: 3,
  parkingSpots: 2,
  features: ['Garden'],
  floors: 'G+2',
  finishing: 'Finished',
  documents: 'Notarial act',
  postedDaysAgo: 3,
  boosted: false,
  agencyName: 'Kniss Realty',
  phoneNumber: '+213555000000',
  nearby: {
    hospital: false,
    school: false,
    supermarket: false,
    mosque: false,
    busStop: false,
    gym: false,
    park: false,
  },
};

async function renderDetail(property) {
  await AsyncStorage.clear();
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <PropertyDetailScreen route={{ params: { property } }} navigation={navigation} />
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
  return { navigation };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchPublicProfile.mockRejectedValue(new Error('No account found for that number'));
});

describe('<PropertyDetailScreen /> — type-driven fields', () => {
  it('Villa: Land Area, Area, Floors, Finishing — no Rooms, no Parking Spots', async () => {
    await renderDetail(BASE);
    expect(screen.getByText('Land Area')).toBeTruthy();
    expect(screen.getByText('Area')).toBeTruthy();
    expect(screen.getByText('Floors')).toBeTruthy();
    expect(screen.getByText('Finishing')).toBeTruthy();
    expect(screen.getByText('Features')).toBeTruthy();
    expect(screen.queryByText('Rooms')).toBeNull();
    expect(screen.queryByText('Parking Spots')).toBeNull();
  });

  it('Apartment: Area, Rooms, Parking Spots, Finishing — no Land Area, no Floors', async () => {
    await renderDetail({ ...BASE, type: 'Apartment' });
    expect(screen.getByText('Area')).toBeTruthy();
    expect(screen.getByText('Rooms')).toBeTruthy();
    expect(screen.getByText('Parking Spots')).toBeTruthy();
    expect(screen.getByText('Finishing')).toBeTruthy();
    expect(screen.queryByText('Land Area')).toBeNull();
    expect(screen.queryByText('Floors')).toBeNull();
  });

  it('Commercial: Area and Finishing only among the structure rows', async () => {
    await renderDetail({ ...BASE, type: 'Commercial' });
    expect(screen.getByText('Area')).toBeTruthy();
    expect(screen.getByText('Finishing')).toBeTruthy();
    expect(screen.queryByText('Land Area')).toBeNull();
    expect(screen.queryByText('Rooms')).toBeNull();
    expect(screen.queryByText('Parking Spots')).toBeNull();
    expect(screen.queryByText('Floors')).toBeNull();
  });

  it('Land: Land Area and Utilities — no Area/Rooms/Floors/Parking/Finishing', async () => {
    await renderDetail({ ...BASE, type: 'Land', features: ['Water', 'Electricity'] });
    expect(screen.getByText('Land Area')).toBeTruthy();
    expect(screen.getByText('Utilities')).toBeTruthy();
    expect(screen.queryByText('Features')).toBeNull();
    expect(screen.queryByText('Area')).toBeNull();
    expect(screen.queryByText('Rooms')).toBeNull();
    expect(screen.queryByText('Floors')).toBeNull();
    expect(screen.queryByText('Parking Spots')).toBeNull();
    expect(screen.queryByText('Finishing')).toBeNull();
  });

  it('keeps a row whose real value is 0 (visibility is type-driven, not value-driven)', async () => {
    await renderDetail({ ...BASE, type: 'Apartment', rooms: 0, parkingSpots: 0 });
    expect(screen.getByText('Rooms')).toBeTruthy();
    expect(screen.getByText('Parking Spots')).toBeTruthy();
  });

  it('unknown legacy type falls back to showing every row', async () => {
    await renderDetail({ ...BASE, type: 'Duplex' });
    expect(screen.getByText('Land Area')).toBeTruthy();
    expect(screen.getByText('Area')).toBeTruthy();
    expect(screen.getByText('Rooms')).toBeTruthy();
    expect(screen.getByText('Floors')).toBeTruthy();
    expect(screen.getByText('Parking Spots')).toBeTruthy();
    expect(screen.getByText('Finishing')).toBeTruthy();
  });
});

describe('<PropertyDetailScreen /> — agency row / public profile tap-through', () => {
  it('shows the real owner photo once looked up by ownerId', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'seller',
      sellerType: 'agency',
      displayName: 'Kniss Realty',
      photo: 'data:image/jpeg;base64,OWNER',
      listings: [],
    });

    await renderDetail({ ...BASE, ownerId: '+213555000000' });

    await waitFor(() => expect(fetchPublicProfile).toHaveBeenCalledWith('+213555000000'));
    const image = await screen.findByTestId('agency-avatar-image');
    expect(image.props.source).toEqual({ uri: 'data:image/jpeg;base64,OWNER' });
  });

  it('navigates to the public profile when the agency row is tapped', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'seller',
      sellerType: 'agency',
      displayName: 'Kniss Realty',
      photo: null,
      listings: [],
    });

    const { navigation } = await renderDetail({ ...BASE, ownerId: '+213555000000' });

    await act(async () =>
      fireEvent.press(screen.getByLabelText('View Kniss Realty profile'))
    );

    expect(navigation.navigate).toHaveBeenCalledWith('PublicProfile', {
      phone: '+213555000000',
      excludePropertyId: '1',
    });
  });
});

describe('<PropertyDetailScreen /> — photos', () => {
  it('shows real uploaded photos instead of the placeholder', async () => {
    await renderDetail({
      ...BASE,
      photos: ['data:image/jpeg;base64,AAA', 'data:image/jpeg;base64,BBB'],
    });
    expect(screen.queryByText('Photo')).toBeNull();
  });

  it('falls back to the placeholder strip only when the listing has no photos', async () => {
    await renderDetail(BASE);
    expect(screen.getAllByText('Photo').length).toBeGreaterThan(0);
  });
});
