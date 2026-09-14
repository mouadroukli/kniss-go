import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { LanguageProvider } from '../context/LanguageContext';
import PhotoGallery from '../components/PhotoGallery';

function renderGallery(props) {
  return render(
    <LanguageProvider>
      <PhotoGallery {...props} />
    </LanguageProvider>
  );
}

// The gallery has to tell "this listing has real uploaded photos" apart from
// "this listing has none" (seed data, older simple listings), and when there
// are several it has to make the extras reachable with a hero image plus a
// tappable thumbnail strip.
describe('<PhotoGallery />', () => {
  it('shows the placeholder block when there are no photos at all', async () => {
    await renderGallery({ photos: [], photoUri: null });
    expect(screen.getByText('Photo')).toBeTruthy();
  });

  it('shows just the hero (no thumbnail strip) for a single-photo listing', async () => {
    await renderGallery({ photos: ['data:image/jpeg;base64,AAA'] });
    expect(screen.queryByText('Photo')).toBeNull();
    expect(screen.queryByLabelText(/Photo 1 of/)).toBeNull();
  });

  it('falls back to a lone photoUri when there is no photos array', async () => {
    await renderGallery({ photoUri: 'data:image/jpeg;base64,AAA' });
    expect(screen.queryByText('Photo')).toBeNull();
  });

  it('renders one thumbnail per photo for a multi-photo listing', async () => {
    await renderGallery({ photos: ['data:a', 'data:b', 'data:c', 'data:d'] });
    expect(screen.queryByText('Photo')).toBeNull();
    expect(screen.getAllByLabelText(/^Photo \d of 4$/)).toHaveLength(4);
    expect(screen.getByLabelText('Photo 1 of 4').props.accessibilityState.selected).toBe(true);
  });

  it('tapping a thumbnail makes it the selected photo', async () => {
    await renderGallery({ photos: ['data:a', 'data:b', 'data:c'] });

    await act(async () => fireEvent.press(screen.getByLabelText('Photo 3 of 3')));

    expect(screen.getByLabelText('Photo 3 of 3').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Photo 1 of 3').props.accessibilityState.selected).toBe(false);
  });
});
