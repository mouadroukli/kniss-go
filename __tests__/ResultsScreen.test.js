import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider } from '../context/LanguageContext';
import ResultsScreen from '../screens/ResultsScreen';

// PropertyCard reads FavoritesContext, which reads AuthContext.
async function renderResults(params) {
  await render(
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ResultsScreen route={{ params }} navigation={{ navigate: jest.fn() }} />
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

describe('<ResultsScreen />', () => {
  it('shows the empty state with the radius formatted as a distance, not raw metres', async () => {
    await renderResults({ properties: [], radius: 50000 });
    expect(screen.getByText('Nothing within 50km')).toBeTruthy();
  });

  it('still shows metres for a small radius', async () => {
    await renderResults({ properties: [], radius: 500 });
    expect(screen.getByText('Nothing within 500m')).toBeTruthy();
  });

  it('lists results when there are some', async () => {
    await renderResults({
      properties: [
        { id: '1', title: 'Villa in Hydra', type: 'Villa', listingType: 'Sell', price: 1000000, area: 200, rooms: 4, distance: 2500 },
      ],
      radius: 5000,
    });
    expect(screen.getByText('Villa in Hydra')).toBeTruthy();
    expect(screen.getByText(/2.5km away/)).toBeTruthy();
  });
});
