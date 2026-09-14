import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import RadiusPickerScreen from '../screens/RadiusPickerScreen';

const tap = (label) => act(async () => fireEvent.press(screen.getByLabelText(label)));
const tapText = (text) => act(async () => fireEvent.press(screen.getByText(text)));

async function renderPicker() {
  const navigation = { navigate: jest.fn() };
  await render(
    <LanguageProvider>
      <RadiusPickerScreen navigation={navigation} />
    </LanguageProvider>
  );
  return { navigation };
}

describe('<RadiusPickerScreen />', () => {
  it('defaults to a 2km radius and advertises the 50km ceiling', async () => {
    await renderPicker();
    expect(screen.getByText('2km')).toBeTruthy();
    expect(screen.getByText('Set your radius, up to 50km')).toBeTruthy();
  });

  it('moving the slider updates the shown radius, in km once past 1000m', async () => {
    await renderPicker();
    // RADIUS_STEPS_M = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, ...]
    // index 8 -> 5000m
    await act(async () =>
      fireEvent(screen.getByLabelText('Search radius'), 'valueChange', 8)
    );
    expect(screen.getByText('5km')).toBeTruthy();
  });

  it('starts on "current location" and lets Explore proceed with no neighbourhood chosen', async () => {
    const { navigation } = await renderPicker();
    expect(screen.getByLabelText('Start exploring').props.accessibilityState.disabled).toBe(false);

    await tap('Start exploring');

    expect(navigation.navigate).toHaveBeenCalledWith('Scanning', {
      radius: 2000,
      locationMode: 'current',
      neighborhood: undefined,
    });
  });

  it('gates Explore on picking a neighbourhood once that mode is chosen', async () => {
    await renderPicker();

    await tap('Choose a neighborhood');
    expect(screen.getByLabelText('Start exploring').props.accessibilityState.disabled).toBe(true);

    await tap('Neighborhood'); // opens the dropdown
    await tapText('Hydra');

    await waitFor(() =>
      expect(screen.getByLabelText('Start exploring').props.accessibilityState.disabled).toBe(
        false
      )
    );
  });

  it('sends the chosen neighbourhood through to the scan', async () => {
    const { navigation } = await renderPicker();

    await tap('Choose a neighborhood');
    await tap('Neighborhood');
    await tapText('Hydra');
    await tap('Start exploring');

    expect(navigation.navigate).toHaveBeenCalledWith('Scanning', {
      radius: 2000,
      locationMode: 'neighborhood',
      neighborhood: 'Hydra',
    });
  });

  it('switching back to current location clears the chosen neighbourhood', async () => {
    const { navigation } = await renderPicker();

    await tap('Choose a neighborhood');
    await tap('Neighborhood');
    await tapText('Hydra');
    await tap('Use my current location');
    await tap('Start exploring');

    expect(navigation.navigate).toHaveBeenCalledWith('Scanning', {
      radius: 2000,
      locationMode: 'current',
      neighborhood: undefined,
    });
  });
});
