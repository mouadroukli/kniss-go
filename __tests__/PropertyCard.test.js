import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import PropertyCard from '../components/PropertyCard';

// Week 9: render an actual component and assert on the output (incl. a
// snapshot). PropertyCard is a good target: it's driven entirely by props
// and it reads the favorites context, so it also exercises that wiring.

const PROPERTY = {
  id: '1',
  type: 'Apartment',
  title: 'Appartement F3',
  price: 14000000,
  listingType: 'Sell',
  area: 128,
  rooms: 4,
  distance: 40,
};

function renderCard(props) {
  return render(
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <PropertyCard property={PROPERTY} onPress={() => {}} {...props} />
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

describe('<PropertyCard />', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('renders the price, title and meta line from its props', async () => {
    await renderCard();

    expect(screen.getByText('14,000,000 DZD')).toBeTruthy();
    expect(screen.getByText('Appartement F3')).toBeTruthy();
    expect(screen.getByText('128 m² · 4 rooms · 40m away')).toBeTruthy();
  });

  it('appends /mo to the price for a rental', async () => {
    await renderCard({ property: { ...PROPERTY, listingType: 'Rent', price: 45000 } });

    expect(screen.getByText('45,000 DZD/mo')).toBeTruthy();
  });

  it('calls onPress when the card body is tapped', async () => {
    const onPress = jest.fn();
    await renderCard({ onPress });

    fireEvent.press(screen.getByText('Appartement F3'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('prompts a signed-out visitor to log in/sign up instead of favouriting', async () => {
    await renderCard();

    fireEvent.press(screen.getByLabelText('Add to favorites'));

    // Favoriting needs a buyer account now, so nothing is saved yet.
    await waitFor(() => {
      expect(screen.getByText('Create a free account to save properties')).toBeTruthy();
    });
  });

  it('shows a type placeholder when the listing has no photo', async () => {
    await renderCard();

    expect(screen.getByText('Apartment')).toBeTruthy();
  });

  it('shows the real photo instead of the placeholder once one is set', async () => {
    await renderCard({ property: { ...PROPERTY, photoUri: 'data:image/jpeg;base64,AAA' } });

    expect(screen.queryByText('Apartment')).toBeNull();
  });

  it('matches the snapshot', async () => {
    const { toJSON } = await renderCard();

    expect(toJSON()).toMatchSnapshot();
  });
});
