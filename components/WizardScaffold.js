import React from 'react';
import { Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Shared frame for the sign-up wizard steps: a title, a bit of explanation,
// the step's fields, then the forward button right below them rather than
// pinned to the bottom, matching the mockup's top-weighted layout. The dark
// button is the in-flow "continue" action; lime stays reserved for the one
// big conversion button on the Welcome screen.
export default function WizardScaffold({
  title,
  subtitle,
  children,
  submitLabel,
  onSubmit,
  submitDisabled,
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}

        {onSubmit ? (
          <TouchableOpacity
            style={[styles.submit, submitDisabled && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={submitDisabled}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
          >
            <Text style={styles.submitText}>{submitLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: {
    fontSize: 13,
    color: '#8a8878',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 8,
  },
  submit: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { backgroundColor: '#d3d1c7' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
