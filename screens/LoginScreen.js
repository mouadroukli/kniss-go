import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RadarPulse from '../components/RadarPulse';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isOnline } from '../utils/network';
import { isValidAlgerianPhone } from '../utils/phone';
import { resetTo } from '../navigation/nav';

// "I already have an account". Phone and password, checked against the
// Express accounts. The Google button is a visual stub like the sign-up
// flow's, it just proceeds. "Forgot password?" hands off to
// ForgotPasswordStack, carrying over whatever's already typed here.
//
// route.params.intent === 'buyer' arrives from the favourite prompt's
// "Log in / Sign up" button (see FavoritesContext): a visitor with no account
// who lands here should go straight into buyer sign-up, skipping the
// buyer-vs-seller fork.
export default function LoginScreen({ navigation, route }) {
  const intent = route?.params?.intent;
  const { login } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Same check the sign-up flow uses. A number that can't be a real Algerian
  // phone can't match any account, so block the request rather than let the
  // server bounce it with a vague "wrong phone or password".
  const phoneValid = isValidAlgerianPhone(phone);
  const showFormatHint = phone.trim().length > 0 && !phoneValid;

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      if (!(await isOnline())) {
        throw new Error(t('login.offlineError'));
      }
      const loggedInUser = await login(phone.trim(), password);
      // Sellers land on their dashboard; a buyer account lands back in the
      // buyer tabs, since an account was never meant to gate browsing, just
      // to give favourites a real, persistent identity.
      resetTo(navigation, loggedInUser?.role === 'seller' ? 'Dashboard' : 'Main');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <RadarPulse active={false} />
        </View>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        <Text style={styles.label}>{t('login.phoneLabel')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="0550 11 22 33"
          keyboardType="phone-pad"
          autoFocus
        />
        {showFormatHint ? <Text style={styles.hint}>{t('login.phoneHint')}</Text> : null}

        <Text style={styles.label}>{t('login.passwordLabel')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            placeholder={t('login.passwordPlaceholder')}
          />
          <TouchableOpacity onPress={() => setShow((s) => !s)} accessibilityRole="button">
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8a8878" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotWrap}
          onPress={() => navigation.navigate('ForgotPassword', { screen: 'ForgotPhone', params: { phone: phone.trim() } })}
          accessibilityRole="button"
        >
          <Text style={styles.forgot}>{t('login.forgot')}</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primary, (busy || !phoneValid) && styles.primaryDisabled]}
          onPress={handleSubmit}
          disabled={busy || !phoneValid}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{busy ? t('login.submitBusy') : t('login.submit')}</Text>
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.hr} />
          <Text style={styles.or}>{t('login.or')}</Text>
          <View style={styles.hr} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => resetTo(navigation, 'Dashboard')}
          accessibilityRole="button"
          accessibilityLabel={t('login.google')}
        >
          <Ionicons name="logo-google" size={18} color="#1c1c1c" />
          <Text style={styles.googleText}>{t('login.google')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.noAccount}
          onPress={() =>
            intent === 'buyer'
              ? navigation.replace('Onboarding', { screen: 'SignupPhone', params: { accountType: 'buyer' } })
              : navigation.replace('Onboarding')
          }
          accessibilityRole="button"
        >
          <Text style={styles.noAccountText}>{t('login.noAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  brand: { alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c', textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: '#8a8878',
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
  },
  label: { fontSize: 13, color: '#5f5e5a', marginTop: 14, marginBottom: 6 },
  hint: { color: '#8a8878', fontSize: 12, marginTop: 8, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1c1c',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1c1c1c' },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8 },
  forgot: { fontSize: 13, color: '#1c1c1c', fontWeight: '600' },
  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },
  primary: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryDisabled: { backgroundColor: '#d3d1c7' },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  hr: { flex: 1, height: 1, backgroundColor: '#f1efe8' },
  or: { marginHorizontal: 12, fontSize: 12, color: '#8a8878' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 28,
    paddingVertical: 14,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: '#1c1c1c', marginLeft: 8 },
  noAccount: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  noAccountText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
});
