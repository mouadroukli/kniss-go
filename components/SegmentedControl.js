import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// The Sell / Rent toggle style, generalised: a row of bordered pills, the
// selected one filled dark. Used for Sell/Rent and the location mode toggle.
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.button, index > 0 && styles.buttonGap, active && styles.buttonActive]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonGap: { marginLeft: 8 },
  buttonActive: { backgroundColor: '#1c1c1c', borderColor: '#1c1c1c' },
  text: { fontSize: 14, color: '#1c1c1c' },
  textActive: { color: '#ffffff', fontWeight: '600' },
});
