import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";

type Role = "parent" | "family" | "child";

type Props = {
  onBack: () => void;
  onContinue: (role: Role) => void;
};

export default function RoleSelectionScreen({
  onBack,
  onContinue,
}: Props) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert("QuietCue", "Please select your role.");
      return;
    }

    onContinue(selectedRole);
  };

  return (
    <ImageBackground
      source={require("../../assets/PlainpinkBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.panel}>
          {/* CIRCULAR LOGO WITH SHADOW */}
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/QQ LOGO.png")}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.title}>Select your Role</Text>

          {/* ROLE SELECTION */}
          <View style={styles.rolesContainer}>
            <Pressable
              onPress={() => setSelectedRole("parent")}
              style={[
                styles.roleCard,
                selectedRole === "parent" && styles.selectedCard,
              ]}
            >
              <Text style={styles.roleEmoji}>👩</Text>
              <Text style={styles.roleText}>Parent</Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedRole("family")}
              style={[
                styles.roleCard,
                selectedRole === "family" && styles.selectedCard,
              ]}
            >
              <Text style={styles.roleEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.roleText}>Family</Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedRole("child")}
              style={[
                styles.roleCard,
                selectedRole === "child" && styles.selectedCard,
              ]}
            >
              <Text style={styles.roleEmoji}>👦</Text>
              <Text style={styles.roleText}>Child</Text>
            </Pressable>
          </View>

          {/* CONTINUE BUTTON */}
          <Pressable
            style={[
              styles.continueButton,
              !selectedRole && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedRole}
          >
            <Text
              style={[
                styles.continueText,
                !selectedRole && styles.disabledText,
              ]}
            >
              Continue
            </Text>
          </Pressable>

          {/* BACK BUTTON */}
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 65,
    paddingBottom: 26,
    alignItems: "center",
  },

  logoCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
    marginTop: -115,
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
    fontSize: 23,
    fontWeight: "700",
    color: "#BE356C",
    marginBottom: 25,
  },

  rolesContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 25,
  },

  roleCard: {
    flex: 1,
    minWidth: 0,
    height: 100,
    backgroundColor: "#FBE1EA",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCard: {
    backgroundColor: "#F4C8D9",
    borderColor: "#BE356C",
  },

  roleEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9E3561",
  },

  continueButton: {
    backgroundColor: "#E9B7C9",
    width: "100%",
    height: 48,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    backgroundColor: "#F2DCE4",
  },

  continueText: {
    color: "#A02F60",
    fontSize: 16,
    fontWeight: "600",
  },

  disabledText: {
    color: "#C99AAA",
  },

  backButton: {
    marginTop: 18,
    padding: 8,
  },

  backText: {
    color: "#BE356C",
    fontSize: 14,
  },
});