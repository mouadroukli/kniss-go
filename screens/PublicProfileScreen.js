import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../context/LanguageContext';
import { fetchPublicProfile } from '../api/accounts';

// The tap-through "who is this" screen, reached from Property Detail's agency
// row or a name in the seller dashboard's Interested buyers list. Public data
// only (see server/index.js's /accounts/public/:phone route): no phone number
// is shown here beyond what the caller already had.
export default function PublicProfileScreen({ route, navigation }) {
  const { phone, excludePropertyId } = route.params;
  const { t } = useLanguage();
  const SELLER_TYPE_LABEL = {
    agency: t('publicProfile.agency'),
    individual: t('publicProfile.individualSeller'),
  };
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const data = await fetchPublicProfile(phone);
        if (cancelled) return;
        setProfile(data);
        setStatus('ready');
      } catch (fetchError) {
        if (cancelled) return;
        setError(fetchError.message);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phone]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#1c1c1c" />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  const isSeller = profile.role === 'seller';
  const listings = (profile.listings || []).filter((property) => property.id !== excludePropertyId);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {profile.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Ionicons
                name={isSeller ? 'business-outline' : 'person-outline'}
                size={32}
                color="#8a8878"
              />
            </View>
          )}
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.type}>
            {isSeller ? SELLER_TYPE_LABEL[profile.sellerType] || t('publicProfile.seller') : t('publicProfile.buyer')}
          </Text>
        </View>

        {isSeller && (
          <View style={styles.listingsSection}>
            <Text style={styles.sectionTitle}>
              {listings.length ? t('publicProfile.otherListings') : t('publicProfile.noOtherListings')}
            </Text>
            {listings.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPress={() => navigation.push('PropertyDetail', { property })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  centered: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { fontSize: 14, color: '#5f5e5a', textAlign: 'center' },
  content: { padding: 20, paddingBottom: 40 },

  identity: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#eef0e2' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 19, fontWeight: '800', color: '#1c1c1c', marginTop: 12, textAlign: 'center' },
  type: { fontSize: 13, color: '#8a8878', marginTop: 2 },

  listingsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1c', marginBottom: 12 },
});
