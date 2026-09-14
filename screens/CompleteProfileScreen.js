import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import WizardScaffold from '../components/WizardScaffold';
import { isOnline } from '../utils/network';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resetTo } from '../navigation/nav';

// The profile step, and where the account is actually created: the fields
// collected across the whole wizard plus these go to POST /auth/register,
// and a session comes back. Which fields show depends on the account type.
export default function CompleteProfileScreen({ navigation, route }) {
  const { accountType, verificationToken, password } = route.params;
  const { register } = useAuth();
  const { t } = useLanguage();
  const isAgency = accountType === 'agency';
  const isBuyer = accountType === 'buyer';

  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError(t('signupProfile.errorPhotoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setPhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
  }

  const canSubmit =
    fullName.trim() && (!isAgency || agencyName.trim()) && accepted && !busy;

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      if (!(await isOnline())) {
        throw new Error(t('signupProfile.offlineError'));
      }
      await register({
        verificationToken,
        accountType,
        password,
        fullName: fullName.trim(),
        agencyName: isAgency ? agencyName.trim() : undefined,
        photo: photo || undefined,
        monthlyListings: monthly ? Number(monthly) : 0,
        acceptedTerms: true,
      });
      navigation.navigate('SignupGoogle');
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  return (
    <WizardScaffold
      title={t('signupProfile.title')}
      subtitle={t('signupProfile.subtitle')}
      submitLabel={busy ? t('signupProfile.submitBusy') : t('signupProfile.submit')}
      submitDisabled={!canSubmit}
      onSubmit={handleSubmit}
    >
      <TouchableOpacity
        style={styles.avatarPick}
        onPress={handlePickPhoto}
        accessibilityRole="button"
        accessibilityLabel={t(isAgency ? 'signupProfile.addAgencyLogo' : 'signupProfile.addProfileImage')}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarEmpty}>
            <Ionicons name="add" size={26} color="#8a8878" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.avatarLabel}>
        {t(isAgency ? 'signupProfile.agencyLogoLabel' : 'signupProfile.profileImageLabel')}
      </Text>

      <Text style={styles.label}>{t('signupProfile.fullNameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t('signupProfile.fullNamePlaceholder')}
      />

      {isAgency && (
        <>
          <Text style={styles.label}>{t('signupProfile.agencyNameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={agencyName}
            onChangeText={setAgencyName}
            placeholder={t('signupProfile.agencyNamePlaceholder')}
          />
        </>
      )}

      {!isBuyer && (
        <>
          <Text style={styles.label}>{t('signupProfile.monthlyLabel')}</Text>
          <TextInput
            style={styles.input}
            value={monthly}
            onChangeText={(text) => setMonthly(text.replace(/\D/g, ''))}
            placeholder={t('signupProfile.monthlyPlaceholder')}
            keyboardType="number-pad"
          />
        </>
      )}

      <View style={styles.termsRow}>
        <Switch
          value={accepted}
          onValueChange={setAccepted}
          trackColor={{ true: '#c8ec4a', false: '#d3d1c7' }}
          thumbColor="#ffffff"
          accessibilityLabel={t('signupProfile.termsA11y')}
        />
        <Text style={styles.termsText}>{t('signupProfile.termsText')}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </WizardScaffold>
  );
}

const styles = StyleSheet.create({
  avatarPick: { alignSelf: 'center', marginTop: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#eef0e2' },
  avatarEmpty: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f6f1',
  },
  avatarLabel: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#8a8878',
    marginTop: 8,
    marginBottom: 4,
  },
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
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  termsText: { flex: 1, fontSize: 13, color: '#5f5e5a', marginLeft: 12, lineHeight: 18 },
  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },
});
