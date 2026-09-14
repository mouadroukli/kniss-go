import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// The "finding you properties in [ ben aknoun ]" caption and segmented bar
// from the reference UI. That UI overlaid it on a live map; this app has no
// map (see PROJECT_NOTES), so it sits on the radar visual instead.
export default function ScanProgress({ label, step, totalSteps = 3 }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[styles.segment, index < step && styles.segmentActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  caption: { fontSize: 12, color: '#8a8878', marginBottom: 8 },
  track: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e3d8',
  },
  segmentActive: { backgroundColor: '#c8ec4a' },
});
