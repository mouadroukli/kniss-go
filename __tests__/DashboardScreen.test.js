import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { fetchMyProperties, fetchMyLeads } from '../api/auth';
import { fetchPublicProfile } from '../api/accounts';
import DashboardScreen from '../screens/DashboardScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({
  fetchMyProperties: jest.fn(),
  fetchMyLeads: jest.fn(),
}));
jest.mock('../api/accounts', () => ({ fetchPublicProfile: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actual,
    // run the focus callback once on mount
    useFocusEffect: (cb) => React.useEffect(() => cb(), []),
  };
});
// PropertyCard pulls in FavoritesContext; stub it to a plain view.
jest.mock('../components/PropertyCard', () => {
  const { Text } = require('react-native');
  return function MockPropertyCard({ property }) {
    return <Text>{property.title}</Text>;
  };
});

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();

async function renderDashboard() {
  const navigation = { navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <DashboardScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<DashboardScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      token: 'tok',
      user: { fullName: 'Zakaria Lounis', displayName: 'Kniss Realty' },
    });
    // No matching account by default: a lead is just a phone number unless
    // a test says otherwise.
    fetchPublicProfile.mockRejectedValue(new Error('No account found for that number'));
  });

  it('shows the name, real stat counts, an expiring listing and a lead', async () => {
    fetchMyProperties.mockResolvedValue({
      properties: [
        { id: '1', title: 'Appartement F3', price: 14000000, listingType: 'Sell', area: 128, rooms: 4, type: 'Apartment', createdAt: ago(28) },
        { id: '4', title: 'Local commercial', price: 80000, listingType: 'Rent', area: 95, rooms: 0, type: 'Commercial', createdAt: ago(3) },
      ],
    });
    fetchMyLeads.mockResolvedValue({
      leads: [
        { propertyId: '1', propertyTitle: 'Appartement F3', buyerPhone: '+213770112233', createdAt: ago(2) },
      ],
    });

    await renderDashboard();

    await screen.findByText('Zakaria Lounis');
    expect(screen.getByTestId('stat-active-listings').props.children).toBe(2);
    expect(screen.getByTestId('stat-interested-buyers').props.children).toBe(1);
    expect(screen.getByText('Expiring in 2d')).toBeTruthy();
    // No name on file for this lead, so it falls back to the phone number.
    expect(screen.getByText('+213770112233')).toBeTruthy();
    expect(screen.getByText('Local commercial')).toBeTruthy(); // in "your properties"
  });

  it('shows the buyer\'s name (not just a bare phone number) when one was given', async () => {
    fetchMyProperties.mockResolvedValue({
      properties: [
        { id: '1', title: 'Appartement F3', price: 14000000, listingType: 'Sell', area: 128, rooms: 4, type: 'Apartment', createdAt: ago(28) },
      ],
    });
    fetchMyLeads.mockResolvedValue({
      leads: [
        {
          propertyId: '1',
          propertyTitle: 'Appartement F3',
          buyerPhone: '+213770112233',
          buyerName: 'Sami Amrani',
          createdAt: ago(2),
        },
      ],
    });

    await renderDashboard();

    await screen.findByText('Sami Amrani');
    expect(screen.getByText(/\+213770112233 · Interested in Appartement F3/)).toBeTruthy();
  });

  it('shows empty states and zero stats for a brand-new seller', async () => {
    fetchMyProperties.mockResolvedValue({ properties: [] });
    fetchMyLeads.mockResolvedValue({ leads: [] });

    await renderDashboard();

    await screen.findByText('Zakaria Lounis');
    expect(screen.getByTestId('stat-active-listings').props.children).toBe(0);
    expect(screen.getByText("You haven't posted anything yet.")).toBeTruthy();
    expect(
      screen.getByText('No interest yet — buyers who favourite your listings show up here.')
    ).toBeTruthy();
  });

  it('surfaces a retry on load failure', async () => {
    fetchMyProperties.mockRejectedValue(new Error('network down'));
    fetchMyLeads.mockRejectedValue(new Error('network down'));

    await renderDashboard();

    await screen.findByText("Couldn't load your dashboard");
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});

describe('<DashboardScreen /> — Interested buyers photo + tap-through', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      token: 'tok',
      user: { fullName: 'Zakaria Lounis', displayName: 'Kniss Realty' },
    });
    fetchMyProperties.mockResolvedValue({ properties: [] });
    fetchMyLeads.mockResolvedValue({
      leads: [
        {
          propertyId: '1',
          propertyTitle: 'Appartement F3',
          buyerPhone: '+213561000001',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  it('shows the real photo and opens the public profile when the lead matches a registered account', async () => {
    fetchPublicProfile.mockResolvedValue({
      role: 'buyer',
      displayName: 'Amina Buyer',
      photo: 'data:image/jpeg;base64,BUYER',
      listings: [],
    });

    const { navigation } = await renderDashboard();

    await waitFor(() => expect(fetchPublicProfile).toHaveBeenCalledWith('+213561000001'));
    const image = await screen.findByTestId('lead-avatar-image');
    expect(image.props.source).toEqual({ uri: 'data:image/jpeg;base64,BUYER' });

    await act(async () => fireEvent.press(screen.getByText('+213561000001')));
    expect(navigation.navigate).toHaveBeenCalledWith('PublicProfile', { phone: '+213561000001' });
  });

  it('keeps the generic icon and is not tappable for a lead with no matching account', async () => {
    fetchPublicProfile.mockRejectedValue(new Error('No account found for that number'));

    const { navigation } = await renderDashboard();

    await waitFor(() => expect(fetchPublicProfile).toHaveBeenCalledWith('+213561000001'));
    expect(screen.queryByTestId('lead-avatar-image')).toBeNull();

    await act(async () => fireEvent.press(screen.getByText('+213561000001')));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
