import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import PropertyCard from '../components/PropertyCard';

export default function FavoritesScreen({ navigation }) {
  const { favorites } = useFavorites();
  const { t } = useLanguage();

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{t('favorites.emptyTitle')}</Text>
        <Text style={styles.emptyMessage}>{t('favorites.emptyMessage')}</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Explore')}
          accessibilityRole="button"
        >
          <Text style={styles.exploreButtonText}>{t('favorites.startExploring')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={favorites}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PropertyCard
          property={item}
          onPress={() => navigation.navigate('PropertyDetail', { property: item })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#5f5e5a',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#c8ec4a',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1c',
  },
});
