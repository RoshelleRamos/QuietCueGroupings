import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ImageBackground,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from "react-native";

type Props = {
  onSignUp: () => void;
};

export default function LoginScreen({ onSignUp }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const panelSlide = useRef(new Animated.Value(350)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // First: white panel opens from the bottom
      Animated.parallel([
        Animated.timing(panelSlide, {
          toValue: 0,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(panelOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),

      // Second: login details appear
      Animated.parallel([
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailsSlide, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [panelSlide, panelOpacity, detailsOpacity, detailsSlide]);

  return (
    <ImageBackground
      source={require("../../assets/DesignBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.panel,
              {
                opacity: panelOpacity,
                transform: [{ translateY: panelSlide }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.details,
                {
                  opacity: detailsOpacity,
                  transform: [{ translateY: detailsSlide }],
                },
              ]}
            >
              <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/QQ LOGO.png")}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>

              <Text style={styles.title}>User Login</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A58A96"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#A58A96"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showButton}
                >
                  <Text style={styles.showText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.loginButton}
                onPress={() =>
                  Alert.alert(
                    "QuietCue",
                    "Login UI is ready. Authentication will be added later."
                  )
                }
              >
                <Text style={styles.loginText}>Log In</Text>
              </Pressable>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                </Text>

                <Pressable onPress={onSignUp}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },

panel: {
  backgroundColor: "#FFFFFF",
  borderRadius: 32,
  paddingHorizontal: 26,
  paddingTop: 28,
  paddingBottom: 32,
  alignItems: "center",
  shadowColor: "#A92D60",
  shadowOpacity: 0.15,
  shadowRadius: 14,
  elevation: 5,
},

  details: {
    width: "100%",
    alignItems: "center",
  },

    logoCircle: {
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: "#FFFFFF",
      marginTop: -75,
      marginBottom: 20,
      alignItems: "center",
      justifyContent: "center",

      shadowColor: "#752444",
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.55,
      shadowRadius: 9,
      elevation: 15,

      borderWidth: 1.5,
      borderColor: "#E6A0BA",

      zIndex: 10,
    },

logo: {
  width: 108,
  height: 108,
  borderRadius: 54,
  overflow: "hidden",
},

  title: {
    fontSize: 21,
    fontWeight: "600",
    color: "#BE356C",
    marginBottom: 24,
  },

  label: {
    alignSelf: "flex-start",
    color: "#9F4268",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },

  input: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#E98DAE",
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#553241",
    backgroundColor: "#FFF9FB",
    marginBottom: 15,
  },

  passwordContainer: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#E98DAE",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9FB",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#553241",
  },

  showButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  showText: {
    color: "#BE356C",
    fontSize: 12,
    fontWeight: "600",
  },

  loginButton: {
    width: "100%",
    height: 46,
    backgroundColor: "#E9B7C9",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  loginText: {
    color: "#A02F60",
    fontSize: 15,
    fontWeight: "600",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },

  signupText: {
    fontSize: 12,
    color: "#666666",
  },

  signupLink: {
    fontSize: 12,
    color: "#BE356C",
    fontWeight: "700",
  },
});