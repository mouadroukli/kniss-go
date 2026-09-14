import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import RadarPulse from '../components/RadarPulse';
import SegmentedControl from '../components/SegmentedControl';
import Dropdown from '../components/Dropdown';
import { useLanguage } from '../context/LanguageContext';
import { NEIGHBORHOODS } from '../constants/neighborhoods';
import { formatDistance } from '../utils/format';

// Discrete steps rather than one linear slider: a search radius means a very
// different thing at 100m than at 50km, so an equal slider move should mean
// an equal useful jump, not an equal number of metres.
const RADIUS_STEPS_M = [
  100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000,
];
const DEFAULT_RADIUS_INDEX = RADIUS_STEPS_M.indexOf(2000);
const MAX_RADIUS_LABEL = formatDistance(RADIUS_STEPS_M[RADIUS_STEPS_M.length - 1]);

export default function RadiusPickerScreen({ navigation }) {
  const { t } = useLanguage();
  const [radiusIndex, setRadiusIndex] = useState(DEFAULT_RADIUS_INDEX);
  const [locationMode, setLocationMode] = useState('current');
  const [neighborhood, setNeighborhood] = useState(null);

  const radius = RADIUS_STEPS_M[radiusIndex];
  const canExplore = locationMode === 'current' || !!neighborhood;

  function handleModeChange(mode) {
    setLocationMode(mode);
    if (mode === 'current') setNeighborhood(null);
  }

  function handleExplore() {
    navigation.navigate('Scanning', {
      radius,
      locationMode,
      neighborhood: locationMode === 'neighborhood' ? neighborhood : undefined,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <RadarPulse active={false} />

        <Text style={styles.title}>{t('radiusPicker.title')}</Text>
        <Text style={styles.subtitle}>{t('radiusPicker.subtitle', { max: MAX_RADIUS_LABEL })}</Text>

        <Text style={styles.radiusValue}>{formatDistance(radius)}</Text>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={RADIUS_STEPS_M.length - 1}
          step={1}
          value={radiusIndex}
          onValueChange={(value) => setRadiusIndex(Math.round(value))}
          minimumTrackTintColor="#c8ec4a"
          maximumTrackTintColor="#e5e3d8"
          thumbTintColor="#1c1c1c"
          accessibilityLabel={t('radiusPicker.searchRadiusA11y')}
        />

        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>{t('radiusPicker.searchAround')}</Text>
          <SegmentedControl
            value={locationMode}
            onChange={handleModeChange}
            options={[
              { value: 'current', label: t('radiusPicker.useCurrentLocation') },
              { value: 'neighborhood', label: t('radiusPicker.chooseNeighborhood') },
            ]}
          />
          {locationMode === 'neighborhood' ? (
            <View style={styles.neighborhoodField}>
              <Dropdown
                value={neighborhood}
                placeholder={t('radiusPicker.chooseNeighborhood')}
                options={NEIGHBORHOODS.map((n) => n.name)}
                onSelect={setNeighborhood}
                accessibilityLabel={t('radiusPicker.neighborhoodA11y')}
              />
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.exploreButton, !canExplore && styles.exploreButtonDisabled]}
          onPress={handleExplore}
          disabled={!canExplore}
          accessibilityRole="button"
          accessibilityLabel={t('radiusPicker.startExploringA11y')}
        >
          <Text style={styles.exploreButtonText}>{t('radiusPicker.startExploring')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1c',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5f5e5a',
    marginTop: 4,
    marginBottom: 32,
    textAlign: 'center',
  },
  radiusValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  locationBlock: { width: '100%', marginTop: 28 },
  locationLabel: { fontSize: 13, color: '#5f5e5a', marginBottom: 8 },
  neighborhoodField: { marginTop: 12 },
  exploreButton: {
    backgroundColor: '#c8ec4a',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 32,
  },
  exploreButtonDisabled: { backgroundColor: '#e5e3d8' },
  exploreButtonText: {
    color: '#1c1c1c',
    fontSize: 16,
    fontWeight: '700',
  },
});
