import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { fetchMyProperties, fetchMyLeads } from '../api/auth';
import PropertyListScreen from '../screens/PropertyListScreen';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/auth', () => ({
  fetchMyProperties: jest.fn(),
  fetchMyLeads: jest.fn(),
}));
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return { ...actual, useFocusEffect: (cb) => React.useEffect(() => cb(), []) };
});

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();

const PROPERTIES = [
  { id: '1', title: 'Hydra villa', type: 'Villa', listingType: 'Sell', price: 28000000, neighborhood: 'Hydra', createdAt: ago(3) },
  { id: '2', title: 'Kouba flat', type: 'Apartment', listingType: 'Rent', price: 60000, neighborhood: 'Kouba', createdAt: ago(26) },
  { id: '3', title: 'Old plot', type: 'Land', listingType: 'Sell', price: 4000000, neighborhood: 'Birtouta', createdAt: ago(45) },
];

const press = (label) => act(async () => fireEvent.press(screen.getByLabelText(label)));

async function renderList() {
  const navigate = jest.fn();
  const navigation = { navigate, getParent: jest.fn(() => ({ navigate: jest.fn() })) };
  await render(
    <LanguageProvider>
      <PropertyListScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigate };
}

describe('<PropertyListScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ token: 'tok' });
    fetchMyProperties.mockResolvedValue({ properties: PROPERTIES });
    fetchMyLeads.mockResolvedValue({
      leads: [
        { propertyId: '1', buyerPhone: '+213770000001', createdAt: ago(1) },
        { propertyId: '1', buyerPhone: '+213770000002', createdAt: ago(2) },
      ],
    });
  });

  it('lists the seller listings with price, a status badge and the favourites count', async () => {
    await renderList();

    await screen.findByText('Hydra villa');
    expect(screen.getByText('28,000,000 DZD')).toBeTruthy();
    expect(screen.getByText('60,000 DZD/mo')).toBeTruthy();

    // status is derived from the 30-day lifespan
    expect(screen.getByText('Active')).toBeTruthy(); // 3 days old
    expect(screen.getByText('Expiring in 4d')).toBeTruthy(); // 26 days old
    expect(screen.getByText('Expired')).toBeTruthy(); // 45 days old

    // 2 leads for listing 1 → "2 interested buyers"
    expect(screen.getByText(/2 interested buyers/)).toBeTruthy();
    expect(screen.getAllByText(/0 interested buyers/).length).toBe(2);
  });

  it('filters by search term (title or neighbourhood)', async () => {
    await renderList();
    await screen.findByText('Hydra villa');

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Search your listings'), 'kouba'));

    expect(screen.getByText('Kouba flat')).toBeTruthy();
    expect(screen.queryByText('Hydra villa')).toBeNull();
    expect(screen.queryByText('Old plot')).toBeNull();
  });

  it('filters by property type through the filter sheet', async () => {
    await renderList();
    await screen.findByText('Hydra villa');

    await press('Filter listings');
    await press('Land'); // property-type chip
    await press('Apply filters');

    await waitFor(() => expect(screen.queryByText('Hydra villa')).toBeNull());
    expect(screen.getByText('Old plot')).toBeTruthy();
    expect(screen.queryByText('Kouba flat')).toBeNull();
  });

  it('filters by status through the filter sheet', async () => {
    await renderList();
    await screen.findByText('Hydra villa');

    await press('Filter listings');
    await press('Expired');
    await press('Apply filters');

    await waitFor(() => expect(screen.queryByText('Hydra villa')).toBeNull());
    expect(screen.getByText('Old plot')).toBeTruthy();
  });

  it('opens the detail screen when a row is tapped', async () => {
    const { navigate } = await renderList();
    await screen.findByText('Hydra villa');

    await press('Hydra villa');

    expect(navigate).toHaveBeenCalledWith('PropertyDetail', {
      property: expect.objectContaining({ id: '1' }),
    });
  });

  it('shows an empty state with a post CTA for a seller with no listings', async () => {
    fetchMyProperties.mockResolvedValue({ properties: [] });
    fetchMyLeads.mockResolvedValue({ leads: [] });

    await renderList();

    await screen.findByText('No listings yet');
    expect(screen.getByText('Post a listing')).toBeTruthy();
  });

  it('surfaces a retry on load failure', async () => {
    fetchMyProperties.mockRejectedValue(new Error('network down'));
    fetchMyLeads.mockRejectedValue(new Error('network down'));

    await renderList();

    await screen.findByText("Couldn't load your listings");
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
