import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import WizardScaffold from '../components/WizardScaffold';
import { useLanguage } from '../context/LanguageContext';
import { requestOtp, verifyOtp } from '../api/auth';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone || '';
  return `${phone.slice(0, 4)} •• •• ${phone.slice(-2)}`;
}

// Enter the 6-digit code. One hidden TextInput drives six visible boxes (the
// usual RN trick). There's no SMS provider, so the code is printed in the
// server terminal, and the screen says so plainly rather than pretending.
export default function OtpScreen({ navigation, route }) {
  const { accountType, phone, channel } = route.params;
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

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
      navigation.navigate('SignupPassword', { accountType, phone, verificationToken });
    } catch (submitError) {
      setError(submitError.message);
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
    } catch (submitError) {
      setError(submitError.message);
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
      <Pressable style={styles.boxRow} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[styles.box, index === code.length && styles.boxActive]}
          >
            <Text style={styles.boxText}>{code[index] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        autoFocus
        accessibilityLabel={t('common.verificationCode')}
      />

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

      <TouchableOpacity
        style={styles.change}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
      >
        <Text style={styles.changeText}>{t('signupOtp.changeNumber')}</Text>
      </TouchableOpacity>
    </WizardScaffold>
  );
}

const styles = StyleSheet.create({
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  box: {
    width: 46,
    height: 54,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: '#1c1c1c' },
  boxText: { fontSize: 20, fontWeight: '700', color: '#1c1c1c' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },
  resend: { fontSize: 13, color: '#8a8878', marginTop: 16, textAlign: 'center' },
  resendLink: { color: '#1c1c1c', fontWeight: '700' },
  devHint: {
    backgroundColor: '#f7f6f1',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  devHintText: { fontSize: 12, color: '#8a8878', lineHeight: 17 },
  change: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  changeText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
});
