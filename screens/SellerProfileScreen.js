import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resetTo } from '../navigation/nav';

function initials(name) {
  return (name || 'K G')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function MenuRow({ icon, label, danger, onPress, last, testID }) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.row, !last && styles.rowDivider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={19} color={danger ? '#c0453c' : '#1c1c1c'} style={styles.rowIcon} />
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color="#b4b2a9" /> : null}
    </TouchableOpacity>
  );
}

export default function SellerProfileScreen({ navigation }) {
  const { user, logout, removeAccount } = useAuth();
  const { t } = useLanguage();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  const MENU = [
    { key: 'profile', icon: 'person-outline', label: t('sellerProfile.userProfile'), route: 'EditProfile' },
    { key: 'languages', icon: 'globe-outline', label: t('sellerProfile.languages'), route: 'Languages' },
    { key: 'phone', icon: 'call-outline', label: t('sellerProfile.updatePhone'), route: 'UpdatePhone' },
    { key: 'password', icon: 'lock-closed-outline', label: t('sellerProfile.updatePassword'), route: 'UpdatePassword' },
    { key: 'linked', icon: 'link-outline', label: t('sellerProfile.linkedAccounts'), route: 'LinkedAccounts' },
  ];
  const SUPPORT = [
    { key: 'help', icon: 'help-buoy-outline', label: t('sellerProfile.help'), route: 'Help' },
    { key: 'terms', icon: 'document-text-outline', label: t('sellerProfile.terms'), route: 'Terms' },
  ];

  async function handleSignOut() {
    setSignOutVisible(false);
    await logout();
    resetTo(navigation, 'Welcome');
  }

  async function handleRemoveAccount() {
    setRemoving(true);
    setError(null);
    try {
      await removeAccount();
      setRemoveVisible(false);
      resetTo(navigation, 'Welcome');
    } catch (removeError) {
      setError(removeError.message);
      setRemoving(false);
      setRemoveVisible(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Text style={styles.avatarInitials}>{initials(user?.displayName)}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.displayName || 'Kniss Go user'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        <View style={styles.card}>
          {MENU.map((item, index) => (
            <MenuRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              onPress={() => navigation.navigate(item.route)}
              last={index === MENU.length - 1}
            />
          ))}
        </View>

        <View style={styles.card}>
          {SUPPORT.map((item, index) => (
            <MenuRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              onPress={() => navigation.navigate(item.route)}
              last={index === SUPPORT.length - 1}
            />
          ))}
        </View>

        <View style={styles.card}>
          <MenuRow
            testID="row-sign-out"
            icon="log-out-outline"
            label={t('sellerProfile.signOut')}
            onPress={() => setSignOutVisible(true)}
          />
          <MenuRow
            testID="row-remove-account"
            icon="trash-outline"
            label={t('sellerProfile.removeAccount')}
            danger
            last
            onPress={() => setRemoveVisible(true)}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <ConfirmModal
        visible={signOutVisible}
        title={t('sellerProfile.signOutConfirmTitle')}
        message={t('sellerProfile.signOutConfirmMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('sellerProfile.signOut')}
        destructive
        onCancel={() => setSignOutVisible(false)}
        onConfirm={handleSignOut}
      />

      <ConfirmModal
        visible={removeVisible}
        title={t('sellerProfile.removeConfirmTitle')}
        message={t('sellerProfile.removeConfirmMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={removing ? 'Removing…' : t('sellerProfile.removeConfirmButton')}
        destructive
        onCancel={() => setRemoveVisible(false)}
        onConfirm={handleRemoveAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },

  identity: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#eef0e2' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: '#8a8878' },
  name: { fontSize: 19, fontWeight: '800', color: '#1c1c1c', marginTop: 12 },
  phone: { fontSize: 13, color: '#8a8878', marginTop: 2 },

  card: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1efe8' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#1c1c1c' },
  rowLabelDanger: { color: '#c0453c', fontWeight: '600' },

  error: { color: '#c0453c', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
