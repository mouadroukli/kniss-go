import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WizardScaffold from '../components/WizardScaffold';
import CodeInput from '../components/CodeInput';
import { useLanguage } from '../context/LanguageContext';
import { requestOtp, verifyOtp } from '../api/auth';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone || '';
  return `${phone.slice(0, 4)} •• •• ${phone.slice(-2)}`;
}

// Second step of "Forgot password?": the same 6-digit code flow as sign-up
// (OtpScreen) and the signed-in Update Password screen, just reached with
// no session. Verifying hands back a verificationToken, spent at the final
// step (ForgotPasswordFormScreen) to actually set the new password.
export default function ForgotOtpScreen({ navigation, route }) {
  const { phone, channel } = route.params;
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const { verificationToken } = await verifyOtp(phone, code);
      navigation.navigate('ForgotPasswordForm', { phone, verificationToken });
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await requestOtp(phone, channel);
      setCode('');
      setSeconds(RESEND_SECONDS);
    } catch (resendError) {
      setError(resendError.message);
    }
  }

  return (
    <WizardScaffold
      title={t('signupOtp.title')}
      subtitle={t(
        channel === 'sms' ? 'signupOtp.subtitlePhone' : 'signupOtp.subtitleWhatsapp',
        { phone: maskPhone(phone) }
      )}
      submitLabel={busy ? t('common.verifying') : t('common.verify')}
      submitDisabled={busy || code.length < CODE_LENGTH}
      onSubmit={handleVerify}
    >
      <CodeInput value={code} onChange={setCode} length={CODE_LENGTH} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
    </WizardScaffold>
  );
}

const styles = StyleSheet.create({
  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },
  resend: { fontSize: 13, color: '#8a8878', marginTop: 16, textAlign: 'center' },
  resendLink: { color: '#1c1c1c', fontWeight: '700' },
  devHint: { backgroundColor: '#f7f6f1', borderRadius: 8, padding: 12, marginTop: 20 },
  devHintText: { fontSize: 12, color: '#8a8878', lineHeight: 17 },
});
