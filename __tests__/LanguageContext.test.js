import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TouchableOpacity } from 'react-native';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

// A tiny probe screen just for exercising the context in tests.
function Probe() {
  const { language, t, setLanguage } = useLanguage();
  return (
    <>
      <Text testID="current-language">{language}</Text>
      <Text testID="translated-title">{t('settings.title')}</Text>
      <TouchableOpacity testID="switch-to-french" onPress={() => setLanguage('fr')}>
        <Text>switch</Text>
      </TouchableOpacity>
    </>
  );
}

describe('LanguageContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to English and translates known keys', async () => {
    await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-language').props.children).toBe('en');
    });
    expect(screen.getByTestId('translated-title').props.children).toBe('Settings');
  });

  it('switches language and persists the choice', async () => {
    await render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );

    await waitFor(() => screen.getByTestId('current-language'));
    await act(async () => fireEvent.press(screen.getByTestId('switch-to-french')));

    await waitFor(() => {
      expect(screen.getByTestId('translated-title').props.children).toBe('Paramètres');
    });

    const stored = await AsyncStorage.getItem('kniss_go_language');
    expect(stored).toBe('fr');
  });

  it('falls back to the key itself for an unknown translation', async () => {
    let translateFn;
    function Capture() {
      const { t } = useLanguage();
      translateFn = t;
      return null;
    }
    await render(
      <LanguageProvider>
        <Capture />
      </LanguageProvider>
    );
    expect(translateFn('not.a.real.key')).toBe('not.a.real.key');
  });

  // Arabic also flips I18nManager's RTL flag and triggers Updates.reloadAsync(),
  // which needs a real reload to prove out, so verify that path on a real
  // device rather than in this suite.
});
