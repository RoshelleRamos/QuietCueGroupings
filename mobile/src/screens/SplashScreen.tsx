import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  StatusBar,
  Animated,
  Pressable,
} from "react-native";

type Props = {
  onContinue: () => void;
};

export default function SplashScreen({ onContinue }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <ImageBackground
      source={require("../../assets/DesignBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />

      <Pressable
        style={styles.container}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Tap to continue to login"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={require("../../assets/QuietCue Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Quiet Cue</Text>

          <Text style={styles.tagline}>
            “A little quiet now, more time together later.”
          </Text>
        </Animated.View>

        <View style={styles.tapContainer} pointerEvents="none">
          <Text style={styles.tapText}>
            Tap anywhere to continue
          </Text>
        </View>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  content: {
    alignItems: "center",
    width: "100%",
  },

  logo: {
    width: 135,
    height: 135,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    textAlign: "center",
  },

  tagline: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 8,
    textAlign: "center",
  },

  tapContainer: {
    position: "absolute",
    bottom: 65,
    alignSelf: "center",
  },

  tapText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});