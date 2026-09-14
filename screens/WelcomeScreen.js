import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarPulse from '../components/RadarPulse';
import { useLanguage } from '../context/LanguageContext';

// The app's front door. Browsing is still one lime tap with no account.
// "Log in / Sign up" leads to the login screen first, which carries its own
// "I don't have an account" link into the sign-up wizard's buyer-vs-seller
// fork (see LoginScreen/OnboardingStack) for anyone who needs to sign up.
// A signed-in seller never lands here, they open straight onto the dashboard.
export default function WelcomeScreen({ navigation }) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <RadarPulse active />
        <Text style={styles.headline}>{t('welcome.headline')}</Text>
        <Text style={styles.sub}>{t('welcome.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Main', { screen: 'Explore' })}
          accessibilityRole="button"
          accessibilityLabel={t('welcome.discover')}
        >
          <Text style={styles.primaryButtonText}>{t('welcome.discover')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel={t('welcome.loginSignup')}
        >
          <Text style={styles.secondaryButtonText}>{t('welcome.loginSignup')}</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>{t('welcome.terms')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1c1c1c',
    marginTop: 28,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f5e5a',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  actions: { paddingBottom: 8 },
  primaryButton: {
    backgroundColor: '#c8ec4a',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#1c1c1c', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d3d1c7',
  },
  secondaryButtonText: { color: '#1c1c1c', fontSize: 16, fontWeight: '600' },
  terms: {
    fontSize: 11,
    color: '#8a8878',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
