import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkState } from 'expo-network';
import { useLanguage } from '../context/LanguageContext';

// A thin always-on-top strip shown only while the device is genuinely
// offline. useNetworkState keeps a listener running and re-renders on change,
// so the banner appears and clears on its own. Rendered once at the app root,
// above the navigator.
export default function OfflineBanner() {
  const { t } = useLanguage();
  const network = useNetworkState();

  // Undefined while the first reading is still pending, so don't flash the
  // banner during startup: only show it once we're sure we're offline.
  const isOffline =
    network.isConnected === false || network.isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.text}>{t('common.offline')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c0453c',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
