import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import PropertyCard from '../components/PropertyCard';
import { useLanguage } from '../context/LanguageContext';
import { formatDistance } from '../utils/format';

export default function ResultsScreen({ route, navigation }) {
  const { properties, radius } = route.params;
  const { t } = useLanguage();

  if (!properties || properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {t('results.nothingWithin', { radius: formatDistance(radius) })}
        </Text>
        <Text style={styles.emptyMessage}>{t('results.tryWidening')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={properties}
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
  },
});
