import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WizardScaffold from '../components/WizardScaffold';
import { useLanguage } from '../context/LanguageContext';

const MIN_LENGTH = 8;

// Set a password. It's held in the nav params for the single hop to the
// profile step, where the account is actually created (the terms toggle
// lives there, so that's the real commit point). Nav params are in-memory
// only, nothing is persisted.
export default function PasswordScreen({ navigation, route }) {
  const { accountType, phone, verificationToken } = route.params;
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);

  function handleSubmit() {
    if (password.length < MIN_LENGTH) {
      setError(t('signupPassword.errorMinLength', { min: MIN_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t('signupPassword.errorMismatch'));
      return;
    }
    navigation.navigate('SignupProfile', { accountType, phone, verificationToken, password });
  }

  return (
    <WizardScaffold
      title={t('signupPassword.title')}
      subtitle={t('signupPassword.subtitle')}
      submitLabel={t('signupPassword.submit')}
      submitDisabled={!password || !confirm}
      onSubmit={handleSubmit}
    >
      <Text style={styles.label}>{t('signupPassword.setLabel')}</Text>
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

      <Text style={styles.label}>{t('signupPassword.confirmLabel')}</Text>
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
    </WizardScaffold>
  );
}

const styles = StyleSheet.create({
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
});
