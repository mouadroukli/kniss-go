import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { fetchNearbyProperties } from "../api/properties";
import { isOnline } from "../utils/network";
import { findNeighborhood } from "../constants/neighborhoods";
import { formatDistance } from "../utils/format";
import RadarPulse from "../components/RadarPulse";
import ScanProgress from "../components/ScanProgress";
import { useLanguage } from "../context/LanguageContext";

// Stand-in coordinate matching our mock data, used only when a real GPS fix
// can't be obtained, mainly an emulator limitation during development.
const FALLBACK_COORDS = { latitude: 36.7538, longitude: 3.018 };

const STAGES = ["locating", "scanning", "found"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ScanningScreen({ route, navigation }) {
  const { radius, locationMode = "current", neighborhood } = route.params;
  const { t } = useLanguage();
  const isNeighborhoodMode = locationMode === "neighborhood" && !!neighborhood;
  const [stage, setStage] = useState("locating");
  const [foundCount, setFoundCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const isCancelled = useRef(false);

  useEffect(() => {
    isCancelled.current = false;
    runScan();
    return () => {
      isCancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPosition() {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
    } catch (error) {
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (!lastKnown) {
        throw error;
      }
      return lastKnown;
    }
  }

  async function searchFromCoords(latitude, longitude) {
    setStage("scanning");

    try {
      const data = await fetchNearbyProperties(latitude, longitude, radius);
      if (isCancelled.current) return;

      setFoundCount(data.count);
      setStage("found");

      setTimeout(() => {
        if (!isCancelled.current) {
          navigation.replace("Results", {
            properties: data.properties,
            radius,
          });
        }
      }, 900);
    } catch (error) {
      if (!isCancelled.current) {
        setErrorMessage(t('scanning.errorLoadFailed'));
      }
    }
  }

  async function runScan() {
    setStage("locating");
    setErrorMessage(null);

    // The scan is entirely a network round-trip, so check for a connection
    // before asking for GPS: an offline user gets a clear reason instead of
    // a confusing "couldn't load properties" after locating them fine.
    if (!(await isOnline())) {
      if (!isCancelled.current) {
        setErrorMessage(t('scanning.errorOffline'));
      }
      return;
    }

    // A chosen neighbourhood already has a real coordinate (see
    // constants/neighborhoods.js), so no GPS lock is needed and nothing to
    // ask permission for. A short pause keeps the "locating" step from being
    // an instant flash, but this path is otherwise honest about not using GPS.
    if (isNeighborhoodMode) {
      const place = findNeighborhood(neighborhood);
      if (!place) {
        if (!isCancelled.current) {
          setErrorMessage(t('scanning.errorNeighborhoodGone'));
        }
        return;
      }
      await wait(600);
      if (isCancelled.current) return;
      searchFromCoords(place.latitude, place.longitude);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      if (!isCancelled.current) {
        setErrorMessage(t('scanning.errorLocationDenied'));
      }
      return;
    }

    let position;
    try {
      position = await getPosition();
    } catch (error) {
      console.log("Location error:", error.code, error.message);
      if (!isCancelled.current) {
        setErrorMessage(t('scanning.errorLocationRead'));
      }
      return;
    }
    if (isCancelled.current) return;

    searchFromCoords(position.coords.latitude, position.coords.longitude);
  }

  function handleCancel() {
    isCancelled.current = true;
    navigation.goBack();
  }

  function handleUseFallbackLocation() {
    setErrorMessage(null);
    searchFromCoords(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude);
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t('scanning.errorTitle')}</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={runScan}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
        </TouchableOpacity>
        {!isNeighborhoodMode ? (
          <TouchableOpacity
            style={styles.fallbackButton}
            onPress={handleUseFallbackLocation}
            accessibilityRole="button"
          >
            <Text style={styles.fallbackButtonText}>{t('scanning.continueTestLocation')}</Text>
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    );
  }

  const placeLabel = isNeighborhoodMode ? neighborhood.toLowerCase() : t('scanning.nearYou');
  const STAGE_META = {
    locating: {
      icon: "navigate-circle-outline",
      headline: t('scanning.locatingHeadline'),
      subtitle: isNeighborhoodMode
        ? t('scanning.locatingSubtitleNeighborhood', { neighborhood })
        : t('scanning.locatingSubtitleGps'),
    },
    scanning: {
      icon: "wifi-outline",
      headline: t('scanning.scanningHeadline', { radius: formatDistance(radius) }),
      subtitle: isNeighborhoodMode
        ? t('scanning.scanningSubtitleNeighborhood', { neighborhood })
        : t('scanning.scanningSubtitleGps'),
    },
    found: {
      icon: "checkmark-circle-outline",
      headline:
        foundCount === 1
          ? t('scanning.foundHeadlineOne')
          : t('scanning.foundHeadlineOther', { count: foundCount }),
      subtitle: t('scanning.foundSubtitle'),
    },
  };
  const meta = STAGE_META[stage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapArea}>
        {/* No real map — the radar visual is this app's stand-in, same as
            the plain radius picker before it. */}
        <RadarPulse active={stage !== "found"} />
      </View>

      <View style={styles.card}>
        <ScanProgress
          label={t('scanning.label', { place: placeLabel })}
          step={STAGES.indexOf(stage) + 1}
          totalSteps={STAGES.length}
        />

        <View style={styles.stageIcon}>
          <Ionicons name={meta.icon} size={22} color="#1c1c1c" />
        </View>
        <Text style={styles.stageHeadline}>{meta.headline}</Text>
        <Text style={styles.stageSubtitle}>{meta.subtitle}</Text>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={t('scanning.cancel')}
        >
          <Text style={styles.cancelButtonText}>{t('scanning.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  mapArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f6f1",
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#f1efe8",
    padding: 24,
    alignItems: "center",
  },
  stageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1efe8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  stageHeadline: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1c1c",
    textAlign: "center",
  },
  stageSubtitle: {
    fontSize: 13,
    color: "#8a8878",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: "#f1efe8",
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#5f5e5a",
    fontWeight: "600",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c1c1c",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#5f5e5a",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#1c1c1c",
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  fallbackButton: {
    marginTop: 16,
    paddingVertical: 10,
  },
  fallbackButtonText: {
    fontSize: 13,
    color: "#8a8878",
    textDecorationLine: "underline",
  },
});
