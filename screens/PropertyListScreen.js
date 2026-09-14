import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ListingFilterSheet from '../components/ListingFilterSheet';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchMyProperties, fetchMyLeads } from '../api/auth';
import { formatPrice } from '../utils/format';
import { relativeTime, daysUntilExpiry } from '../utils/relativeTime';

const EXPIRY_WARNING_DAYS = 7;

const PROPERTY_TYPES = ['Villa', 'Apartment', 'Commercial', 'Land'];

const EMPTY_FILTERS = { types: [], statuses: [], purposes: [] };

// Active, Expiring soon or Expired, derived from the 30-day listing lifespan.
// No "Draft" or "Sold out": the app has no draft-save and no sold/archive
// concept, so those mockup states have nothing to represent. t() comes from
// the caller since this plain function has no hook of its own.
export function listingStatus(property, t) {
  const daysLeft = daysUntilExpiry(property.createdAt);
  if (daysLeft == null) return { key: 'active', label: t('propertyList.statusActive') };
  if (daysLeft <= 0) return { key: 'expired', label: t('propertyList.statusExpired') };
  if (daysLeft <= EXPIRY_WARNING_DAYS) {
    return { key: 'expiring', label: t('propertyList.statusExpiringInDays', { days: daysLeft }) };
  }
  return { key: 'active', label: t('propertyList.statusActive') };
}

const STATUS_STYLE = {
  active: { backgroundColor: '#e3f3e5', color: '#3a7a48' },
  expiring: { backgroundColor: '#faedd8', color: '#9a6212' },
  expired: { backgroundColor: '#eeece4', color: '#8a8878' },
};

function ListingRow({ property, favoritesCount, onPress, t, tType }) {
  const status = listingStatus(property, t);
  const badge = STATUS_STYLE[status.key];
  const cover = (Array.isArray(property.photos) && property.photos[0]) || property.photoUri;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={property.title}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.rowPhoto} />
      ) : (
        <View style={[styles.rowPhoto, styles.rowPhotoEmpty]}>
          <Text style={styles.rowPhotoEmptyText}>{tType(property.type)}</Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.rowAge}>{relativeTime(property.createdAt)}</Text>
        </View>

        <Text style={styles.rowPrice}>{formatPrice(property.price, property.listingType)}</Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.rowLocation} numberOfLines={1}>
          {property.neighborhood ? `${property.neighborhood} · ` : ''}
          {tType(property.type)}
        </Text>

        <View style={styles.rowMetaLine}>
          <Ionicons name="heart-outline" size={12} color="#8a8878" />
          <Text style={styles.rowMeta}>
            {' '}
            {favoritesCount}{' '}
            {t(favoritesCount === 1 ? 'propertyList.interestedBuyerOne' : 'propertyList.interestedBuyerOther')}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#b4b2a9" />
    </TouchableOpacity>
  );
}

export default function PropertyListScreen({ navigation }) {
  const { token } = useAuth();
  const { t, tType } = useLanguage();
  const PURPOSES = [
    { key: 'Sell', label: t('propertyList.purposeSell') },
    { key: 'Rent', label: t('propertyList.purposeRent') },
  ];
  const STATUSES = [
    { key: 'active', label: t('propertyList.statusActive') },
    { key: 'expiring', label: t('propertyList.statusExpiringSoon') },
    { key: 'expired', label: t('propertyList.statusExpired') },
  ];
  const [state, setState] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setState((prev) => (prev === 'ready' ? 'ready' : 'loading'));
    setError(null);
    try {
      const [propertyResult, leadResult] = await Promise.all([
        fetchMyProperties(token),
        fetchMyLeads(token),
      ]);
      setProperties(propertyResult.properties ?? []);
      setLeads(leadResult.leads ?? []);
      setState('ready');
    } catch (loadError) {
      setError(loadError.message);
      setState('error');
    }
  }, [token]);

  // Refetch on focus, same as the dashboard, so a listing posted from the
  // Add tab shows up the moment you switch here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // "Interested buyers" per listing, grouped from the same leads feed the
  // dashboard uses (a lead is a buyer who favourited the listing).
  const favoritesByProperty = useMemo(() => {
    const counts = {};
    for (const lead of leads) {
      counts[lead.propertyId] = (counts[lead.propertyId] || 0) + 1;
    }
    return counts;
  }, [leads]);

  const activeFilterCount =
    filters.types.length + filters.statuses.length + filters.purposes.length;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (term) {
        const haystack = `${property.title} ${property.neighborhood || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.types.length && !filters.types.includes(property.type)) return false;
      const purpose = property.listingType === 'Rent' ? 'Rent' : 'Sell';
      if (filters.purposes.length && !filters.purposes.includes(purpose)) return false;
      if (filters.statuses.length && !filters.statuses.includes(listingStatus(property, t).key)) {
        return false;
      }
      return true;
    });
  }, [properties, search, filters, t]);

  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#1c1c1c" />
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>{t('propertyList.loadErrorTitle')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load} accessibilityRole="button">
          <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('propertyList.heading')}</Text>
        <Text style={styles.headingCount}>
          {t(properties.length === 1 ? 'propertyList.countOne' : 'propertyList.countOther', {
            count: properties.length,
          })}
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#8a8878" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('propertyList.searchPlaceholder')}
            placeholderTextColor="#8a8878"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('propertyList.filterA11y')}
        >
          <Ionicons name="options-outline" size={18} color="#1c1c1c" />
          {activeFilterCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {properties.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('propertyList.noListingsTitle')}</Text>
            <Text style={styles.emptyText}>{t('propertyList.noListingsText')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.getParent()?.navigate('Add')}
              accessibilityRole="button"
            >
              <Text style={styles.emptyButtonText}>{t('propertyList.postListing')}</Text>
            </TouchableOpacity>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('propertyList.nothingMatchesTitle')}</Text>
            <Text style={styles.emptyText}>{t('propertyList.nothingMatchesText')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setSearch('');
                setFilters(EMPTY_FILTERS);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.emptyButtonText}>{t('propertyList.clearSearchFilters')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visible.map((property) => (
            <ListingRow
              key={property.id}
              property={property}
              favoritesCount={favoritesByProperty[property.id] || 0}
              onPress={() => navigation.navigate('PropertyDetail', { property })}
              t={t}
              tType={tType}
            />
          ))
        )}
      </ScrollView>

      <ListingFilterSheet
        visible={sheetOpen}
        initial={filters}
        types={PROPERTY_TYPES.map((type) => ({ key: type, label: tType(type) }))}
        statuses={STATUSES}
        purposes={PURPOSES}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
      />
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

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heading: { fontSize: 24, fontWeight: '800', color: '#1c1c1c' },
  headingCount: { fontSize: 13, color: '#8a8878' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1c1c1c', padding: 0 },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#c8ec4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: { fontSize: 10, fontWeight: '800', color: '#1c1c1c' },

  list: { padding: 20, paddingTop: 10, paddingBottom: 40 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  rowPhoto: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#eef0e2',
  },
  rowPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowPhotoEmptyText: { fontSize: 11, fontWeight: '600', color: '#8a8878' },
  rowBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  rowAge: { fontSize: 11, color: '#8a8878' },
  rowPrice: { fontSize: 15, fontWeight: '800', color: '#1c1c1c', marginTop: 6 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: '#1c1c1c', marginTop: 2 },
  rowLocation: { fontSize: 12, color: '#8a8878', marginTop: 2 },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  rowMeta: { fontSize: 11, color: '#8a8878' },

  empty: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1c' },
  emptyText: {
    fontSize: 13,
    color: '#8a8878',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#1c1c1c',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1c', textAlign: 'center' },
  errorMessage: {
    fontSize: 13,
    color: '#8a8878',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1c1c1c',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
