import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 260;

// Shows a listing's photos. A photos array renders a swipeable full-width
// hero plus a tappable thumbnail strip so it's obvious there's more than one;
// a single photoUri (or a one-item photos array) renders just the hero;
// neither renders the placeholder block, for seed data and older listings.
export default function PhotoGallery({ photos, photoUri }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const heroRef = useRef(null);

  const real = Array.isArray(photos) && photos.length ? photos : photoUri ? [photoUri] : [];

  if (real.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.photoText}>{t('photoGallery.photo')}</Text>
      </View>
    );
  }

  if (real.length === 1) {
    return <Image source={{ uri: real[0] }} style={styles.hero} resizeMode="cover" />;
  }

  function handleMomentumScrollEnd(event) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== activeIndex) setActiveIndex(next);
  }

  function showPhoto(index) {
    setActiveIndex(index);
    try {
      heroRef.current?.scrollToIndex({ index, animated: true });
    } catch (error) {
      // Scrolling the hero is best-effort, the state change is what matters.
    }
  }

  return (
    <View>
      <FlatList
        ref={heroRef}
        data={real}
        keyExtractor={(item, index) => `${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.hero} resizeMode="cover" />
        )}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbsContent}
      >
        {real.map((uri, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => showPhoto(index)}
            accessibilityRole="button"
            accessibilityLabel={t('photoGallery.photoOfA11y', { index: index + 1, total: real.length })}
            accessibilityState={{ selected: index === activeIndex }}
          >
            <Image
              source={{ uri }}
              style={[styles.thumb, index === activeIndex && styles.thumbActive]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width,
    height: HERO_HEIGHT,
    backgroundColor: '#eef0e2',
  },
  placeholder: {
    width,
    height: HERO_HEIGHT,
    backgroundColor: '#eef0e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: '#8a8878',
    fontWeight: '600',
  },
  thumbsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#eef0e2',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#1c1c1c',
  },
});
