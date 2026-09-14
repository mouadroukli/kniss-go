import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { requestOtp } from '../api/auth';
import { isOnline } from '../utils/network';
import { isValidAlgerianPhone, normalizePhone } from '../utils/phone';

export default function UpdatePhoneScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [newPhone, setNewPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const valid = isValidAlgerianPhone(newPhone);
  const sameAsCurrent = valid && normalizePhone(newPhone) === user?.phone;
  const showHint = newPhone.trim().length > 0 && !valid;

  async function send(channel) {
    setBusy(true);
    setError(null);
    try {
      if (sameAsCurrent) {
        throw new Error(t('updatePhone.errorSame'));
      }
      if (!(await isOnline())) {
        throw new Error(t('updatePhone.offlineError'));
      }
      const trimmed = newPhone.trim();
      await requestOtp(trimmed, channel);
      navigation.navigate('UpdatePhoneCode', { newPhone: trimmed, channel });
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('updatePhone.title')}</Text>
        <Text style={styles.subtitle}>{t('updatePhone.subtitle')}</Text>

        <Text style={styles.label}>{t('updatePhone.currentLabel')}</Text>
        <View style={styles.readonly}>
          <Text style={styles.readonlyText}>{user?.phone}</Text>
        </View>

        <Text style={styles.label}>{t('updatePhone.newLabel')}</Text>
        <TextInput
          style={styles.input}
          value={newPhone}
          onChangeText={setNewPhone}
          placeholder="0550 11 22 33"
          keyboardType="phone-pad"
          autoFocus
        />
        {showHint ? <Text style={styles.hint}>{t('updatePhone.hint')}</Text> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primary, (!valid || busy) && styles.primaryDisabled]}
          onPress={() => send('whatsapp')}
          disabled={!valid || busy}
          accessibilityRole="button"
          accessibilityLabel={t('updatePhone.sendWhatsapp')}
        >
          <Text style={styles.primaryText}>
            {busy ? t('updatePhone.sending') : t('updatePhone.sendWhatsapp')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => send('sms')}
          disabled={!valid || busy}
          accessibilityRole="button"
          accessibilityLabel={t('updatePhone.sendSms')}
        >
          <Text style={styles.secondaryText}>{t('updatePhone.sendSms')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 8, lineHeight: 18 },
  label: { fontSize: 13, color: '#5f5e5a', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1c1c',
  },
  readonly: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f7f6f1',
  },
  readonlyText: { fontSize: 15, color: '#8a8878' },
  hint: { fontSize: 12, color: '#8a8878', marginTop: 8, lineHeight: 17 },
  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },
  primary: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryDisabled: { backgroundColor: '#d3d1c7' },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondary: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  secondaryText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
});
