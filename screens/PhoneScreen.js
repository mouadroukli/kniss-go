import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import WizardScaffold from '../components/WizardScaffold';
import { useLanguage } from '../context/LanguageContext';
import { isOnline } from '../utils/network';
import { isValidAlgerianPhone } from '../utils/phone';
import { requestOtp } from '../api/auth';

function ChannelSheet({ visible, onCancel, onPick, busy }) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('signupPhone.channelSheetTitle')}</Text>
          <TouchableOpacity
            style={styles.sheetPrimary}
            onPress={() => onPick('whatsapp')}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.sheetPrimaryText}>{t('signupPhone.sendWhatsapp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetSecondary}
            onPress={() => onPick('sms')}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.sheetSecondaryText}>{t('signupPhone.sendSms')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Phone entry. "Continue" opens the WhatsApp/SMS choice sheet; picking a
// channel fires the OTP request and moves on. There's no real provider, so
// the channel is just passed through for the server log line.
export default function PhoneScreen({ navigation, route }) {
  const { accountType } = route.params;
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const phoneValid = isValidAlgerianPhone(phone);
  const showFormatHint = phone.trim().length > 0 && !phoneValid;

  async function handlePick(channel) {
    setBusy(true);
    setError(null);
    try {
      if (!(await isOnline())) {
        throw new Error(t('signupPhone.offlineError'));
      }
      const trimmed = phone.trim();
      await requestOtp(trimmed, channel);
      setSheetVisible(false);
      navigation.navigate('SignupOtp', { accountType, phone: trimmed, channel });
    } catch (submitError) {
      setSheetVisible(false);
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardScaffold
      title={t('signupPhone.title')}
      subtitle={t('signupPhone.subtitle')}
      submitLabel={busy ? t('signupPhone.submitBusy') : t('signupPhone.submit')}
      submitDisabled={busy || !phoneValid}
      onSubmit={() => setSheetVisible(true)}
    >
      <Text style={styles.label}>{t('signupPhone.label')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="0550 11 22 33"
        keyboardType="phone-pad"
        autoFocus
      />
      {showFormatHint ? <Text style={styles.hint}>{t('signupPhone.hint')}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ChannelSheet
        visible={sheetVisible}
        busy={busy}
        onCancel={() => setSheetVisible(false)}
        onPick={handlePick}
      />
    </WizardScaffold>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: '#5f5e5a', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1c1c',
  },
  hint: { color: '#8a8878', fontSize: 12, marginTop: 8, lineHeight: 17 },
  error: { color: '#c0453c', fontSize: 13, marginTop: 12, lineHeight: 18 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 28, 0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  sheet: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1c', marginBottom: 14 },
  sheetPrimary: {
    backgroundColor: '#1c1c1c',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetPrimaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  sheetSecondary: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sheetSecondaryText: { color: '#1c1c1c', fontSize: 15, fontWeight: '600' },
});
