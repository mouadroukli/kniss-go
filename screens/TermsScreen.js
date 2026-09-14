import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

// The mockup leaves this screen blank, so a plain placeholder is enough for now.
export default function TermsScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('termsScreen.title')}</Text>
        <Text style={styles.body}>{t('termsScreen.body1')}</Text>
        <Text style={styles.body}>{t('termsScreen.body2')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1c1c', marginBottom: 12 },
  body: { fontSize: 14, color: '#5f5e5a', lineHeight: 21, marginBottom: 14 },
});
