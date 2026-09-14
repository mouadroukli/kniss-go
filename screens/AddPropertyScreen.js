import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PostListingWizard from './PostListingWizard';

// The Add tab is in both tab bars, but only seller accounts can post. Buyers
// and signed-out users get a gate that points them at the right next step;
// sellers get the posting wizard.
export default function AddPropertyScreen({ navigation }) {
  const { isAuthenticated, isSeller, user, token, logout } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return (
      <Gate
        title={t('addProperty.signInTitle')}
        message={t('addProperty.signInMessage')}
        primaryLabel={t('addProperty.createSellerAccount')}
        onPrimary={() => navigation.navigate('Onboarding')}
        secondaryLabel={t('addProperty.haveAccount')}
        onSecondary={() => navigation.navigate('Login')}
      />
    );
  }

  if (!isSeller) {
    return (
      <Gate
        title={t('addProperty.buyerAccountTitle')}
        message={t('addProperty.buyerAccountMessage', { name: user.displayName })}
        primaryLabel={t('addProperty.createSellerAccount')}
        onPrimary={async () => {
          await logout();
          navigation.navigate('Onboarding');
        }}
      />
    );
  }

  return <PostListingWizard navigation={navigation} token={token} />;
}

function Gate({ title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  // AddStack hides its header, so this gate (unlike PostListingWizard, which
  // already handles its own safe area) is the only thing standing between
  // this content and the status bar / notch.
  return (
    <SafeAreaView style={styles.gate}>
      <Text style={styles.gateTitle}>{title}</Text>
      <Text style={styles.gateMessage}>{message}</Text>
      <TouchableOpacity style={styles.gatePrimary} onPress={onPrimary} accessibilityRole="button">
        <Text style={styles.gatePrimaryText}>{primaryLabel}</Text>
      </TouchableOpacity>
      {secondaryLabel && (
        <TouchableOpacity style={styles.gateSecondary} onPress={onSecondary} accessibilityRole="button">
          <Text style={styles.gateSecondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1c',
    textAlign: 'center',
  },
  gateMessage: {
    fontSize: 14,
    color: '#5f5e5a',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  gatePrimary: {
    backgroundColor: '#c8ec4a',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  gatePrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1c',
  },
  gateSecondary: {
    marginTop: 14,
    paddingVertical: 10,
  },
  gateSecondaryText: {
    fontSize: 14,
    color: '#1c1c1c',
    fontWeight: '600',
  },
});
