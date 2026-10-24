import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  onBack: () => void;
  onContinue: () => void;
};

export default function CreateAccountScreen({
  onBack,
  onContinue,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleCreateAccount = () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      Alert.alert("Terms and Conditions", "Please accept the terms.");
      return;
    }

    // Static UI only. No account is created yet.
    onContinue();
  };

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
        <View style={styles.panel}>
            <View style={styles.logoCircle}>
            <Image
                source={require("../../assets/QQ LOGO.png")}
                style={styles.logo}
                resizeMode="cover"
            />
            </View>

            <Text style={styles.title}>Create Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#A58A96"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#A58A96"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#A58A96"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#A58A96"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Pressable
              style={styles.termsRow}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <Text style={styles.checkbox}>
                {acceptedTerms ? "☑" : "☐"}
              </Text>
              <Text style={styles.termsText}>
                I agree to the Terms and Conditions
              </Text>
            </Pressable>

            <Pressable
              style={styles.createButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.createText}>Create Account</Text>
            </Pressable>

            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>Back to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 25,
    alignItems: "center",
  },
logoCircle: {
  width: 110,
  height: 110,
  borderRadius: 55,
  backgroundColor: "#FFFFFF",
  marginTop: -65,
  marginBottom: 15,
  alignItems: "center",
  justifyContent: "center",

  shadowColor: "#8C3B60",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 8,
},

logo: {
  width: 100,
  height: 100,
  borderRadius: 50,
  overflow: "hidden",
},

  title: {
    fontSize: 21,
    fontWeight: "600",
    color: "#BE356C",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#E98DAE",
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#FFF9FB",
    color: "#553241",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  checkbox: {
    fontSize: 20,
    color: "#BE356C",
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    color: "#666666",
  },
  createButton: {
    width: "100%",
    height: 46,
    backgroundColor: "#E9B7C9",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  createText: {
    color: "#A02F60",
    fontSize: 15,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 18,
  },
  backText: {
    color: "#BE356C",
    fontSize: 13,
    fontWeight: "500",
  },
});