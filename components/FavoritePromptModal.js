import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

// Shown when a signed-out visitor taps the heart. Favoriting needs a buyer
// account now (see FavoritesContext), so there's nothing to fill in here,
// just a choice: log in / sign up, or "Not now", which dismisses with no
// redirect and nothing saved.
export default function FavoritePromptModal({ visible, onSignIn, onNotNow }) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onNotNow}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('favoritePrompt.title')}</Text>
          <Text style={styles.message}>{t('favoritePrompt.message')}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity testID="modal-not-now" onPress={onNotNow} accessibilityRole="button">
              <Text style={styles.notNowText}>{t('favoritePrompt.notNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="modal-sign-in"
              style={styles.continueButton}
              onPress={onSignIn}
              accessibilityRole="button"
            >
              <Text style={styles.continueButtonText}>{t('favoritePrompt.continue')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#5f5e5a',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  notNowText: {
    fontSize: 14,
    color: '#8a8878',
    marginRight: 20,
  },
  continueButton: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
