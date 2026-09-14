import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PhotoGallery from '../components/PhotoGallery';
import { openWhatsApp, callPhoneNumber } from '../utils/contact';
import { formatPrice } from '../utils/format';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchPublicProfile } from '../api/accounts';

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Which size and structure rows each property type actually collects in the
// posting wizard. Rows a type never asks for are hidden outright rather than
// shown as 0 or N/A, driven off property.type and never off whether a value
// is falsy, since a real figure can legitimately be 0. Type, Features and
// Documents always show, so they're not listed here.
const TYPE_FIELDS = {
  Villa: { landArea: true, area: true, rooms: false, floors: true, parkingSpots: false, finishing: true },
  Apartment: { landArea: false, area: true, rooms: true, floors: false, parkingSpots: true, finishing: true },
  Commercial: { landArea: false, area: true, rooms: false, floors: false, parkingSpots: false, finishing: true },
  Land: { landArea: true, area: false, rooms: false, floors: false, parkingSpots: false, finishing: false },
};

// A listing with an unrecognised type (older data, a type added later) falls
// back to showing every row so nothing silently disappears.
const ALL_FIELDS = { landArea: true, area: true, rooms: true, floors: true, parkingSpots: true, finishing: true };

function AmenityRow({ label, available, t }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={[styles.amenityBadge, available ? styles.amenityYes : styles.amenityNo]}>
        <Text
          style={[
            styles.amenityBadgeText,
            available ? styles.amenityYesText : styles.amenityNoText,
          ]}
        >
          {available ? t('common.yes') : t('common.no')}
        </Text>
      </View>
    </View>
  );
}

export default function PropertyDetailScreen({ route, navigation }) {
  const { property } = route.params;
  const { t, tType } = useLanguage();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(property.id);

  const fields = TYPE_FIELDS[property.type] || ALL_FIELDS;
  const featuresLabel = t(property.type === 'Land' ? 'propertyDetail.utilities' : 'propertyDetail.features');

  // Best-effort: an owner with no public account on file (shouldn't happen
  // for a real listing, but cheap to guard) just keeps the icon fallback.
  useEffect(() => {
    if (!property.ownerId) return undefined;
    let cancelled = false;
    fetchPublicProfile(property.ownerId)
      .then((data) => {
        if (!cancelled) setOwnerPhoto(data.photo || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [property.ownerId]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View>
          <PhotoGallery photos={property.photos} photoUri={property.photoUri} />
          {/* The gallery itself stays full-bleed under the status bar and
              notch; only this bar's own content is pushed down by
              SafeAreaView's top inset, so the buttons clear the notch. */}
          <SafeAreaView edges={['top']} style={styles.overlayBar} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('propertyDetail.close')}
            >
              <Ionicons name="close" size={22} color="#1c1c1c" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(property)}
              accessibilityRole="button"
              accessibilityLabel={t(favorited ? 'propertyDetail.removeFavorite' : 'propertyDetail.addFavorite')}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={20}
                color={favorited ? '#e0453c' : '#1c1c1c'}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {property.boosted && (
              <View style={styles.boostedBadge}>
                <Text style={styles.boostedBadgeText}>{t('propertyDetail.boosted')}</Text>
              </View>
            )}
            <Text style={styles.postedAgo}>
              {t('propertyDetail.postedAgo', { days: property.postedDaysAgo })}
            </Text>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <Text style={styles.description} numberOfLines={descriptionExpanded ? undefined : 2}>
            {property.description}
          </Text>
          <TouchableOpacity onPress={() => setDescriptionExpanded((current) => !current)}>
            <Text style={styles.moreLink}>
              {t(descriptionExpanded ? 'propertyDetail.showLess' : 'propertyDetail.more')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>{t('propertyDetail.sectionInfo')}</Text>
          <View style={styles.infoCard}>
            <InfoRow label={t('propertyDetail.type')} value={tType(property.type)} />
            {fields.landArea ? (
              <InfoRow label={t('propertyDetail.landArea')} value={`${property.landArea} m²`} />
            ) : null}
            {fields.area ? (
              <InfoRow label={t('propertyDetail.area')} value={`${property.area} m²`} />
            ) : null}
            {fields.rooms ? <InfoRow label={t('propertyDetail.rooms')} value={property.rooms} /> : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{featuresLabel}</Text>
              <View style={styles.featuresWrap}>
                {property.features && property.features.length ? (
                  property.features.map((feature) => (
                    <View key={feature} style={styles.featureChip}>
                      <Text style={styles.featureChipText}>{feature}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValue}>—</Text>
                )}
              </View>
            </View>
            {fields.floors ? <InfoRow label={t('propertyDetail.floors')} value={property.floors} /> : null}
            {fields.parkingSpots ? (
              <InfoRow
                label={t('propertyDetail.parkingSpots')}
                value={t('propertyDetail.parkingSpotsValue', { count: property.parkingSpots })}
              />
            ) : null}
            {fields.finishing ? (
              <InfoRow label={t('propertyDetail.finishing')} value={property.finishing} />
            ) : null}
            <InfoRow label={t('propertyDetail.documents')} value={property.documents} />
          </View>

          <Text style={styles.sectionTitle}>{t('propertyDetail.whereYoullBe')}</Text>
          <Text style={styles.sectionSubtitle}>{t('propertyDetail.nearbySubtitle')}</Text>
          <View style={styles.infoCard}>
            <AmenityRow t={t} label={t('amenity.hospital')} available={property.nearby.hospital} />
            <AmenityRow t={t} label={t('amenity.school')} available={property.nearby.school} />
            <AmenityRow t={t} label={t('amenity.supermarket')} available={property.nearby.supermarket} />
            <AmenityRow t={t} label={t('amenity.mosque')} available={property.nearby.mosque} />
            <AmenityRow t={t} label={t('amenity.busStop')} available={property.nearby.busStop} />
            <AmenityRow t={t} label={t('amenity.gym')} available={property.nearby.gym} />
            <AmenityRow t={t} label={t('amenity.park')} available={property.nearby.park} />
          </View>

          <TouchableOpacity
            style={styles.agencyRow}
            onPress={() =>
              navigation.navigate('PublicProfile', {
                phone: property.ownerId,
                excludePropertyId: property.id,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={t('propertyDetail.viewProfile', {
              name: property.agencyName || t('propertyDetail.seller'),
            })}
          >
            <View style={styles.agencyAvatar}>
              {ownerPhoto ? (
                <Image
                  testID="agency-avatar-image"
                  source={{ uri: ownerPhoto }}
                  style={styles.agencyAvatarImage}
                />
              ) : (
                <Ionicons name="business-outline" size={18} color="#5f5e5a" />
              )}
            </View>
            <View style={styles.agencyNameRow}>
              <Text style={styles.agencyName}>{property.agencyName}</Text>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#4c9a5c"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceNote}>{property.priceNote}</Text>
          <Text style={styles.price}>{formatPrice(property.price, property.listingType)}</Text>
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() =>
              openWhatsApp(property.phoneNumber, `Hi, I'm interested in ${property.title}`)
            }
            accessibilityRole="button"
            accessibilityLabel={t('propertyDetail.contactWhatsapp')}
          >
            <Text style={styles.whatsappButtonText}>{t('propertyDetail.whatsapp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callPhoneNumber(property.phoneNumber)}
            accessibilityRole="button"
            accessibilityLabel={t('propertyDetail.callNow')}
          >
            <Text style={styles.callButtonText}>{t('propertyDetail.callNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  overlayBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostedBadge: {
    backgroundColor: '#c8ec4a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  boostedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1c1c',
  },
  postedAgo: {
    fontSize: 12,
    color: '#8a8878',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#5f5e5a',
    lineHeight: 20,
  },
  moreLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1c',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1c',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8a8878',
    marginBottom: 8,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1efe8',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8a8878',
  },
  infoValue: {
    fontSize: 13,
    color: '#1c1c1c',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  featuresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: 12,
  },
  featureChip: {
    backgroundColor: '#f1efe8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
    marginBottom: 6,
  },
  featureChipText: {
    fontSize: 11,
    color: '#1c1c1c',
  },
  amenityBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  amenityYes: {
    backgroundColor: '#e3f3e5',
  },
  amenityNo: {
    backgroundColor: '#fbe6e4',
  },
  amenityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amenityYesText: {
    color: '#3a7a48',
  },
  amenityNoText: {
    color: '#c0453c',
  },
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  agencyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1efe8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  agencyAvatarImage: { width: '100%', height: '100%' },
  agencyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agencyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1c',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1efe8',
    backgroundColor: '#ffffff',
  },
  priceNote: {
    fontSize: 11,
    color: '#8a8878',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 12,
  },
  footerButtons: {
    flexDirection: 'row',
  },
  whatsappButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#c8ec4a',
    borderRadius: 24,
    paddingVertical: 12,
    marginRight: 8,
  },
  whatsappButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1c1c',
  },
  callButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 24,
    paddingVertical: 12,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
