import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchMyProperties, fetchMyLeads } from '../api/auth';
import { fetchPublicProfile } from '../api/accounts';
import { formatPrice } from '../utils/format';
import { relativeTime, daysUntilExpiry } from '../utils/relativeTime';

const EXPIRY_WARNING_DAYS = 7;

function StatCard({ icon, label, value, testID }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statChip}>
        <Ionicons name={icon} size={15} color="#1c1c1c" />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} testID={testID}>
        {value}
      </Text>
      <View style={styles.statAccent} />
    </View>
  );
}

function Section({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color="#1c1c1c" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [profilesByPhone, setProfilesByPhone] = useState({});

  const load = useCallback(async () => {
    if (!token) return;
    setStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'));
    setError(null);
    try {
      const [propertyResult, leadResult] = await Promise.all([
        fetchMyProperties(token),
        fetchMyLeads(token),
      ]);
      setProperties(propertyResult.properties ?? []);
      setLeads(leadResult.leads ?? []);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }, [token]);

  // Refetch whenever the tab regains focus, e.g. after posting a listing.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // A lead is just a phone number until it's checked against a real
  // registered account, and most won't be since buyers never need one.
  // Best-effort, and only fetches numbers it hasn't already resolved.
  useEffect(() => {
    const unresolved = [...new Set(leads.map((lead) => lead.buyerPhone))].filter(
      (phone) => !(phone in profilesByPhone)
    );
    if (unresolved.length === 0) return undefined;

    let cancelled = false;
    Promise.all(
      unresolved.map((phone) =>
        fetchPublicProfile(phone)
          .then((data) => [phone, data])
          .catch(() => [phone, null])
      )
    ).then((results) => {
      if (cancelled) return;
      setProfilesByPhone((current) => {
        const next = { ...current };
        for (const [phone, data] of results) next[phone] = data;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  const openProperty = (property) =>
    navigation.navigate('PropertyDetail', { property });

  const openProfile = (phone) => navigation.navigate('PublicProfile', { phone });

  const expiringSoon = properties
    .map((property) => ({ ...property, daysLeft: daysUntilExpiry(property.createdAt) }))
    .filter(
      (property) =>
        property.daysLeft != null && property.daysLeft > 0 && property.daysLeft <= EXPIRY_WARNING_DAYS
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const welcomeName = user?.fullName || user?.displayName || t('dashboard.defaultName');

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
        <Text style={styles.errorTitle}>{t('dashboard.loadErrorTitle')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load} accessibilityRole="button">
          <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcomeLabel}>{t('dashboard.welcomeBack')}</Text>
        <Text style={styles.welcomeName}>{welcomeName}</Text>

        <View style={styles.statRow}>
          <StatCard
            icon="pricetags-outline"
            label={t('dashboard.activeListings')}
            value={properties.length}
            testID="stat-active-listings"
          />
          <StatCard
            icon="heart-outline"
            label={t('dashboard.interestedBuyers')}
            value={leads.length}
            testID="stat-interested-buyers"
          />
        </View>

        <Section icon="time-outline" title={t('dashboard.expiringSoonSection')}>
          {expiringSoon.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyInCard}>
                {t('dashboard.nothingExpiring', { days: EXPIRY_WARNING_DAYS })}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {expiringSoon.map((property, index) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.cardRow,
                    index < expiringSoon.length - 1 && styles.cardRowDivider,
                  ]}
                  onPress={() => openProperty(property)}
                  accessibilityRole="button"
                >
                  <View style={styles.rowMain}>
                    <View style={styles.expiringBadge}>
                      <Text style={styles.expiringBadgeText}>
                        {t('dashboard.expiringInDays', { days: property.daysLeft })}
                      </Text>
                    </View>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {formatPrice(property.price, property.listingType)} · posted{' '}
                      {relativeTime(property.createdAt)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#b4b2a9" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        <Section icon="people-outline" title={t('dashboard.interestedBuyersSection')}>
          {leads.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyInCard}>{t('dashboard.noInterestYet')}</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {leads.map((lead, index) => {
                const profile = profilesByPhone[lead.buyerPhone];
                return (
                  <TouchableOpacity
                    key={`${lead.propertyId}-${lead.buyerPhone}`}
                    style={[styles.cardRow, index < leads.length - 1 && styles.cardRowDivider]}
                    onPress={() => profile && openProfile(lead.buyerPhone)}
                    disabled={!profile}
                    accessibilityRole={profile ? 'button' : undefined}
                  >
                    <View style={styles.leadAvatar}>
                      {profile?.photo ? (
                        <Image
                          testID="lead-avatar-image"
                          source={{ uri: profile.photo }}
                          style={styles.leadAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person-outline" size={16} color="#5f5e5a" />
                      )}
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.leadPhone}>{lead.buyerName || lead.buyerPhone}</Text>
                      <Text style={styles.rowMeta}>
                        {lead.buyerName ? `${lead.buyerPhone} · ` : ''}
                        {t('dashboard.interestedIn', {
                          title: lead.propertyTitle,
                          time: relativeTime(lead.createdAt),
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Section>

        <Section icon="albums-outline" title={t('dashboard.yourProperties')}>
          {properties.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyInCard}>{t('dashboard.noPropertiesYet')}</Text>
            </View>
          ) : (
            properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                hideFavorite
                onPress={() => openProperty(property)}
              />
            ))
          )}
        </Section>
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
  content: { padding: 20, paddingBottom: 40 },
  welcomeLabel: { fontSize: 13, color: '#8a8878' },
  welcomeName: { fontSize: 24, fontWeight: '800', color: '#1c1c1c', marginTop: 2 },

  statRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    padding: 16,
  },
  statChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#c8ec4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: { fontSize: 11, color: '#8a8878', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1c1c1c', marginTop: 6 },
  statAccent: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#c8ec4a',
    marginTop: 8,
  },

  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c1c' },

  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cardRowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1efe8' },
  rowMain: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },
  rowMeta: { fontSize: 12, color: '#8a8878', marginTop: 2 },
  emptyInCard: { fontSize: 13, color: '#8a8878', lineHeight: 19, padding: 14 },

  expiringBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbe6e4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  expiringBadgeText: { fontSize: 11, fontWeight: '700', color: '#c0453c' },

  leadAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1efe8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  leadAvatarImage: { width: '100%', height: '100%' },
  leadPhone: { fontSize: 14, fontWeight: '600', color: '#1c1c1c' },

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
