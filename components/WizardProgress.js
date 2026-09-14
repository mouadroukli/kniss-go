import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// The thin progress bar shown at the top of each posting-wizard step.
export default function WizardProgress({ percent }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.label}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1efe8',
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#c8ec4a' },
  label: { fontSize: 12, fontWeight: '700', color: '#8a8878', marginLeft: 10, width: 34, textAlign: 'right' },
});
