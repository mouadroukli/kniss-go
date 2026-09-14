import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
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

// The buyer tab bar's Settings screen. Browsing is still account-free, but
// favoriting isn't any more (see FavoritesContext): a buyer account is what
// makes "Interested buyers" show a real identity to sellers, and it's how
// favourites follow you to another device.
export default function SettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout, removeAccount } = useAuth();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignOutConfirm() {
    setSignOutVisible(false);
    await logout();
    // "Signed out" should feel like a real return to the start, not just this
    // row updating in place.
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
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      {isAuthenticated ? (
        <View style={styles.identity}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Text style={styles.avatarInitials}>{initials(user?.displayName)}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <MenuRow
            icon="log-in-outline"
            label={t('settings.signIn')}
            onPress={() => navigation.navigate('Login')}
            last
          />
        </View>
      )}

      {isAuthenticated && (
        <View style={styles.card}>
          <MenuRow
            icon="person-outline"
            label={t('settings.profile')}
            onPress={() => navigation.navigate('Profile')}
          />
          <MenuRow
            icon="call-outline"
            label={t('settings.updatePhone')}
            onPress={() => navigation.navigate('UpdatePhone')}
          />
          <MenuRow
            icon="lock-closed-outline"
            label={t('settings.updatePassword')}
            onPress={() => navigation.navigate('UpdatePassword')}
          />
          <MenuRow
            icon="link-outline"
            label={t('settings.linkedAccounts')}
            onPress={() => navigation.navigate('LinkedAccounts')}
            last
          />
        </View>
      )}

      <View style={styles.card}>
        <MenuRow
          icon="globe-outline"
          label={t('settings.languages')}
          onPress={() => navigation.navigate('Languages')}
        />
        <MenuRow icon="help-buoy-outline" label={t('settings.help')} onPress={() => navigation.navigate('Help')} />
        <MenuRow
          icon="document-text-outline"
          label={t('settings.terms')}
          onPress={() => navigation.navigate('Terms')}
          last
        />
      </View>

      {isAuthenticated && (
        <View style={styles.card}>
          <MenuRow
            testID="row-sign-out"
            icon="log-out-outline"
            label={t('settings.signOut')}
            onPress={() => setSignOutVisible(true)}
          />
          <MenuRow
            testID="row-remove-account"
            icon="trash-outline"
            label={t('settings.removeAccount')}
            danger
            last
            onPress={() => setRemoveVisible(true)}
          />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ConfirmModal
        visible={signOutVisible}
        title={t('settings.signOutConfirmTitle')}
        message={t('settings.signOutConfirmMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('settings.signOut')}
        destructive
        onCancel={() => setSignOutVisible(false)}
        onConfirm={handleSignOutConfirm}
      />

      <ConfirmModal
        visible={removeVisible}
        title={t('settings.removeConfirmTitle')}
        message={t('settings.removeConfirmMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={removing ? '…' : t('settings.removeConfirmButton')}
        destructive
        onCancel={() => setRemoveVisible(false)}
        onConfirm={handleRemoveAccount}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, paddingBottom: 40 },

  identity: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#eef0e2' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 22, fontWeight: '800', color: '#8a8878' },
  name: { fontSize: 18, fontWeight: '800', color: '#1c1c1c', marginTop: 10 },
  phone: { fontSize: 13, color: '#8a8878', marginTop: 2 },

  card: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    marginBottom: 14,
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
