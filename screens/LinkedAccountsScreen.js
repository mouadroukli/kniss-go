import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { connectGoogle } from '../api/auth';

export default function LinkedAccountsScreen() {
  const { user, token, updateUser } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const connected = !!user?.googleConnected;

  async function handleConnect() {
    setBusy(true);
    setError(null);
    try {
      const { user: updated } = await connectGoogle(token);
      await updateUser(updated);
    } catch (connectError) {
      setError(connectError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('linkedAccounts.title')}</Text>
        <Text style={styles.subtitle}>{t('linkedAccounts.subtitle')}</Text>

        <View style={styles.card}>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLeft}>
              <Ionicons name="call-outline" size={18} color="#1c1c1c" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{t('linkedAccounts.phoneNumber')}</Text>
            </View>
            <Text style={styles.rowValue}>{user?.phone}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="logo-google" size={18} color="#1c1c1c" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{t('linkedAccounts.google')}</Text>
            </View>
            {connected ? (
              <View style={styles.connectedPill}>
                <Text style={styles.connectedText}>{t('linkedAccounts.connected')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnect}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('linkedAccounts.connectA11y')}
              >
                <Text style={styles.connectText}>
                  {busy ? t('linkedAccounts.connecting') : t('linkedAccounts.connect')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.note}>{t('linkedAccounts.note')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 18, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1efe8' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#1c1c1c' },
  rowValue: { fontSize: 14, color: '#8a8878' },
  connectButton: {
    backgroundColor: '#e3f3e5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  connectText: { fontSize: 13, fontWeight: '700', color: '#3a7a48' },
  connectedPill: {
    backgroundColor: '#e3f3e5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  connectedText: { fontSize: 13, fontWeight: '700', color: '#3a7a48' },
  error: { color: '#c0453c', fontSize: 13, marginTop: 12, lineHeight: 18 },
  note: { fontSize: 12, color: '#8a8878', marginTop: 16, lineHeight: 17 },
});
