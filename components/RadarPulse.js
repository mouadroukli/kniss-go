import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

export default function RadarPulse({ active = true }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return undefined;

    const makeLoop = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const loop1 = makeLoop(pulse1, 0);
    const loop2 = makeLoop(pulse2, 900);
    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [active, pulse1, pulse2]);

  const ringStyle = (value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [
      { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
    ],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, ringStyle(pulse1)]} />
      <Animated.View style={[styles.ring, ringStyle(pulse2)]} />
      <View style={styles.pin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#c8ec4a',
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1c1c1c',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
