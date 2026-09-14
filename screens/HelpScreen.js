import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { openWhatsApp } from '../utils/contact';

// Answers rewritten to match what this build actually does. The mockup's
// answers described a free-listing quota, paid extra listings, Boost, Kniss
// Pro and a "200m map visibility" rule, none of which exist here.
const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ qKey: `help.q${n}`, aKey: `help.a${n}` }));

// No real support desk: the button opens a WhatsApp chat to a placeholder
// number, the same honest-stub approach as the rest of the dev build.
const SUPPORT_NUMBER = '+213555000000';

function FaqItem({ q, a, open, onToggle }) {
  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={q}
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.question}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#8a8878" />
      </TouchableOpacity>
      {open ? <Text style={styles.answer}>{a}</Text> : null}
    </View>
  );
}

export default function HelpScreen() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('help.title')}</Text>
        <Text style={styles.subtitle}>{t('help.subtitle')}</Text>

        <View style={styles.card}>
          {FAQ_KEYS.map((entry, index) => (
            <FaqItem
              key={entry.qKey}
              q={t(entry.qKey)}
              a={t(entry.aKey)}
              open={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? -1 : index))}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => openWhatsApp(SUPPORT_NUMBER, 'Hi, I need help with Kniss Go')}
          accessibilityRole="button"
          accessibilityLabel={t('help.contactButton')}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
          <Text style={styles.contactButtonText}>{t('help.contactButton')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 18, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: { borderBottomWidth: 1, borderBottomColor: '#f1efe8' },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  question: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1c1c1c', marginRight: 10 },
  answer: {
    fontSize: 13,
    color: '#5f5e5a',
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    marginTop: 24,
  },
  contactButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
