import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../utils/format';
import { daysUntilExpiry } from '../utils/relativeTime';
import { useLanguage } from '../context/LanguageContext';

// Shown right after a listing is posted. The card mirrors the mockup (photo,
// Active badge, price, location, type, favourites count), all from the
// property the server just created. No Boost banner and no "free ad limit"
// warning, since this app has no monetization anywhere.
export default function ListingPostedScreen({ navigation, route }) {
  const { property } = route.params;
  const { t, tType } = useLanguage();
  const daysLeft = daysUntilExpiry(property.createdAt);
  const favouritesCount = property.favoritesCount ?? 0;
  const locationLabel = property.neighborhood || t('listingPosted.currentLocation');

  function returnToDashboard(nested) {
    navigation.popToTop();
    navigation.getParent('root')?.navigate('Dashboard', {
      screen: 'Home',
      ...(nested ? { params: nested } : {}),
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={36} color="#1c1c1c" />
        </View>
        <Text style={styles.title}>{t('listingPosted.title')}</Text>

        <View style={styles.card}>
          {property.photoUri ? (
            <Image source={{ uri: property.photoUri }} style={styles.cardPhoto} />
          ) : (
            <View style={[styles.cardPhoto, styles.cardPhotoEmpty]}>
              <Text style={styles.cardPhotoEmptyText}>{tType(property.type)}</Text>
            </View>
          )}

          <View style={styles.cardBody}>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>{t('listingPosted.active')}</Text>
            </View>
            <Text style={styles.cardPrice}>{formatPrice(property.price, property.listingType)}</Text>
            <View style={styles.cardMetaRow}>
              <Ionicons name="location-outline" size={13} color="#8a8878" />
              <Text style={styles.cardMeta}>{locationLabel}</Text>
            </View>
            <View style={styles.cardMetaRow}>
              <Ionicons name="home-outline" size={13} color="#8a8878" />
              <Text style={styles.cardMeta}>{tType(property.type)}</Text>
            </View>
            <View style={styles.cardMetaRow}>
              <Ionicons name="heart-outline" size={13} color="#8a8878" />
              <Text style={styles.cardMeta}>
                {favouritesCount}{' '}
                {t(favouritesCount === 1 ? 'listingPosted.favouriteOne' : 'listingPosted.favouriteOther')}
              </Text>
            </View>
          </View>
        </View>

        {daysLeft != null && (
          <Text style={styles.expiry}>
            {t(daysLeft === 1 ? 'listingPosted.expiresInOne' : 'listingPosted.expiresInOther', {
              days: daysLeft,
            })}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            returnToDashboard({ screen: 'PropertyDetail', params: { property } })
          }
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t('listingPosted.seeAnnouncement')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => returnToDashboard()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>{t('listingPosted.returnToProperties')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 24 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#c8ec4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1c1c',
    marginTop: 18,
    marginBottom: 22,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  cardPhoto: { width: '100%', height: 160, backgroundColor: '#eef0e2' },
  cardPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardPhotoEmptyText: { color: '#8a8878', fontWeight: '600' },
  cardBody: { padding: 14 },
  activePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f3e5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#3a7a48' },
  cardPrice: { fontSize: 18, fontWeight: '700', color: '#1c1c1c' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardMeta: { fontSize: 13, color: '#8a8878', marginLeft: 6 },
  expiry: { fontSize: 13, color: '#8a8878', marginTop: 16, textAlign: 'center' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1efe8',
  },
  primaryButton: {
    backgroundColor: '#c8ec4a',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#1c1c1c' },
  secondaryButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d3d1c7',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#1c1c1c' },
});
