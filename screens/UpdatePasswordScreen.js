import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CodeInput from '../components/CodeInput';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { requestOtp, verifyOtp } from '../api/auth';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone || '';
  return `${phone.slice(0, 4)} •• •• ${phone.slice(-2)}`;
}

// Step 1 of the password change: confirm identity with a code sent to the
// account's own number. There's no "current password" field, the code is
// the check.
export default function UpdatePasswordScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    requestOtp(user.phone, 'whatsapp').catch((requestError) => setError(requestError.message));
  }, [user.phone]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const { verificationToken } = await verifyOtp(user.phone, code);
      navigation.navigate('UpdatePasswordForm', { verificationToken });
    } catch (verifyError) {
      setError(verifyError.message);
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await requestOtp(user.phone, 'whatsapp');
      setCode('');
      setSeconds(RESEND_SECONDS);
    } catch (resendError) {
      setError(resendError.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('updatePasswordOtp.title')}</Text>
        <Text style={styles.subtitle}>
          {t('updatePasswordOtp.subtitle', { phone: maskPhone(user.phone) })}
        </Text>

        <CodeInput value={code} onChange={setCode} length={CODE_LENGTH} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primary, (busy || code.length < CODE_LENGTH) && styles.primaryDisabled]}
          onPress={handleVerify}
          disabled={busy || code.length < CODE_LENGTH}
          accessibilityRole="button"
          accessibilityLabel={t('common.verify')}
        >
          <Text style={styles.primaryText}>{busy ? t('common.verifying') : t('common.verify')}</Text>
        </TouchableOpacity>

        <Text style={styles.resend}>
          {seconds > 0 ? (
            t('common.resendPrompt', { seconds: String(seconds).padStart(2, '0') })
          ) : (
            <Text style={styles.resendLink} onPress={handleResend}>
              {t('common.resendCode')}
            </Text>
          )}
        </Text>

        <View style={styles.devHint}>
          <Text style={styles.devHintText}>{t('common.devHint')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, lineHeight: 18 },
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
  resend: { fontSize: 13, color: '#8a8878', marginTop: 16, textAlign: 'center' },
  resendLink: { color: '#1c1c1c', fontWeight: '700' },
  devHint: { backgroundColor: '#f7f6f1', borderRadius: 8, padding: 12, marginTop: 20 },
  devHintText: { fontSize: 12, color: '#8a8878', lineHeight: 17 },
});
