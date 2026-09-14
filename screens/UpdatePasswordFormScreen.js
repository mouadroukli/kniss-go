import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { changePassword } from '../api/auth';
import { isOnline } from '../utils/network';

const MIN_LENGTH = 8;

// Step 2 of the password change: identity was already confirmed by the code.
export default function UpdatePasswordFormScreen({ navigation, route }) {
  const { verificationToken } = route.params;
  const { token } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (password.length < MIN_LENGTH) {
      setError(t('updatePasswordForm.errorMinLength', { min: MIN_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t('updatePasswordForm.errorMismatch'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!(await isOnline())) {
        throw new Error(t('updatePasswordForm.offlineError'));
      }
      await changePassword(password, verificationToken, token);
      navigation.replace('UpdateSuccess', { kind: 'password' });
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('updatePasswordForm.title')}</Text>
        <Text style={styles.subtitle}>{t('updatePasswordForm.subtitle')}</Text>

        <Text style={styles.label}>{t('updatePasswordForm.newPasswordLabel')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            placeholder={t('signupPassword.setPlaceholder')}
          />
          <TouchableOpacity onPress={() => setShow((s) => !s)} accessibilityRole="button">
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8a8878" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('updatePasswordForm.confirmLabel')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!show}
            placeholder={t('signupPassword.confirmPlaceholder')}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primary, (!password || !confirm || busy) && styles.primaryDisabled]}
          onPress={handleSubmit}
          disabled={!password || !confirm || busy}
          accessibilityRole="button"
          accessibilityLabel={t('updatePasswordForm.submit')}
        >
          <Text style={styles.primaryText}>
            {busy ? t('updatePasswordForm.submitBusy') : t('updatePasswordForm.submit')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, lineHeight: 18 },
  label: { fontSize: 13, color: '#5f5e5a', marginTop: 16, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1c1c1c' },
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
});
