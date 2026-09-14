import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WizardScaffold from '../components/WizardScaffold';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isOnline } from '../utils/network';
import { resetTo } from '../navigation/nav';

const MIN_LENGTH = 8;

// Last step of "Forgot password?": the phone's OTP already proved identity
// (see ForgotOtpScreen), so there's no "current password" field here either,
// same as the signed-in Update Password flow. Success signs the account in
// directly — resetTo reaches the root navigator however deep this screen is
// nested, so it drops straight into the buyer tabs or the seller dashboard,
// exactly like a normal login would.
export default function ForgotPasswordFormScreen({ navigation, route }) {
  const { phone, verificationToken } = route.params;
  const { resetPassword } = useAuth();
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
      const user = await resetPassword(phone, verificationToken, password);
      resetTo(navigation, user?.role === 'seller' ? 'Dashboard' : 'Main');
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  return (
    <WizardScaffold
      title={t('updatePasswordForm.title')}
      subtitle={t('updatePasswordForm.subtitle')}
      submitLabel={busy ? t('updatePasswordForm.submitBusy') : t('updatePasswordForm.submit')}
      submitDisabled={!password || !confirm || busy}
      onSubmit={handleSubmit}
    >
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
