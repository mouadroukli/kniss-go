import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.key;
          const text = typeof option === 'string' ? option : option.label;
          const on = selected.includes(value);
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onToggle(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={text}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// The seller's "Filter" sheet from the mockup, trimmed to the buckets that map
// to real listing data: property type, status (Active, Expiring soon, Expired)
// and purpose (Sell, Rent). The mockup's "Listing offer" and "Boost status"
// rows are left out since this build has no paid or boosted listings.
export default function ListingFilterSheet({
  visible,
  initial,
  types,
  statuses,
  purposes,
  onApply,
  onClose,
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(initial);

  // Snapshot the applied filters into the draft each time the sheet opens, so
  // dismissing without "Apply" discards the in-progress changes.
  useEffect(() => {
    if (visible) setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggle = (bucket, value) =>
    setDraft((current) => {
      const list = current[bucket];
      return {
        ...current,
        [bucket]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const clear = () => setDraft({ types: [], statuses: [], purposes: [] });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('filterSheet.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('filterSheet.close')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="#1c1c1c" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <ChipGroup
              label={t('filterSheet.propertyType')}
              options={types}
              selected={draft.types}
              onToggle={(v) => toggle('types', v)}
            />
            <ChipGroup
              label={t('filterSheet.status')}
              options={statuses}
              selected={draft.statuses}
              onToggle={(v) => toggle('statuses', v)}
            />
            <ChipGroup
              label={t('filterSheet.purpose')}
              options={purposes}
              selected={draft.purposes}
              onToggle={(v) => toggle('purposes', v)}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={clear} accessibilityRole="button" accessibilityLabel={t('filterSheet.clearAllA11y')}>
              <Text style={styles.clearText}>{t('filterSheet.clearAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onApply(draft)}
              accessibilityRole="button"
              accessibilityLabel={t('filterSheet.applyA11y')}
            >
              <Text style={styles.applyButtonText}>{t('filterSheet.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 28, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1c1c1c' },
  body: { paddingVertical: 8 },

  group: { marginTop: 16 },
  groupLabel: { fontSize: 13, color: '#5f5e5a', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1efe8',
  },
  chipOn: { backgroundColor: '#1c1c1c', borderColor: '#1c1c1c' },
  chipText: { fontSize: 13, color: '#1c1c1c' },
  chipTextOn: { color: '#ffffff', fontWeight: '600' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearText: { fontSize: 14, fontWeight: '600', color: '#5f5e5a' },
  applyButton: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  applyButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
