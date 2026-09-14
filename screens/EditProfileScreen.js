import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateProfile } from '../api/auth';
import { isOnline } from '../utils/network';

export default function EditProfileScreen({ navigation }) {
  const { user, token, updateUser } = useAuth();
  const { t } = useLanguage();
  const isAgency = user?.sellerType === 'agency';

  const [photo, setPhoto] = useState(user?.photo || null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [agencyName, setAgencyName] = useState(user?.agencyName || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Same expo-image-picker call the sign-up profile step uses.
  async function handlePickPhoto() {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError(t('editProfile.errorPhotoPermission'));
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

  const canSave = fullName.trim() && (!isAgency || agencyName.trim()) && !busy;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      if (!(await isOnline())) {
        throw new Error(t('editProfile.offlineError'));
      }
      const { user: updated } = await updateProfile(
        {
          fullName: fullName.trim(),
          ...(isAgency ? { agencyName: agencyName.trim() } : {}),
          photo: photo || '',
        },
        token
      );
      await updateUser(updated);
      navigation.goBack();
    } catch (saveError) {
      setError(saveError.message);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handlePickPhoto}
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.changePhoto')}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Ionicons name="person" size={30} color="#8a8878" />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="pencil" size={12} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>{t('editProfile.fullNameLabel')}</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('signupProfile.fullNamePlaceholder')}
        />

        {isAgency ? (
          <>
            <Text style={styles.label}>{t('editProfile.agencyNameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={agencyName}
              onChangeText={setAgencyName}
              placeholder={t('signupProfile.agencyNamePlaceholder')}
            />
          </>
        ) : null}

        <Text style={styles.label}>{t('editProfile.phoneLabel')}</Text>
        <View style={styles.readonly}>
          <Text style={styles.readonlyText}>{user?.phone}</Text>
          <Ionicons name="lock-closed" size={14} color="#8a8878" />
        </View>
        <Text style={styles.hint}>{t('editProfile.phoneHint')}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.save, !canSave && styles.saveDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.save')}
        >
          <Text style={styles.saveText}>{busy ? t('editProfile.saving') : t('editProfile.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },

  avatarWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#eef0e2' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1c1c1c',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f7f6f1',
  },
  readonlyText: { fontSize: 15, color: '#8a8878' },
  hint: { fontSize: 12, color: '#8a8878', marginTop: 6, lineHeight: 17 },

  error: { color: '#c0453c', fontSize: 13, marginTop: 14, lineHeight: 18 },

  save: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveDisabled: { backgroundColor: '#d3d1c7' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
