import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

// The six-box verification-code field: one hidden TextInput drives the
// visible boxes. Pulled out of the sign-up OTP screen so the Profile phone
// and password flows can share it rather than reimplementing it.
export default function CodeInput({ value, onChange, length = 6, autoFocus = true }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const half = Math.floor(length / 2);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, index) => (
        <React.Fragment key={index}>
          {length % 2 === 0 && index === half ? <View style={styles.dash} /> : null}
          <View style={[styles.box, index === value.length && styles.boxActive]}>
            <Text style={styles.boxText}>{value[index] ?? ''}</Text>
          </View>
        </React.Fragment>
      ))}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        accessibilityLabel={t('common.verificationCode')}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  box: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  boxActive: { borderColor: '#1c1c1c' },
  boxText: { fontSize: 20, fontWeight: '700', color: '#1c1c1c' },
  dash: { width: 12, height: 2, backgroundColor: '#d3d1c7', marginHorizontal: 4 },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
