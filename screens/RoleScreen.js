import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

function RoleCard({ title, description, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#b4b2a9" />
    </TouchableOpacity>
  );
}

// "Who are you?", the Individual vs Agency choice. It picks which fields show
// on the "Complete your profile" step, so it's carried forward in the
// navigation params as accountType.
export default function RoleScreen({ navigation }) {
  const { t } = useLanguage();
  const pitch = [t('role.pitch1'), t('role.pitch2'), t('role.pitch3')];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('role.title')}</Text>
        <Text style={styles.subtitle}>{t('role.subtitle')}</Text>

        <RoleCard
          title={t('role.individualTitle')}
          description={t('role.individualDescription')}
          onPress={() => navigation.navigate('SignupPhone', { accountType: 'individual' })}
        />
        <RoleCard
          title={t('role.agencyTitle')}
          description={t('role.agencyDescription')}
          onPress={() => navigation.navigate('SignupPhone', { accountType: 'agency' })}
        />

        <View style={styles.pitch}>
          <Text style={styles.pitchTitle}>{t('role.pitchTitle')}</Text>
          {pitch.map((line) => (
            <View key={line} style={styles.pitchRow}>
              <Ionicons name="checkmark" size={14} color="#3a7a48" />
              <Text style={styles.pitchText}>{line}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>{t('role.haveAccount')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.getParent('root')?.navigate('Main', { screen: 'Explore' })}
          accessibilityRole="button"
        >
          <Text style={styles.linkMuted}>{t('role.switchToBrowsing')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardText: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1c' },
  cardDescription: { fontSize: 13, color: '#5f5e5a', marginTop: 2 },
  pitch: {
    backgroundColor: '#eef7e0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  pitchTitle: { fontSize: 14, fontWeight: '700', color: '#1c1c1c', marginBottom: 8 },
  pitchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pitchText: { fontSize: 13, color: '#3a7a48', marginLeft: 8 },
  link: { alignItems: 'center', paddingVertical: 10 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
  linkMuted: { fontSize: 14, color: '#8a8878' },
});
