import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { LanguageProvider } from '../context/LanguageContext';
import PostListingWizard from '../screens/PostListingWizard';
import { createProperty } from '../api/properties';

jest.mock('../api/properties', () => ({
  createProperty: jest.fn(),
}));

const tap = (label) => act(async () => fireEvent.press(screen.getByLabelText(label)));
const tapText = (text) => act(async () => fireEvent.press(screen.getByText(text)));
const type = (placeholder, value) =>
  act(async () => fireEvent.changeText(screen.getByPlaceholderText(placeholder), value));

async function renderWizard() {
  const navigation = { navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <PostListingWizard navigation={navigation} token="tok" />
    </LanguageProvider>
  );
  return { navigation };
}

// Walks the four shared steps every type ends with (nearby → photos →
// location → review) and taps Post. Assumes the wizard is sitting on the
// "What's nearby" step.
async function finishThroughReview(neighborhood) {
  await screen.findByText("What's nearby");
  await tap('Next');
  await screen.findByText('Add property photos');
  await tap('Next');
  await screen.findByText('Location');
  await tap('Choose a neighborhood');
  await tap('Neighborhood');
  await tapText(neighborhood);
  await tap('Next');
  await screen.findByText('Review your listing');
  await tap('Post');
}

describe('<PostListingWizard />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createProperty.mockResolvedValue({
      property: {
        id: '99',
        type: 'Villa',
        title: 'Test Villa',
        price: 28000000,
        listingType: 'Sell',
        createdAt: new Date().toISOString(),
        neighborhood: 'Hydra',
      },
    });
  });

  it('gates the About step, then walks Villa end-to-end and posts the assembled payload', async () => {
    const { navigation } = await renderWizard();

    // Step 0: Sell or rent (Sell is the default)
    expect(screen.getByText('Sell or rent?')).toBeTruthy();
    await tap('Next');

    // Step 1: property type
    await tapText('Villa');
    await screen.findByText('Tell buyers about your property');

    // Step 2, About: Next is gated until title, built area and price
    expect(screen.getByLabelText('Next').props.accessibilityState.disabled).toBe(true);
    await type('e.g. Villa with garden, Hydra', 'Test Villa');
    await type('300', '400'); // land area
    await type('210', '250'); // built area
    await type('28000000', '28000000');
    await waitFor(() =>
      expect(screen.getByLabelText('Next').props.accessibilityState.disabled).toBe(false)
    );
    await tap('Next');

    // Step 3, features and documents (optional)
    await screen.findByText('Property features & documents');
    await tapText('Garden');
    await tap('Next');

    await finishThroughReview('Hydra');

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());

    const [payload, token] = createProperty.mock.calls[0];
    expect(token).toBe('tok');
    expect(payload).toMatchObject({
      listingType: 'Sell',
      type: 'Villa',
      title: 'Test Villa',
      landArea: 400,
      area: 250,
      price: 28000000,
      priceNote: 'Fixed price',
      features: ['Garden'],
      latitude: 36.7452, // Hydra
      longitude: 3.037,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('ListingPosted', {
      property: expect.objectContaining({ id: '99' }),
    });

    await act(async () => {});
  }, 20000);

  it('walks an Apartment end-to-end with its own fields (single area, rooms, parking, apartment type)', async () => {
    const { navigation } = await renderWizard();
    createProperty.mockResolvedValue({
      property: { id: '101', type: 'Apartment', title: 'Bright F3', price: 9000000, listingType: 'Sell', createdAt: new Date().toISOString() },
    });

    await tap('Next'); // 0 -> 1
    await tapText('Apartment'); // now proceeds instead of showing "coming soon"
    await screen.findByText('Tell buyers about your property');

    // Only a single "Apartment Area" field, no Land/Built split.
    expect(screen.getByPlaceholderText('120')).toBeTruthy();
    await type('e.g. Bright F3, Bab Ezzouar', 'Bright F3');
    await type('120', '95');
    await type('28000000', '9000000');
    await waitFor(() =>
      expect(screen.getByLabelText('Next').props.accessibilityState.disabled).toBe(false)
    );
    await tap('Next');

    await screen.findByText('Property features & documents');
    await tap('Apartment type');
    await tapText('3-room');
    await tap('Number of rooms');
    await tapText('3');
    await tapText('Equipped kitchen');
    await tap('Parking spots');
    await tapText('+6'); // stored as 7
    await tap('Next');

    await finishThroughReview('Kouba');

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    const [payload] = createProperty.mock.calls[0];
    expect(payload).toMatchObject({
      type: 'Apartment',
      title: 'Bright F3',
      area: 95,
      landArea: 0,
      rooms: 3,
      parkingSpots: 7,
      floors: '3-room', // apartment type reuses the floors field
      features: ['Equipped kitchen'],
      latitude: 36.7189, // Kouba
      longitude: 3.0796,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('ListingPosted', {
      property: expect.objectContaining({ id: '101' }),
    });
    await act(async () => {});
  });

  it('walks a Commercial listing — single area, no rooms/parking fields', async () => {
    await renderWizard();
    createProperty.mockResolvedValue({
      property: { id: '102', type: 'Commercial', title: 'Corner shop', price: 5000000, listingType: 'Rent', createdAt: new Date().toISOString() },
    });

    await tapText('Rent');
    await tap('Next');
    await tapText('Commercial');
    await screen.findByText('Tell buyers about your property');
    await type('e.g. Corner shop, Kouba', 'Corner shop');
    await type('120', '80');
    await type('28000000', '5000000');
    await tap('Next');

    await screen.findByText('Property features & documents');
    expect(screen.queryByLabelText('Number of rooms')).toBeNull();
    expect(screen.queryByLabelText('Parking spots')).toBeNull();
    await tapText('Terrace');
    await tap('Next');

    await finishThroughReview('El Biar');

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    const [payload] = createProperty.mock.calls[0];
    expect(payload).toMatchObject({
      type: 'Commercial',
      listingType: 'Rent',
      area: 80,
      rooms: 0,
      parkingSpots: 0,
      features: ['Terrace'],
      latitude: 36.7676, // El Biar
    });
    await act(async () => {});
  });

  it('walks a Land listing — Land Area only, utilities into features, no finishing', async () => {
    await renderWizard();
    createProperty.mockResolvedValue({
      property: { id: '103', type: 'Land', title: 'Buildable plot', price: 4000000, listingType: 'Sell', createdAt: new Date().toISOString() },
    });

    await tap('Next');
    await tapText('Land');
    await screen.findByText('Tell buyers about your property');
    await type('e.g. Buildable plot, Birtouta', 'Buildable plot');
    await type('300', '500'); // land area
    await type('28000000', '4000000');
    await tap('Next');

    await screen.findByText('Property features & documents');
    expect(screen.queryByLabelText('Finishing')).toBeNull();
    expect(screen.getByText('Utilities')).toBeTruthy();
    await tapText('Water');
    await tapText('Electricity');
    await tap('Next');

    await finishThroughReview('Birtouta');

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    const [payload] = createProperty.mock.calls[0];
    expect(payload).toMatchObject({
      type: 'Land',
      landArea: 500,
      area: 0,
      rooms: 0,
      parkingSpots: 0,
      features: ['Water', 'Electricity'],
      latitude: 36.6417, // Birtouta
    });
    expect(payload.finishing).toBeUndefined();
    await act(async () => {});
  });

  it('downscales every picked photo before adding it (guards against the 413)', async () => {
    await renderWizard();
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file://a.jpg', width: 4032, height: 3024 },
        { uri: 'file://b.jpg', width: 3024, height: 4032 },
      ],
    });

    await tap('Next'); // 0 -> 1
    await tapText('Villa'); // 1 -> 2
    await screen.findByText('Tell buyers about your property');
    await type('e.g. Villa with garden, Hydra', 'Photo Villa');
    await type('300', '400');
    await type('210', '250');
    await type('28000000', '1000000');
    await tap('Next'); // 2 -> 3 features
    await tap('Next'); // 3 -> 4 nearby
    await tap('Next'); // 4 -> 5 photos
    await screen.findByText('Add property photos');

    await tap('Add photos');

    // Both images went through expo-image-manipulator, and both landed in the
    // grid as compressed data URIs (not the raw file:// uris).
    await waitFor(() => expect(ImageManipulator.manipulate).toHaveBeenCalledTimes(2));
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file://a.jpg');
    await waitFor(() =>
      expect(screen.getByLabelText('Remove photo 1')).toBeTruthy()
    );
    expect(screen.getByLabelText('Remove photo 2')).toBeTruthy();
  });
});
