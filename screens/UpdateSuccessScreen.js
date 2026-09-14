import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const COPY_KEYS = {
  phone: { titleKey: 'updateSuccess.phoneTitle', messageKey: 'updateSuccess.phoneMessage' },
  password: { titleKey: 'updateSuccess.passwordTitle', messageKey: 'updateSuccess.passwordMessage' },
};

export default function UpdateSuccessScreen({ navigation, route }) {
  const { kind } = route.params;
  const { t } = useLanguage();
  const copy = COPY_KEYS[kind] || COPY_KEYS.phone;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={30} color="#1c1c1c" />
        </View>
        <Text style={styles.title}>{t(copy.titleKey)}</Text>
        <Text style={styles.message}>{t(copy.messageKey)}</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}
        accessibilityRole="button"
        accessibilityLabel={t('updateSuccess.goToSettings')}
      >
        <Text style={styles.buttonText}>{t('updateSuccess.goToSettings')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'space-between',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#c8ec4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1c1c',
    textAlign: 'center',
    marginTop: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5f5e5a',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
