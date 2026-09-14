import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function LanguagesScreen() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <View style={styles.container}>
      {languages.map((option) => {
        const isSelected = option.code === language;
        return (
          <TouchableOpacity
            key={option.code}
            style={styles.row}
            onPress={() => setLanguage(option.code)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text style={styles.rowLabel}>{option.label}</Text>
            {isSelected && <Ionicons name="checkmark" size={20} color="#1c1c1c" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1efe8',
  },
  rowLabel: {
    fontSize: 16,
    color: '#1c1c1c',
  },
});
