import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, formatDistance } from '../utils/format';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

export default function PropertyCard({ property, onPress, hideFavorite = false }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const favorited = isFavorite(property.id);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardBody} onPress={onPress} accessibilityRole="button">
        {property.photoUri ? (
          <Image source={{ uri: property.photoUri }} style={styles.photoPlaceholder} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>{property.type}</Text>
          </View>
        )}
        <View style={styles.details}>
          <Text style={styles.price}>{formatPrice(property.price, property.listingType)}</Text>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.meta}>
            {t('propertyCard.areaRooms', { area: property.area, rooms: property.rooms })}
            {property.distance != null
              ? t('propertyCard.distanceAway', { distance: formatDistance(property.distance) })
              : ''}
          </Text>
        </View>
      </TouchableOpacity>
      {!hideFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(property)}
          accessibilityRole="button"
          accessibilityLabel={t(favorited ? 'propertyDetail.removeFavorite' : 'propertyDetail.addFavorite')}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={18}
            color={favorited ? '#e0453c' : '#b4b2a9'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1efe8',
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: '#eef0e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#8a8878',
    fontWeight: '600',
  },
  details: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1c',
  },
  title: {
    fontSize: 14,
    color: '#1c1c1c',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: '#8a8878',
    marginTop: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
