import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Animated,
  StyleSheet,
} from "react-native";

type Props = {
  onFinish: () => void;
};

export default function LoadingScreen({ onFinish }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -18,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [bounce, onFinish]);

  return (
    <ImageBackground
      source={require("../../assets/DesignBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Animated.View
          style={{
            transform: [{ translateY: bounce }],
          }}
        >
          <Image
            source={require("../../assets/QQ LOGO.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.loadingText}>Loading...</Text>
      </View>
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
  },

  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    marginTop: 10,
    fontWeight: "500",
  },
});