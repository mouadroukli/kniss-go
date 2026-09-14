import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// A pick-one field: shows the current value, opens a modal list to change it.
// Used for Number of Floors, Finishing, Ownership Documents, and the
// neighbourhood picker. Options can be plain strings or { label, value }.
export default function Dropdown({ value, placeholder = 'Select…', options, onSelect, accessibilityLabel }) {
  const [open, setOpen] = useState(false);

  const normalized = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );
  const selected = normalized.find((option) => option.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || placeholder}
      >
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#8a8878" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <ScrollView>
              {normalized.map((option) => {
                const active = option.value === value;
                return (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={styles.option}
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {option.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color="#1c1c1c" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldText: { fontSize: 15, color: '#1c1c1c', flex: 1 },
  placeholder: { color: '#8a8878' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 28, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: '70%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: { fontSize: 15, color: '#1c1c1c' },
  optionTextActive: { fontWeight: '700' },
});
