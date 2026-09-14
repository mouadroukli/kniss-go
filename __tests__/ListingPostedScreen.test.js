import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import ListingPostedScreen from '../screens/ListingPostedScreen';

const PROPERTY = {
  id: '99',
  type: 'Villa',
  title: 'Villa with garden',
  price: 28000000,
  listingType: 'Sell',
  neighborhood: 'Hydra',
  photoUri: 'data:image/jpeg;base64,AAA',
  createdAt: new Date().toISOString(),
};

async function renderScreen(overrides) {
  const navigate = jest.fn();
  const navigation = {
    popToTop: jest.fn(),
    getParent: jest.fn(() => ({ navigate })),
  };
  await render(
    <LanguageProvider>
      <ListingPostedScreen
        navigation={navigation}
        route={{ params: { property: { ...PROPERTY, ...overrides } } }}
      />
    </LanguageProvider>
  );
  return { navigation, navigate };
}

describe('<ListingPostedScreen />', () => {
  it('shows the live-ad card from the created property, with a real (zero) favourites count', async () => {
    await renderScreen();

    expect(screen.getByText('Your ad is now live')).toBeTruthy();
    expect(screen.getByText('28,000,000 DZD')).toBeTruthy();
    expect(screen.getByText('Hydra')).toBeTruthy();
    expect(screen.getByText('Villa')).toBeTruthy();
    expect(screen.getByText('0 favourites')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows the 30-day expiry for a brand-new listing', async () => {
    await renderScreen();
    expect(screen.getByText('Expires in 30 days.')).toBeTruthy();
  });

  it('"See my announcement" opens the new property on the dashboard', async () => {
    const { navigation, navigate } = await renderScreen();

    fireEvent.press(screen.getByText('See my announcement'));

    expect(navigation.popToTop).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('Dashboard', {
      screen: 'Home',
      params: { screen: 'PropertyDetail', params: { property: expect.objectContaining({ id: '99' }) } },
    });
  });

  it('"Return to my properties" goes to the dashboard home', async () => {
    const { navigate } = await renderScreen();

    fireEvent.press(screen.getByText('Return to my properties'));

    expect(navigate).toHaveBeenCalledWith('Dashboard', { screen: 'Home' });
  });
});
