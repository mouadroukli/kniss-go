import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import HelpScreen from '../screens/HelpScreen';

function renderHelp() {
  return render(
    <LanguageProvider>
      <HelpScreen />
    </LanguageProvider>
  );
}

describe('<HelpScreen />', () => {
  it('renders the FAQ with the first answer expanded', async () => {
    await renderHelp();
    expect(screen.getByText('Frequently Asked Questions')).toBeTruthy();
    expect(screen.getByText('Do I need an account to post a listing?')).toBeTruthy();
    // first item open by default
    expect(screen.getByText(/Browsing is open to everyone/)).toBeTruthy();
  });

  it('never mentions features this build does not have', async () => {
    await renderHelp();
    const forbidden = [/Boost/i, /Kniss Pro/i, /free listings per year/i, /200\s?m/i, /paid listing/i];
    forbidden.forEach((pattern) => expect(screen.queryByText(pattern)).toBeNull());
  });

  it('expands another question on tap', async () => {
    await renderHelp();
    await act(async () =>
      fireEvent.press(screen.getByLabelText('How long does a listing stay active?'))
    );
    expect(screen.getByText(/30 days from the day you post it/)).toBeTruthy();
  });
});
