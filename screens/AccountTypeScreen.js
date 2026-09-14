import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

function TypeCard({ title, description, onPress }) {
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

// The first step of sign-up: buyer or seller, before anything else. A buyer
// has no type-specific fields to choose, so it skips straight to the phone
// step; a seller continues to RoleScreen, which still asks Individual vs
// Agency exactly as before. This screen only adds one fork above RoleScreen,
// it doesn't change what RoleScreen does.
export default function AccountTypeScreen({ navigation }) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('accountType.title')}</Text>
        <Text style={styles.subtitle}>{t('accountType.subtitle')}</Text>

        <TypeCard
          title={t('accountType.buyerTitle')}
          description={t('accountType.buyerDescription')}
          onPress={() => navigation.navigate('SignupPhone', { accountType: 'buyer' })}
        />
        <TypeCard
          title={t('accountType.sellerTitle')}
          description={t('accountType.sellerDescription')}
          onPress={() => navigation.navigate('SignupRole')}
        />

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>{t('accountType.haveAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
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
  link: { alignItems: 'center', paddingVertical: 10, marginTop: 12 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
});
