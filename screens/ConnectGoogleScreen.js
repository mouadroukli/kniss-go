import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resetTo } from '../navigation/nav';

// Visual completeness only. There's no real OAuth: "Connect" just flips a
// fake badge, and both "Continue" and "Skip" drop the user into their world.
// The account already exists by this point, so a buyer lands on the buyer
// tabs and a seller on the dashboard.
export default function ConnectGoogleScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [connected, setConnected] = useState(false);

  function proceed() {
    resetTo(navigation, user?.role === 'seller' ? 'Dashboard' : 'Main');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('connectGoogle.title')}</Text>
        <Text style={styles.subtitle}>{t('connectGoogle.subtitle')}</Text>

        <View style={styles.googleRow}>
          <View style={styles.googleLeft}>
            <Ionicons name="logo-google" size={20} color="#1c1c1c" />
            <Text style={styles.googleText}>{t('connectGoogle.google')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.connectButton, connected && styles.connectButtonDone]}
            onPress={() => setConnected(true)}
            accessibilityRole="button"
          >
            <Text style={styles.connectText}>
              {connected ? t('connectGoogle.connected') : t('connectGoogle.connect')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primary}
          onPress={proceed}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{t('connectGoogle.continue')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={proceed} accessibilityRole="button">
          <Text style={styles.skipText}>{t('connectGoogle.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 24 },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  googleLeft: { flexDirection: 'row', alignItems: 'center' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#1c1c1c', marginLeft: 10 },
  connectButton: {
    backgroundColor: '#c8ec4a',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  connectButtonDone: { backgroundColor: '#eef7e0' },
  connectText: { fontSize: 13, fontWeight: '700', color: '#1c1c1c' },
  primary: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#8a8878' },
});
